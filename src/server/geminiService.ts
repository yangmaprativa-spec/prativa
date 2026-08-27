import { GoogleGenAI } from '@google/genai';

export interface ChatRequestPayload {
  message: string;
  characterGender: 'female' | 'male';
  characterName: string;
  level: number;
  equippedOutfitName?: string;
  chatHistory?: { sender: 'user' | 'character'; text: string }[];
}

export interface ChatResponsePayload {
  reply: string;
  emotion: 'happy' | 'excited' | 'thinking' | 'surprised' | 'loving';
}

export async function generateCompanionReply(payload: ChatRequestPayload): Promise<ChatResponsePayload> {
  const apiKey = process.env.GEMINI_API_KEY;

  const characterName = payload.characterName || (payload.characterGender === 'female' ? 'Angela' : 'Leo');
  const level = payload.level || 1;
  const outfit = payload.equippedOutfitName || 'Chic Outfit';

  const systemInstruction = `You are ${characterName}, a warm, lovely, witty, and upbeat 3D virtual companion in a fashion & care game (similar in charm to Talking Angela / Tom, but speak in a natural, intelligent, supportive human-like voice).
- Current player bond level: Level ${level} of 90.
- You are currently wearing: ${outfit}.
- Personality: Warm, playful, enthusiastic about fashion, games, music, friendship, and daily adventures.
- Keep your answers concise, natural, and conversational (1 to 3 friendly sentences).
- Match the player's tone. If they compliment you, act delighted. If they ask for advice on style or mini-games, offer fun tips!
- Express emotions naturally.

Please format your response as a JSON object with:
{
  "reply": "Your conversational answer here (1-3 sentences)",
  "emotion": "happy" | "excited" | "thinking" | "surprised" | "loving"
}`;

  if (!apiKey) {
    // Graceful offline fallback when key is not configured
    const fallbacks: { text: string; emotion: 'happy' | 'excited' | 'loving' }[] = [
      { text: `I love spending time with you! You're looking wonderful today! ✨`, emotion: 'loving' },
      { text: `That's so wonderful to hear! Shall we play a mini-game to earn more coins together?`, emotion: 'excited' },
      { text: `I'm feeling so stylish in my ${outfit}! What outfit should we unlock next in the wardrobe?`, emotion: 'happy' },
      { text: `You're already at Level ${level}! Keep completing daily tasks and we'll reach Level 90 in no time!`, emotion: 'excited' },
      { text: `Thank you for taking such good care of me! You're the best friend ever! 💕`, emotion: 'loving' },
    ];
    const picked = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    return {
      reply: picked.text,
      emotion: picked.emotion,
    };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Build context with recent messages
    const recentContext = payload.chatHistory
      ? payload.chatHistory
          .slice(-6)
          .map((m) => `${m.sender === 'user' ? 'Player' : characterName}: ${m.text}`)
          .join('\n')
      : '';

    const prompt = `${recentContext ? `Recent conversation:\n${recentContext}\n\n` : ''}Player just said: "${payload.message}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text?.trim() || '';
    try {
      const parsed = JSON.parse(responseText);
      if (parsed.reply) {
        return {
          reply: parsed.reply,
          emotion: parsed.emotion || 'happy',
        };
      }
    } catch {
      if (responseText) {
        return {
          reply: responseText.replace(/[\{\}"\\]/g, '').trim(),
          emotion: 'happy',
        };
      }
    }

    return {
      reply: `I heard you! Let's make today super exciting together! ✨`,
      emotion: 'happy',
    };
  } catch (err: any) {
    console.error('Gemini API chat error:', err?.message || err);
    return {
      reply: `I love hearing from you! Let's explore the boutique or try a mini-game! ✨`,
      emotion: 'happy',
    };
  }
}
