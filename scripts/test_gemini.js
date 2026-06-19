const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function test() {
  const key = process.env.GEMINI_API_KEY;
  console.log('API Key:', key ? 'Loaded' : 'Missing');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hello, are you there?' }] }]
      })
    });
    console.log('Status:', res.status, res.statusText);
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
