import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { generateQuizLimiter } from '@/lib/ratelimit';

export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Rate limit ────────────────────────────────────────────────────
    const { success } = await generateQuizLimiter.limit(user.id);
    if (!success) {
      return NextResponse.json(
        { error: 'Quiz generation limit reached. Try again in an hour.' },
        { status: 429 }
      );
    }

    // ── Validate ──────────────────────────────────────────────────────
    const body = await request.json();
    const lectureContent = typeof body?.lectureContent === 'string' ? body.lectureContent.trim() : '';
    const lectureTitle = typeof body?.lectureTitle === 'string' ? body.lectureTitle.trim() : 'this lesson';

    if (!lectureContent) {
      return NextResponse.json({ error: 'No lecture content provided' }, { status: 400 });
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 500 });
    }

    // ── Gemini call ───────────────────────────────────────────────────
    const prompt = `You are a quiz generator for an ESP32 IoT learning platform for students.

Based on the following lecture content about "${lectureTitle}", generate exactly 3 multiple-choice quiz questions.

Rules:
- Questions should test genuine understanding, not just memory
- Each question must have exactly 4 options (A, B, C, D)
- Exactly 1 option must be correct
- Difficulty should be beginner-friendly but not trivial
- Respond ONLY with a valid JSON array in this exact shape (no markdown, no code fences):
[
  {
    "question": "The question text",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correctIndex": 0,
    "explanation": "Brief explanation of why the correct answer is right"
  }
]

Lecture content:
${lectureContent.slice(0, 4000)}`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
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

    let questions: { question: string; options: string[]; correctIndex: number; explanation: string }[];
    try {
      questions = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Could not parse AI response' }, { status: 400 });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'No questions generated' }, { status: 400 });
    }

    return NextResponse.json({ questions }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
