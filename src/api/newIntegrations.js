import { apiClient } from './client.js';

export const InvokeLLM = async ({ prompt, response_json_schema, model }) => {
  const response = await apiClient.post('/ai/invoke-llm', {
    prompt,
    response_json_schema,
    model
  });
  return response;
};

export const TranscribeAudio = async (audioBlob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  
  const response = await apiClient.request('/ai/transcribe', {
    method: 'POST',
    body: formData,
    headers: {}, // Let the browser set Content-Type for FormData
  });
  
  return response.text;
};

export const GenerateImage = async (prompt, options = {}) => {
  const response = await apiClient.post('/ai/generate-image', {
    prompt,
    ...options
  });
  return response.url;
};

// For compatibility with the existing base44 integration structure
export const Core = {
  InvokeLLM,
  TranscribeAudio,
  GenerateImage,
  
  // Placeholder for other integrations that might be needed
  SendEmail: async (data) => {
    throw new Error('Email sending not implemented in migration');
  },
  
  UploadFile: async (file) => {
    throw new Error('File upload not implemented in migration');
  },
  
  ExtractDataFromUploadedFile: async (fileId) => {
    throw new Error('File data extraction not implemented in migration');
  }
};