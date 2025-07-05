require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Permette al tuo sito WordPress di comunicare con questo motore
app.use(express.json({ limit: '10mb' })); // Permette di ricevere dati (prompt lunghi)

// Endpoint principale
app.post('/api/generate', async (req, res) => {
  const { llm, apiKey, prompt } = req.body;

  if (!llm || !apiKey || !prompt) {
    return res.status(400).json({ error: 'Missing llm, apiKey, or prompt' });
  }

  try {
    let generatedText = '';

    switch (llm) {
      case 'gemini-1.5-pro-latest':
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: llm });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        generatedText = response.text();
        break;

      case 'gpt-4o': // Il modello più recente e potente di OpenAI
        const openai = new OpenAI({ apiKey });
        const chatCompletion = await openai.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: llm,
        });
        generatedText = chatCompletion.choices[0].message.content;
        break;

      case 'claude-3-opus-20240229': // Il modello più potente di Anthropic
        const anthropic = new Anthropic({ apiKey });
        const msg = await anthropic.messages.create({
          model: llm,
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }],
        });
        generatedText = msg.content[0].text;
        break;

      default:
        return res.status(400).json({ error: 'Unsupported LLM specified' });
    }

    res.json({ text: generatedText });

  } catch (error) {
    console.error(`Error with ${llm}:`, error);
    res.status(500).json({ error: `An error occurred while communicating with the ${llm} API. Check your API Key and permissions.` });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});