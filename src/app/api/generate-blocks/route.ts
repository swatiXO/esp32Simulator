import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // ── Auth guard: only authenticated users can hit this billable endpoint ──
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Guard against oversized prompts (cost + abuse control)
    if (prompt.length > 1000) {
      return NextResponse.json({ error: 'Prompt is too long' }, { status: 400 });
    }

    const fullPrompt =
      'You are an ESP32 IoT block coding assistant.\n' +
      'The user will describe what they want their ESP32 to do \n' +
      'in plain English.\n' +
      'You must respond ONLY with a valid JSON array of block \n' +
      'objects — no explanation, no markdown, no extra text, \n' +
      'no code fences.\n\n' +
      'Each block object must have:\n' +
      '- "type": one of the available block types\n' +
      '- "icon": the corresponding icon key\n' +
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
      '6. For any pin value, ONLY use pins that exist in the catalogue ' +
      'param options. Use pin "2" as the default LED pin (ESP32 WROOM-32 ' +
      'built-in LED). Never use pin 48 or any pin not listed in the options.\n' +
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
          generationConfig: { temperature: 0.2, maxOutputTokens: 2000 },
        }),
      },
    );

    if (!geminiResponse.ok) {
      // Log full detail server-side, return generic message to client
      const err = await geminiResponse.json().catch(() => ({}));
      console.error('[generate-blocks] Gemini API error:', err?.error?.message || err);
      return NextResponse.json({ error: 'AI service error' }, { status: 502 });
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
  } catch (err) {
    console.error('[generate-blocks] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}