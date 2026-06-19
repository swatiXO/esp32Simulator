import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { explainCodeLimiter } from '@/lib/ratelimit';

export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Rate limit ────────────────────────────────────────────────────
    const { success } = await explainCodeLimiter.limit(user.id);
    if (!success) {
      return NextResponse.json(
        { error: 'You\'ve used a lot of explanations today. Try again in an hour.' },
        { status: 429 }
      );
    }

    // ── Validate ──────────────────────────────────────────────────────
    const body = await request.json();
    const code = typeof body?.code === 'string' ? body.code.trim() : '';

    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 500 });
    }

    // ── Gemini call ───────────────────────────────────────────────────
    const prompt = `You are a friendly ESP32 coding tutor explaining Arduino C++ code to a beginner student.

Analyze the following Arduino C++ code and explain what it does in plain English.

Rules:
- Write in a friendly, encouraging tone suitable for a teenager or beginner
- Break your explanation into short, clear steps
- Respond ONLY with a valid JSON object in this exact shape:
  {
    "summary": "One sentence describing what the whole program does",
    "steps": [
      { "line": "The code snippet or block name", "explain": "What this part does in plain English" }
    ],
    "tip": "One helpful tip or interesting fact about this code"
  }
- No markdown. No code fences. Raw JSON only.

Code to explain:
\`\`\`cpp
${code}
\`\`\``;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4000,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const err = await geminiResponse.json().catch(() => ({}));
      const message = err?.error?.message || 'Unknown Gemini error';
      return NextResponse.json({ error: 'AI service error: ' + message }, { status: 502 });
    }

    const data = await geminiResponse.json();
    let raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    raw = raw.replace(/```json|```/g, '').trim();

    let parsed: { summary: string; steps: { line: string; explain: string }[]; tip: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Could not parse AI response' }, { status: 400 });
    }

    return NextResponse.json(parsed, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
