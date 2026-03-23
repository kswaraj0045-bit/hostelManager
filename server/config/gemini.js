import fetch from 'node-fetch'

export const askGemini = async (userMessage, contextString) => {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`

    const body = {
      contents: [
        {
          parts: [
            {
              text: `You are HostelBot, a helpful assistant for college hostel students.
You know everything about the user's groups, expenses, chores and bills.
Answer clearly and concisely in a friendly tone.
Here is the current data about this user:

${contextString}

User question: ${userMessage}`
            }
          ]
        }
      ]
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data?.error?.message || 'Gemini API error')
    }

    return data.candidates[0].content.parts[0].text

  } catch (err) {
    console.error('Gemini error:', err.message)
    throw new Error('AI service failed: ' + err.message)
  }
}