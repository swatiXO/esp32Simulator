import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { redeemLimiter } from '@/lib/ratelimit';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // ── Auth ──────────────────────────────────────────────────────────
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Rate limit ────────────────────────────────────────────────────
    const { success, limit, remaining, reset } = await redeemLimiter.limit(user.id);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many attempts. Please wait 15 minutes before trying again.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(reset),
          },
        }
      );
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    const body = await request.json();
    const code = typeof body?.code === 'string' ? body.code.trim() : '';

    if (!code) {
      return NextResponse.json({ error: 'Activation code is required' }, { status: 400 });
    }

    // ── Fetch code ────────────────────────────────────────────────────
    const { data: kitCode, error: fetchError } = await supabaseAdmin
      .from('kit_codes')
      .select('*')
      .eq('code', code)
      .single();

    if (fetchError || !kitCode) {
      // Generic message — don't reveal whether the code exists
      return NextResponse.json({ error: 'This code is invalid or unavailable' }, { status: 404 });
    }

    if (!kitCode.is_active) {
      return NextResponse.json({ error: 'This code is invalid or unavailable' }, { status: 400 });
    }

    if (kitCode.redeemed_by) {
      if (kitCode.redeemed_by === user.id) {
        return NextResponse.json({ error: 'You have already redeemed this kit code' }, { status: 400 });
      }
      // Generic — don't reveal the code is taken (prevents enumeration)
      return NextResponse.json({ error: 'This code is invalid or unavailable' }, { status: 400 });
    }

    // ── Redeem ────────────────────────────────────────────────────────
    const redeemedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const { error: updateError } = await supabaseAdmin
      .from('kit_codes')
      .update({ redeemed_by: user.id, redeemed_at: redeemedAt, expires_at: expiresAt })
      .eq('code', code);

    if (updateError) {
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, kit_type: kitCode.kit_type, expires_at: expiresAt },
      { status: 200 }
    );

  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
