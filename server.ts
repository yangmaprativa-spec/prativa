import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { generateCompanionReply } from './src/server/geminiService.ts';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API route for AI Character Chat
app.post('/api/chat', async (req, res) => {
  try {
    const payload = req.body;
    const result = await generateCompanionReply(payload);
    res.json(result);
  } catch (error: any) {
    console.error('Server chat endpoint error:', error);
    res.status(500).json({
      reply: "I'm having a little trouble connecting, but I'm so happy to be here with you! 💕",
      emotion: "happy"
    });
  }
});

// Serve static assets from dist
app.use(express.static(path.resolve('.', 'dist')));

// Fallback to index.html for SPA client routing
app.get('*', (req, res) => {
  res.sendFile(path.resolve('.', 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
