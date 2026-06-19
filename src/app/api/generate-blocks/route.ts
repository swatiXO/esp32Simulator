import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { generateBlocksLimiter } from '@/lib/ratelimit';

export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Rate limit ────────────────────────────────────────────────────
    const { success, limit, remaining, reset } = await generateBlocksLimiter.limit(user.id);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before generating again.' },
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

    // ── Validate body ─────────────────────────────────────────────────
    const body = await request.json();
    const prompt = typeof body?.prompt === 'string' ? body.prompt : '';
    const catalogue = Array.isArray(body?.catalogue) ? body.catalogue : [];

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }
    if (!prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // ── Gemini call ───────────────────────────────────────────────────
    const fullPrompt =
      'You are an ESP32 IoT block coding assistant.\n' +
      'The user will describe what they want their ESP32 to do \n' +
      'in plain English.\n' +
      'You must respond ONLY with a valid JSON array of block \n' +
      'objects — no explanation, no markdown, no extra text, \n' +
      'no code fences.\n\n' +
      'Each block object must have:\n' +
      '- "type": one of the available block types\n' +
      '- "icon": the corresponding emoji icon\n' +
      '- "label": the block label template string\n' +
      '- "params": array of param definitions (same as catalogue)\n' +
      '- "values": object with the actual values for each param\n\n' +
      'Available blocks catalogue:\n' +
      JSON.stringify(catalogue) +
      '\n\n' +
      'Rules:\n' +
      '1. Always start with serial_begin if the user wants output\n' +
      '2. Always add pinMode before dw_high/dw_low\n' +
      '3. Always add dht_setup before dht_temp/dht_hum\n' +
      '4. Always close if_block with end_if\n' +
      '5. Always close for_loop/while_loop with end_loop\n' +
      '6. Use pin 48 as default LED pin for ESP32-S3\n' +
      '7. Respond ONLY with the raw JSON array. \n' +
      '   No markdown. No backticks.\n\n' +
      'User request: ' +
      prompt;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4000,
            responseMimeType: 'application/json',
          },
        }),
      },
    );

    if (!geminiResponse.ok) {
      const err = await geminiResponse.json().catch(() => ({}));
      const message = err?.error?.message || 'Unknown Gemini error';
      return NextResponse.json({ error: 'Gemini API error: ' + message }, { status: 502 });
    }

    const data = await geminiResponse.json();
    let raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    raw = raw.replace(/```json|```/g, '').trim();

    let parsedArray: unknown;
    try {
      parsedArray = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'No blocks returned from AI' }, { status: 400 });
    }

    if (!Array.isArray(parsedArray) || parsedArray.length === 0) {
      return NextResponse.json({ error: 'No blocks returned from AI' }, { status: 400 });
    }

    return NextResponse.json({ blocks: parsedArray }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}