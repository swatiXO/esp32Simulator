const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function testExplain() {
  const key = process.env.GEMINI_API_KEY;
  console.log('API Key:', key ? 'Loaded' : 'Missing');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
  
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
void setup() {
  pinMode(2, OUTPUT);
}
void loop() {
  digitalWrite(2, HIGH);
  delay(500);
  digitalWrite(2, LOW);
  delay(500);
}
\`\`\``;

  try {
    const res = await fetch(url, {
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
    });
    console.log('Status:', res.status, res.statusText);
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    let raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('Raw text output:', raw);
    
    const parsed = JSON.parse(raw);
    console.log('Parsed successfully:', parsed);
  } catch (err) {
    console.error('Error:', err);
  }
}

testExplain();
