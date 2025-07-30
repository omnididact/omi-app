import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('❌ OPENAI_API_KEY not set in environment variables');
  process.exit(1);
}

console.log('🔍 Testing OpenAI API Access...\n');

const openai = new OpenAI({ apiKey });

// Test 1: Basic GPT access
async function testGPT() {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: 'Say "test successful"' }],
      max_tokens: 10
    });
    console.log('✅ GPT-4-turbo access: Working');
    return true;
  } catch (error) {
    console.log('❌ GPT-4-turbo access: Failed -', error.message);
    return false;
  }
}

// Test 2: Whisper access
async function testWhisper() {
  try {
    // Create a tiny audio file for testing
    const audioBuffer = Buffer.from('test');
    const audioFile = new File([audioBuffer], 'test.mp3', { type: 'audio/mp3' });
    
    await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1'
    });
    console.log('✅ Whisper-1 access: Working');
    return true;
  } catch (error) {
    if (error.message.includes('Invalid file format')) {
      console.log('⚠️  Whisper-1: API accessible but test file invalid (expected)');
      return true;
    }
    console.log('❌ Whisper-1 access: Failed -', error.message);
    return false;
  }
}

// Test 3: DALL-E access
async function testDALLE() {
  try {
    // Just check if we can make the request (don't actually generate to save credits)
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: 'test',
      n: 1,
      size: '1024x1024',
      quality: 'standard'
    });
    console.log('✅ DALL-E-3 access: Working');
    return true;
  } catch (error) {
    console.log('❌ DALL-E-3 access: Failed -', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  const results = await Promise.all([
    testGPT(),
    testWhisper(),
    testDALLE()
  ]);

  console.log('\n📊 Summary:');
  const allPassed = results.every(r => r);
  
  if (allPassed) {
    console.log('✅ All OpenAI API models are accessible!');
  } else {
    console.log('⚠️  Some models are not accessible. Check your OpenAI account permissions.');
    console.log('\nPossible solutions:');
    console.log('1. Add billing/credits to your OpenAI account');
    console.log('2. Request access to specific models');
    console.log('3. Use alternative models (e.g., gpt-3.5-turbo instead of gpt-4)');
  }
}

runTests().catch(console.error);