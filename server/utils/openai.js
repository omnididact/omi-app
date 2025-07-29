import OpenAI from 'openai';

// Initialize OpenAI client lazily to ensure environment variables are loaded
let openai = null;

const getOpenAIClient = () => {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key'
    });
  }
  return openai;
};

export const invokeLLM = async ({ prompt, response_json_schema, model = 'gpt-4o-mini' }) => {
  try {
    const messages = [
      {
        role: 'user',
        content: prompt
      }
    ];

    let requestOptions = {
      model,
      messages,
      temperature: 0.7
    };

    // If JSON schema is provided, use structured outputs
    if (response_json_schema) {
      requestOptions.response_format = {
        type: 'json_schema',
        json_schema: {
          name: 'response',
          schema: response_json_schema
        }
      };
    }

    const completion = await getOpenAIClient().chat.completions.create(requestOptions);
    const response = completion.choices[0].message.content;

    // If JSON schema was requested, parse the response
    if (response_json_schema) {
      return JSON.parse(response);
    }

    return response;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to process AI request');
  }
};

export const transcribeAudio = async (audioBuffer) => {
  try {
    // Create a File-like object from the buffer
    const audioFile = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' });
    
    const transcription = await getOpenAIClient().audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en'
    });

    return transcription.text;
  } catch (error) {
    console.error('Whisper API error:', error);
    if (error.status === 404) {
      throw new Error('Whisper model not available. Please check your OpenAI API access.');
    }
    throw new Error('Failed to transcribe audio: ' + error.message);
  }
};

export const generateImage = async (prompt, options = {}) => {
  try {
    const response = await getOpenAIClient().images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: options.size || '1024x1024',
      quality: options.quality || 'standard'
    });

    return response.data[0].url;
  } catch (error) {
    console.error('DALL-E API error:', error);
    if (error.status === 404) {
      throw new Error('DALL-E model not available. Please check your OpenAI API access.');
    }
    throw new Error('Failed to generate image: ' + error.message);
  }
};