// ─────────────────────────────────────────────────────────────────────────
// BUILD MIND — certificate API
// src/app/api/certificate/route.ts
//
// GET  -> returns { status: 'issued', certificate } if the user already has one,
//         else { status: 'eligible' | 'locked', eligibility } based on real
//         completion (21 lessons + all activity ids), never user_progress.
//
// POST -> body { school, class }. Re-verifies eligibility server-side, then
//         issues the certificate ONCE (frozen). Returns the certificate.
//
// Verification is entirely server-side. The client cannot forge completion.
// ─────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { computeEligibility, makeCertificateCode } from '@/lib/certificateEligibility';

// Adjust this to match the actual table/columns where progress lives.
const PROGRESS_TABLE = 'user_activities';
const PROGRESS_LESSONS_COL = 'completed_lessons';
const PROGRESS_ACTIVITIES_COL = 'completed';

async function loadContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'unauthorized' as const };

  // 1) the user's real completion arrays
  const { data: progress, error: pErr } = await supabase
    .from(PROGRESS_TABLE)
    .select(`${PROGRESS_LESSONS_COL}, ${PROGRESS_ACTIVITIES_COL}`)
    .eq('user_id', user.id)
    .maybeSingle();
  if (pErr) return { error: 'progress_unavailable' as const };

  // 2) the live, authoritative activity id set
  const { data: acts, error: aErr } = await supabase.from('activities').select('id');
  if (aErr) return { error: 'activities_unavailable' as const };

  const allActivityIds = (acts ?? []).map((a: { id: string }) => a.id);
  const completedLessons = (progress?.[PROGRESS_LESSONS_COL] as string[]) ?? [];
  const completedActivities = (progress?.[PROGRESS_ACTIVITIES_COL] as string[]) ?? [];

  const eligibility = computeEligibility(completedLessons, completedActivities, allActivityIds);
  return { supabase, user, eligibility };
}

export async function GET() {
  const ctx = await loadContext();
  if ('error' in ctx) {
    const code = ctx.error === 'unauthorized' ? 401 : 500;
    return NextResponse.json({ error: ctx.error }, { status: code });
  }
  const { supabase, user, eligibility } = ctx;

  // already issued? return the frozen certificate
  const { data: existing } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ status: 'issued', certificate: existing });
  }

  return NextResponse.json({
    status: eligibility.eligible ? 'eligible' : 'locked',
    eligibility,
  });
}

export async function POST(req: Request) {
  const ctx = await loadContext();
  if ('error' in ctx) {
    const code = ctx.error === 'unauthorized' ? 401 : 500;
    return NextResponse.json({ error: ctx.error }, { status: code });
  }
  const { supabase, user, eligibility } = ctx;

  // never issue if not actually complete
  if (!eligibility.eligible) {
    return NextResponse.json({ error: 'not_eligible', eligibility }, { status: 403 });
  }

  // already issued -> return existing (idempotent, frozen)
  const { data: existing } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ status: 'issued', certificate: existing });
  }

  // validate form input
  const body = await req.json().catch(() => null);
  const school = String(body?.school ?? '').trim();
  const klass = String(body?.class ?? '').trim();
  if (!school || !klass || school.length > 80 || klass.length > 40) {
    return NextResponse.json({ error: 'invalid_form' }, { status: 400 });
  }

  // recipient name from user_metadata.name (fallback to email prefix)
  const name =
    (user.user_metadata?.name as string | undefined)?.trim() ||
    user.email?.split('@')[0] ||
    'Learner';

  // generate a stable id + readable code
  const id = crypto.randomUUID();
  const certificate_code = makeCertificateCode(id);

  const { data: inserted, error: insErr } = await supabase
    .from('certificates')
    .insert({
      id,
      user_id: user.id,
      certificate_code,
      recipient_name: name,
      school,
      class: klass,
      program: 'Build Mind',
      lessons_completed: eligibility.doneLessons,
      activities_completed: eligibility.doneActivities,
    })
    .select('*')
    .single();

  // unique violation -> someone raced us; return the existing row
  if (insErr) {
    const { data: race } = await supabase
      .from('certificates')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (race) return NextResponse.json({ status: 'issued', certificate: race });
    return NextResponse.json({ error: 'issue_failed' }, { status: 500 });
  }

  // persist school/class onto user_metadata too (so it is remembered)
  await supabase.auth.updateUser({ data: { school, class: klass } }).catch(() => {});

  return NextResponse.json({ status: 'issued', certificate: inserted });
}