export default async function handler(req, res) {
  // Set CORS headers to allow your website to call this API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { question, profile } = req.body;
    const API_KEY = process.env.GOOGLE_AI_KEY;
    
    console.log('API_KEY exists:', !!API_KEY);
    console.log('Question:', question);
    console.log('Profile keys:', Object.keys(profile));
    
    if (!API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }
    
    // Create the prompt
    const userProfileText = JSON.stringify(profile);
    const finalPrompt = `You are Knowme AI, a personal decision advisor.

USER'S PROFILE:
${userProfileText}

USER'S QUESTION: "${question}"

INSTRUCTIONS:
1. Provide helpful, personalized advice based on their profile
2. Give 2-3 practical action steps
3. Keep response focused and actionable
4. Reference their specific situation when possible
5. Be supportive and encouraging

Provide good advice that fits their unique situation.`;

    console.log('Calling Google API...');
    
    // UPDATED: Using gemini-1.5-flash-latest which should work
  const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`, {      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: finalPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        }
      })
    });
    
    console.log('Google API response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.log('Google API error:', errorData);
      throw new Error(`API Error: ${errorData.error?.message || JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    console.log('Google API success');
    
    // Check if we have valid response data
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response format from API');
    }
    
    const advice = data.candidates[0].content.parts[0].text;
    
    // Return the advice
    res.status(200).json({ advice });
    
  } catch (error) {
    console.error('Error in handler:', error);
    res.status(500).json({ error: 'Failed to get advice: ' + error.message });
  }
}
