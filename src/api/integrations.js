import { Core as CoreIntegrations, InvokeLLM as LLMService, TranscribeAudio as AudioTranscription } from './newIntegrations.js';

export const Core = CoreIntegrations;
export const InvokeLLM = LLMService;
export const TranscribeAudio = AudioTranscription;
export const SendEmail = CoreIntegrations.SendEmail;
export const UploadFile = CoreIntegrations.UploadFile;
export const GenerateImage = CoreIntegrations.GenerateImage;
export const ExtractDataFromUploadedFile = CoreIntegrations.ExtractDataFromUploadedFile;






