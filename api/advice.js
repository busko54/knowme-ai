// pages/api/advice.js
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question, profile } = req.body;
    const API_KEY = process.env.GOOGLE_AI_KEY;

    console.log('API_KEY exists:', !!API_KEY);
    console.log('Question:', question);
    console.log('Profile keys:', Object.keys(profile || {}));

    if (!API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Build prompt
    const finalPrompt = `You are Knowme AI, a personal decision advisor.
USER'S PROFILE:
${JSON.stringify(profile || {}, null, 2)}
USER'S QUESTION: "${question}"

INSTRUCTIONS:
1. Give personalized, practical advice based on their profile
2. Include 2-3 clear action steps
3. Reference their situation (e.g. income, goals, risk tolerance)
4. Be direct, supportive, and encouraging
5. Keep response under 300 words

Respond in clean, readable bullet points.`;

    console.log('Calling Google API...');

    // Correct model + API version + full fetch
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: finalPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    console.log('Google API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('Google API error:', errorData);
      throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Google API success');

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini');
    }

    const advice = data.candidates[0].content.parts[0].text;

    return res.status(200).json({ advice });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({
      error: 'Failed to get advice: ' + error.message,
    });
  }
}
