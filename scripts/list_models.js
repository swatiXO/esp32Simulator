const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function listModels() {
  const key = process.env.GEMINI_API_KEY;
  console.log('API Key:', key ? 'Loaded' : 'Missing');
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  
  try {
    const res = await fetch(url);
    console.log('Status:', res.status, res.statusText);
    const data = await res.json();
    if (data.models) {
      console.log('Available models:');
      data.models.forEach(m => {
        console.log(`- ${m.name} (${m.displayName}) - Supported actions: ${m.supportedGenerationMethods.join(', ')}`);
      });
    } else {
      console.log('No models returned. Response:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

listModels();
