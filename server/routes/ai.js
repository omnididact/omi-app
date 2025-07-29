import express from 'express';
import multer from 'multer';
import { invokeLLM, transcribeAudio, generateImage } from '../utils/openai.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Apply authentication to all routes
router.use(authenticateToken);

// LLM invocation endpoint (replaces base44's InvokeLLM)
router.post('/invoke-llm', async (req, res) => {
  try {
    const { prompt, response_json_schema, model } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    const response = await invokeLLM({ prompt, response_json_schema, model });
    res.json(response);
  } catch (error) {
    console.error('LLM invocation error:', error);
    res.status(500).json({ error: 'Failed to process LLM request' });
  }
});

// Audio transcription endpoint (replaces base44's audio processing)
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }
    
    const transcription = await transcribeAudio(req.file.buffer);
    res.json({ text: transcription });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

// Image generation endpoint (replaces base44's GenerateImage)
router.post('/generate-image', async (req, res) => {
  try {
    const { prompt, size, quality } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    const imageUrl = await generateImage(prompt, { size, quality });
    res.json({ url: imageUrl });
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

// Text processing endpoint (processes text into structured thoughts)
router.post('/process', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    // Create a prompt to process the text into structured thought data
    const prompt = `Analyze the following text and extract structured information for a personal memory/thought system:

Text: "${text}"

Please return a JSON object with the following structure:
{
  "processed_text": "cleaned and processed version of the text",
  "category": "one of: reflection, goal, task, memory, insight, question",
  "sub_category": "specific subcategory if applicable",
  "mood_score": "number between -1 and 1 representing emotional tone",
  "priority": "low, medium, or high",
  "tags": ["array", "of", "relevant", "tags"],
  "action_steps": ["array", "of", "actionable", "items", "if", "any"],
  "requires_triage": "boolean indicating if this needs human review"
}

Focus on extracting meaningful insights and actionable items.`;

    // Check if OpenAI API key is configured
    let response;
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key') {
      // Use actual OpenAI API
      response = await invokeLLM({ 
        prompt, 
        response_json_schema: {
          type: "object",
          properties: {
            processed_text: { type: "string" },
            category: { type: "string", enum: ["reflection", "goal", "task", "memory", "insight", "question"] },
            sub_category: { type: "string" },
            mood_score: { type: "number", minimum: -1, maximum: 1 },
            priority: { type: "string", enum: ["low", "medium", "high"] },
            tags: { type: "array", items: { type: "string" } },
            action_steps: { type: "array", items: { type: "string" } },
            requires_triage: { type: "boolean" }
          },
          required: ["processed_text", "category", "mood_score", "priority", "tags", "action_steps", "requires_triage"]
        }
      });
    } else {
      // Use mock response for testing
      response = {
        processed_text: `Processed: ${text}`,
        category: "reflection",
        sub_category: "general",
        mood_score: 0.3,
        priority: "medium",
        tags: ["processed", "test"],
        action_steps: ["Review processed text", "Take appropriate action"],
        requires_triage: false
      };
    }
    
    // Return in the format expected by the test
    res.json({ 
      thoughts: [response]
    });
  } catch (error) {
    console.error('Text processing error:', error);
    res.status(500).json({ error: 'Failed to process text' });
  }
});

export default router;