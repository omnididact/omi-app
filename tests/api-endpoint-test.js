#!/usr/bin/env node

/**
 * OMI App API Endpoint Testing Script
 * 
 * Tests all OpenAI integration endpoints with the servers running:
 * - Backend: http://localhost:3001
 * - Frontend: http://localhost:5173
 * 
 * Run with: node tests/api-endpoint-test.js
 */

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

const BASE_URL = 'http://localhost:3001/api';
let authToken = null;

// Test Results
const results = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: { passed: 0, failed: 0, total: 0 }
};

function logResult(testName, success, details = {}) {
  const result = { name: testName, success, timestamp: new Date().toISOString(), ...details };
  results.tests.push(result);
  results.summary.total++;
  
  if (success) {
    results.summary.passed++;
    console.log(`✅ ${testName}`);
    if (details.duration) console.log(`   ⏱️  ${details.duration}ms`);
    if (details.note) console.log(`   📝 ${details.note}`);
  } else {
    results.summary.failed++;
    console.log(`❌ ${testName}`);
    if (details.error) console.log(`   🚨 ${details.error}`);
  }
  console.log('');
}

// Step 1: Create test user and get auth token
async function setupTestUser() {
  console.log('🔐 Setting up test user...\n');
  
  try {
    // Try to register a test user
    const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ai-test-user@example.com',
        password: 'test-password-123'
      })
    });
    
    if (registerResponse.ok) {
      const userData = await registerResponse.json();
      authToken = userData.token;
      logResult('User Registration', true, { note: 'New test user created' });
    } else {
      // User might already exist, try login
      const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'ai-test-user@example.com',
          password: 'test-password-123'
        })
      });
      
      if (loginResponse.ok) {
        const userData = await loginResponse.json();
        authToken = userData.token;
        logResult('User Login', true, { note: 'Using existing test user' });
      } else {
        throw new Error('Could not create or login test user');
      }
    }
    
    return true;
  } catch (error) {
    logResult('Authentication Setup', false, { error: error.message });
    return false;
  }
}

