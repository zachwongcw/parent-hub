export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, studentId } = req.body;

  if (!messages || !studentId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing");
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Convert frontend messages to Gemini format
    const geminiMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const systemPrompt = `You are a triage assistant for a Parent Information Hub for a primary school.
Student ID in context: ${studentId}.
Your goal is to provide polite, supportive answers using standard school policies and Psychological First Aid.
Keep your answers structured, empathetic, and do not diagnose any clinical conditions.`;

    const requestBody = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: geminiMessages,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      throw new Error('API Error');
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't understand that.";

    res.status(200).json({ reply: replyText });

  } catch (error) {
    console.error("Chat API error:", error);
    res.status(500).json({ reply: "I'm having trouble connecting to my AI brain right now. Please try again later." });
  }
}
