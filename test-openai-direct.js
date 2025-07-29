import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

console.log('🔍 Testing OpenAI API Connection...');
console.log('API Key present:', !!process.env.OPENAI_API_KEY);
console.log('API Key starts with:', process.env.OPENAI_API_KEY?.substring(0, 20) + '...');

async function testOpenAI() {
  try {
    console.log('\n📞 Making test request to OpenAI...');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: 'Reply with exactly "OPENAI_CONNECTION_SUCCESS" if you can read this.'
        }
      ],
      temperature: 0.7
    });

    const response = completion.choices[0].message.content;
    console.log('✅ OpenAI Response:', response);
    
    if (response.includes('OPENAI_CONNECTION_SUCCESS')) {
      console.log('🎉 OpenAI API is working correctly!');
    } else {
      console.log('⚠️  OpenAI API responded, but with unexpected content');
    }
    
  } catch (error) {
    console.error('❌ OpenAI API Error:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    
    if (error.status) {
      console.error('HTTP Status:', error.status);
    }
    
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testOpenAI();