// Step 2: Test OpenAI LLM endpoint
async function testLLMEndpoint() {
  console.log('🤖 Testing OpenAI LLM endpoint...\n');
  
  const tests = [
    {
      name: 'Basic LLM Query',
      payload: {
        prompt: 'Respond with exactly "LLM_TEST_SUCCESS" if you can read this message.',
        model: 'gpt-4o-mini'
      },
      validator: (response) => response && response.includes('LLM_TEST_SUCCESS')
    },
    {
      name: 'JSON Schema Response',
      payload: {
        prompt: 'Create a test response',
        response_json_schema: {
          type: "object",
          properties: {
            status: { type: "string" },
            number: { type: "number" },
            valid: { type: "boolean" }
          },
          required: ["status", "number", "valid"]
        },
        model: 'gpt-4o-mini'
      },
      validator: (response) => response && 
        typeof response.status === 'string' && 
        typeof response.number === 'number' && 
        typeof response.valid === 'boolean'
    }
  ];
  
  for (const test of tests) {
    try {
      const startTime = Date.now();
      const response = await fetch(`${BASE_URL}/ai/invoke-llm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(test.payload)
      });
      
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        const isValid = test.validator(data);
        
        logResult(`LLM: ${test.name}`, isValid, {
          duration,
          note: isValid ? 'Response format correct' : 'Response format invalid',
          response: JSON.stringify(data).substring(0, 100) + '...'
        });
      } else {
        const errorData = await response.json();
        logResult(`LLM: ${test.name}`, false, {
          error: `HTTP ${response.status}: ${errorData.error || 'Unknown error'}`
        });
      }
    } catch (error) {
      logResult(`LLM: ${test.name}`, false, { error: error.message });
    }
  }
}

// Step 3: Test thought processing endpoint
async function testThoughtProcessing() {
  console.log('🧠 Testing thought processing endpoint...\n');
  
  const testThoughts = [
    {
      name: 'Clear Task',
      text: 'I need to learn how to set up a React development environment',
      expectedAutoRoute: true,
      expectedDestination: 'todo'
    },
    {
      name: 'Pure Emotion',
      text: 'I feel really happy and excited about my progress today',
      expectedAutoRoute: true,
      expectedDestination: 'thoughts'
    },
    {
      name: 'Ambiguous Thought',
      text: 'Maybe I should start a side business, but I am not sure about the timing',
      expectedAutoRoute: false // Should require triage
    }
  ];
  
  for (const testThought of testThoughts) {
    try {
      const startTime = Date.now();
      const response = await fetch(`${BASE_URL}/ai/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ text: testThought.text })
      });
      
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.thoughts && data.thoughts.length > 0) {
          const thought = data.thoughts[0];
          let isValid = true;
          let validationNotes = [];
          
          // Check if auto-routing behavior matches expectations
          if (testThought.expectedAutoRoute) {
            if (thought.requires_triage) {
              isValid = false;
              validationNotes.push('Expected auto-route but got triage requirement');
            } else if (thought.auto_destination !== testThought.expectedDestination) {
              isValid = false;
              validationNotes.push(`Expected ${testThought.expectedDestination}, got ${thought.auto_destination}`);
            }
          } else {
            if (!thought.requires_triage) {
              isValid = false;
              validationNotes.push('Expected triage requirement but got auto-route');
            }
          }
          
          // Validate required fields exist
          const requiredFields = ['processed_text', 'category', 'mood_score', 'priority', 'tags'];
          for (const field of requiredFields) {
            if (thought[field] === undefined || thought[field] === null) {
              isValid = false;
              validationNotes.push(`Missing required field: ${field}`);
            }
          }
          
          logResult(`Thought Processing: ${testThought.name}`, isValid, {
            duration,
            note: isValid ? 'Correct classification and structure' : validationNotes.join(', '),
            category: thought.category,
            requiresTriage: thought.requires_triage,
            autoDestination: thought.auto_destination
          });
        } else {
          logResult(`Thought Processing: ${testThought.name}`, false, {
            error: 'No thoughts returned in response'
          });
        }
      } else {
        const errorData = await response.json();
        logResult(`Thought Processing: ${testThought.name}`, false, {
          error: `HTTP ${response.status}: ${errorData.error || 'Unknown error'}`
        });
      }
    } catch (error) {
      logResult(`Thought Processing: ${testThought.name}`, false, { error: error.message });
    }
  }
}

// Step 4: Test Whisper transcription endpoint (with dummy data)
async function testWhisperEndpoint() {
  console.log('🎤 Testing Whisper transcription endpoint...\n');
  
  try {
    // Create a minimal valid audio file buffer for testing
    // In a real test, you'd use an actual audio file
    const dummyAudioData = Buffer.from([
      0x1a, 0x45, 0xdf, 0xa3, // EBML header (minimal WebM structure)
      0x9f, 0x4d, 0xbb, 0x8b
    ]);
    
    const formData = new FormData();
    formData.append('audio', dummyAudioData, {
      filename: 'test-audio.webm',
      contentType: 'audio/webm;codecs=opus'
    });
    
    const startTime = Date.now();
    const response = await fetch(`${BASE_URL}/ai/transcribe`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    });
    
    const duration = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      logResult('Whisper Transcription Service', true, {
        duration,
        note: 'Service accessible (dummy audio expected to fail transcription)'
      });
    } else {
      const errorData = await response.json();
      // Expected to fail with dummy data, but service should be reachable
      if (errorData.error && errorData.error.includes('Failed to transcribe audio')) {
        logResult('Whisper Service Reachability', true, {
          duration,
          note: 'Service reachable, expected error with dummy audio'
        });
      } else {
        logResult('Whisper Transcription Service', false, {
          error: `HTTP ${response.status}: ${errorData.error || 'Unknown error'}`
        });
      }
    }
  } catch (error) {
    logResult('Whisper Transcription Service', false, { error: error.message });
  }
}

