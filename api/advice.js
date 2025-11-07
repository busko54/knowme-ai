// pages/api/advice.js
// FORCE VERCEL REBUILD — NOV 7 2025 — 100% WORKING

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const API_KEY = process.env.GOOGLE_AI_KEY;

  console.log('KEY:', API_KEY ? 'YES' : 'NO');
  console.log('MODEL: gemini-1.5-flash-latest');
  console.log('API: v1');

  if (!API_KEY) return res.status(500).json({ error: 'No key' });

  try {
    const { question = 'test', profile = {} } = req.body;

    const prompt = `Profile: ${JSON.stringify(profile)}\nQuestion: "${question}"\nAnswer in 3 bullets.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );

    if (!response.ok) {
      const err = await response.json();
      return res.status(500).json({ error: err.error?.message || 'Gemini failed' });
    }

    const data = await response.json();
    const advice = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';

    return res.status(200).json({ advice });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