// Step 5: Test image generation endpoint
async function testImageGeneration() {
  console.log('🎨 Testing DALL-E image generation endpoint...\n');
  
  try {
    const startTime = Date.now();
    const response = await fetch(`${BASE_URL}/ai/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        prompt: 'A simple red circle on white background',
        size: '1024x1024'
      })
    });
    
    const duration = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      const isValid = data.url && data.url.startsWith('http');
      
      logResult('DALL-E Image Generation', isValid, {
        duration,
        note: isValid ? 'Valid image URL returned' : 'Invalid response format',
        url: data.url ? data.url.substring(0, 50) + '...' : 'none'
      });
    } else {
      const errorData = await response.json();
      logResult('DALL-E Image Generation', false, {
        error: `HTTP ${response.status}: ${errorData.error || 'Unknown error'}`
      });
    }
  } catch (error) {
    logResult('DALL-E Image Generation', false, { error: error.message });
  }
}

// Step 6: Test performance with concurrent requests
async function testConcurrentPerformance() {
  console.log('⚡ Testing concurrent request performance...\n');
  
  try {
    const concurrentRequests = Array(3).fill().map((_, i) => 
      fetch(`${BASE_URL}/ai/invoke-llm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          prompt: `Concurrent test request ${i + 1}: respond with "OK"`,
          model: 'gpt-4o-mini'
        })
      })
    );
    
    const startTime = Date.now();
    const responses = await Promise.all(concurrentRequests);
    const duration = Date.now() - startTime;
    
    const allSuccessful = responses.every(r => r.ok);
    
    logResult('Concurrent Request Handling', allSuccessful, {
      duration,
      note: `3 concurrent requests processed`,
      averageTime: Math.round(duration / 3)
    });
  } catch (error) {
    logResult('Concurrent Request Handling', false, { error: error.message });
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting OMI App OpenAI Integration API Tests\n');
  console.log('='.repeat(60));
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Test started: ${new Date().toISOString()}`);
  console.log('='.repeat(60));
  console.log('');
  
  const startTime = Date.now();
  
  // Run tests in sequence
  const setupSuccess = await setupTestUser();
  if (!setupSuccess) {
    console.log('❌ Cannot continue without authentication');
    return false;
  }
  
  await testLLMEndpoint();
  await testThoughtProcessing(); 
  await testWhisperEndpoint();
  await testImageGeneration();
  await testConcurrentPerformance();
  
  const totalDuration = Date.now() - startTime;
  
  // Generate final report
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL API TEST REPORT');
  console.log('='.repeat(60));
  console.log(`✅ Tests Passed: ${results.summary.passed}`);
  console.log(`❌ Tests Failed: ${results.summary.failed}`);
  console.log(`📈 Success Rate: ${Math.round((results.summary.passed / results.summary.total) * 100)}%`);
  console.log(`⏱️  Total Duration: ${totalDuration}ms`);
  console.log('');
  
  // Show critical test status
  const criticalTests = ['Basic LLM Query', 'JSON Schema Response', 'Clear Task', 'Pure Emotion'];
  const criticalPassed = results.tests.filter(t => 
    criticalTests.some(ct => t.name.includes(ct)) && t.success
  ).length;
  
  console.log(`🎯 Critical Tests: ${criticalPassed}/${criticalTests.length} passed`);
  
  if (results.summary.passed === results.summary.total) {
    console.log('\n🎉 ALL API ENDPOINTS ARE WORKING CORRECTLY!');
    console.log('✅ OpenAI integration is fully functional');
    console.log('✅ Ready for end-to-end testing');
  } else if (criticalPassed === criticalTests.length) {
    console.log('\n✅ CRITICAL FEATURES ARE WORKING');
    console.log('⚠️  Some optional features may need attention');
  } else {
    console.log('\n⚠️  CRITICAL ISSUES FOUND');
    console.log('🚨 OpenAI integration needs fixes before proceeding');
  }
  
  // Save results
  fs.writeFileSync('api-test-results.json', JSON.stringify(results, null, 2));
  console.log('\n📋 Detailed results saved to: api-test-results.json');
  
  return results.summary.passed === results.summary.total;
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(success => {
      console.log(`\n🏁 Tests ${success ? 'PASSED' : 'FAILED'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Fatal error during testing:', error);
      process.exit(1);
    });
}

export default runAllTests;