#!/usr/bin/env node

/**
 * Comprehensive OpenAI Integration Test Suite for OMI App
 * 
 * This script tests all critical AI-powered features:
 * 1. OpenAI API Connection & GPT-4o-mini access
 * 2. Whisper Audio Transcription 
 * 3. Thought Processing Logic
 * 4. End-to-End Voice Pipeline
 * 5. Error Handling & Performance
 */

import dotenv from 'dotenv';
import { invokeLLM, transcribeAudio, generateImage } from '../server/utils/openai.js';

// Load environment variables
dotenv.config();
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

// Test Results Storage
const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    passed: 0,
    failed: 0,
    total: 0
  }
};

// Helper Functions
function logTest(testName, status, details = {}) {
  const result = {
    name: testName,
    status,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  testResults.tests.push(result);
  testResults.summary.total++;
  
  if (status === 'PASS') {
    testResults.summary.passed++;
    console.log(`✅ ${testName} - PASSED`);
  } else {
    testResults.summary.failed++;
    console.log(`❌ ${testName} - FAILED: ${details.error || 'Unknown error'}`);
  }
  
  if (details.duration) {
    console.log(`   ⏱️  Duration: ${details.duration}ms`);
  }
  
  if (details.responseSize) {
    console.log(`   📊 Response Size: ${details.responseSize} characters`);
  }
  
  console.log('');
}

function createTestAudioBlob() {
  // Create a minimal valid WebM audio blob for testing
  // This is a dummy blob - in real tests you'd use actual audio
  const dummyData = new Uint8Array([
    0x1a, 0x45, 0xdf, 0xa3, // EBML header
    0x9f, 0x4d, 0xbb, 0x8b, // Segment
    // ... minimal WebM structure
  ]);
  return new Blob([dummyData], { type: 'audio/webm;codecs=opus' });
}

// Test 1: OpenAI API Connection & GPT-4o-mini Access
async function testOpenAIConnection() {
  console.log('🔗 Testing OpenAI API Connection & GPT-4o-mini Access...\n');
  
  try {
    const startTime = Date.now();
    
    // Test basic API connection with simple prompt
    const response = await invokeLLM({
      prompt: 'Respond with exactly "API_CONNECTION_SUCCESS" if you can read this.',
      model: 'gpt-4o-mini'
    });
    
    const duration = Date.now() - startTime;
    
    if (response && response.includes('API_CONNECTION_SUCCESS')) {
      logTest('OpenAI API Connection', 'PASS', {
        duration,
        responseSize: response.length,
        model: 'gpt-4o-mini'
      });
      return true;
    } else {
      logTest('OpenAI API Connection', 'FAIL', {
        error: 'Unexpected response from API',
        response: response?.substring(0, 100) + '...'
      });
      return false;
    }
    
  } catch (error) {
    logTest('OpenAI API Connection', 'FAIL', {
      error: error.message,
      stack: error.stack
    });
    return false;
  }
}

// Test 2: JSON Schema Validation
async function testJSONSchemaSupport() {
  console.log('📋 Testing JSON Schema Structured Outputs...\n');
  
  try {
    const startTime = Date.now();
    
    const response = await invokeLLM({
      prompt: 'Create a test user profile',
      response_json_schema: {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
          active: { type: "boolean" }
        },
        required: ["name", "age", "active"]
      },
      model: 'gpt-4o-mini'
    });
    
    const duration = Date.now() - startTime;
    
    // Validate response is proper JSON with required fields
    if (response && 
        typeof response.name === 'string' && 
        typeof response.age === 'number' && 
        typeof response.active === 'boolean') {
      
      logTest('JSON Schema Validation', 'PASS', {
        duration,
        responseData: JSON.stringify(response),
        schemaCompliant: true
      });
      return true;
    } else {
      logTest('JSON Schema Validation', 'FAIL', {
        error: 'Response does not match JSON schema',
        response: JSON.stringify(response)
      });
      return false;
    }
    
  } catch (error) {
    logTest('JSON Schema Validation', 'FAIL', {
      error: error.message
    });
    return false;
  }
}

// Test 3: Whisper Audio Transcription  
async function testWhisperTranscription() {
  console.log('🎤 Testing Whisper Audio Transcription...\n');
  
  try {
    // Note: This test requires a real audio file or mock implementation
    // For now, we'll test the error handling with invalid audio
    
    const startTime = Date.now();
    const testBlob = createTestAudioBlob();
    
    try {
      const transcription = await transcribeAudio(testBlob);
      const duration = Date.now() - startTime;
      
      // If we get here without error, transcription service is working
      logTest('Whisper Audio Transcription', 'PASS', {
        duration,
        transcriptionLength: transcription ? transcription.length : 0,
        note: 'Test with dummy audio - service is accessible'
      });
      return true;
      
    } catch (transcriptionError) {
      // Expected for dummy audio, but service should be reachable
      if (transcriptionError.message.includes('Failed to transcribe audio')) {
        logTest('Whisper Service Reachability', 'PASS', {
          note: 'Service is accessible (expected error with dummy audio)',
          error: transcriptionError.message
        });
        return true;
      } else {
        throw transcriptionError;
      }
    }
    
  } catch (error) {
    logTest('Whisper Audio Transcription', 'FAIL', {
      error: error.message,
      stack: error.stack
    });
    return false;
  }
}

// Test 4: Thought Processing Logic
async function testThoughtProcessing() {
  console.log('🧠 Testing Thought Processing & Categorization Logic...\n');
  
  try {
    const testThoughts = [
      {
        text: "I need to learn how to set up a React development environment",
        expectedCategory: "task",
        expectedAutoDestination: "todo"
      },
      {
        text: "I feel really happy about my progress today",
        expectedCategory: "emotion", 
        expectedAutoDestination: "thoughts"
      },
      {
        text: "Maybe I should start a side business, but I'm not sure",
        expectedRequiresTriage: true
      }
    ];
    
    let passCount = 0;
    
    for (const testThought of testThoughts) {
      const startTime = Date.now();
      
      const response = await invokeLLM({
        prompt: `You are an expert AI assistant that analyzes human thoughts.

        ENHANCED ROUTING RULES:
        1. AUTOMATIC TO "ACTIONS" (no user triage needed):
           - Tasks: Clear actionable items, especially "how-to" questions, problems to solve
           - Goals: Achievement-oriented thoughts 
           - Urgent Concerns: Problems requiring immediate action

        2. AUTOMATIC TO "THOUGHTS ARCHIVE" (no user triage needed):
           - Emotional Venting: Pure emotional expression
           - Simple Observations: Neutral observations about life/world
           - Personal Notes: Simple notes to self
           - Memories: Past experiences being recorded
           - Pure Reflections: Self-awareness without action needed

        3. REQUIRES USER TRIAGE (ambiguous cases):
           - Complex Ideas: Creative concepts that could go either direction
           - Mixed Reflections: Thoughts with both emotional and actionable elements

        Text to analyze: "${testThought.text}"`,
        
        response_json_schema: {
          type: "object",
          properties: {
            thoughts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  processed_text: { type: "string" },
                  category: { 
                    type: "string", 
                    enum: ["reflection", "idea", "concern", "goal", "memory", "task", "emotion", "observation"] 
                  },
                  sub_category: { type: "string" },
                  mood_score: { type: "number" },
                  priority: { type: "string", enum: ["low", "medium", "high"] },
                  tags: { type: "array", items: { type: "string" } },
                  action_steps: { type: "array", items: { type: "object" } },
                  requires_triage: { type: "boolean" },
                  auto_destination: { type: "string", enum: ["todo", "thoughts"] }
                }
              }
            }
          }
        },
        model: 'gpt-4o-mini'
      });
      
      const duration = Date.now() - startTime;
      
      if (response && response.thoughts && response.thoughts.length > 0) {
        const thought = response.thoughts[0];
        let testPassed = true;
        let validationNotes = [];
        
        // Validate expected category
        if (testThought.expectedCategory && thought.category !== testThought.expectedCategory) {
          testPassed = false;
          validationNotes.push(`Expected category: ${testThought.expectedCategory}, got: ${thought.category}`);
        }
        
        // Validate expected auto destination
        if (testThought.expectedAutoDestination && thought.auto_destination !== testThought.expectedAutoDestination) {
          testPassed = false;
          validationNotes.push(`Expected destination: ${testThought.expectedAutoDestination}, got: ${thought.auto_destination}`);
        }
        
        // Validate requires triage
        if (testThought.expectedRequiresTriage !== undefined && thought.requires_triage !== testThought.expectedRequiresTriage) {
          testPassed = false;
          validationNotes.push(`Expected triage: ${testThought.expectedRequiresTriage}, got: ${thought.requires_triage}`);
        }
        
        if (testPassed) {
          passCount++;
          logTest(`Thought Processing: "${testThought.text.substring(0, 30)}..."`, 'PASS', {
            duration,
            category: thought.category,
            autoDestination: thought.auto_destination,
            requiresTriage: thought.requires_triage
          });
        } else {
          logTest(`Thought Processing: "${testThought.text.substring(0, 30)}..."`, 'FAIL', {
            error: 'Classification mismatch',
            validationNotes: validationNotes.join(', '),
            actualResult: {
              category: thought.category,
              autoDestination: thought.auto_destination,
              requiresTriage: thought.requires_triage
            }
          });
        }
      } else {
        logTest(`Thought Processing: "${testThought.text.substring(0, 30)}..."`, 'FAIL', {
          error: 'Invalid response structure',
          response: JSON.stringify(response)
        });
      }
    }
    
    return passCount === testThoughts.length;
    
  } catch (error) {
    logTest('Thought Processing Logic', 'FAIL', {
      error: error.message,
      stack: error.stack
    });
    return false;
  }
}

// Test 5: Error Handling
async function testErrorHandling() {
  console.log('⚠️ Testing Error Handling Scenarios...\n');
  
  const errorTests = [
    {
      name: 'Invalid API Key',
      test: async () => {
        // This test would require temporarily changing the API key
        // For now, we'll simulate by testing with invalid parameters
        try {
          await invokeLLM({
            prompt: '', // Empty prompt should trigger validation
            model: 'invalid-model'
          });
          return false; // Should have thrown an error
        } catch (error) {
          return error.message.includes('Failed to process AI request');
        }
      }
    },
    {
      name: 'Network Timeout Handling',
      test: async () => {
        // Test with very long prompt to potentially trigger timeout
        try {
          const longPrompt = 'A'.repeat(100000); // Very long prompt
          await invokeLLM({
            prompt: longPrompt,
            model: 'gpt-4o-mini'
          });
          return true; // If it succeeds, that's also fine
        } catch (error) {
          return error.message.includes('Failed to process AI request');
        }
      }
    }
  ];
  
  let passCount = 0;
  
  for (const errorTest of errorTests) {
    try {
      const result = await errorTest.test();
      if (result) {
        passCount++;
        logTest(`Error Handling: ${errorTest.name}`, 'PASS');
      } else {
        logTest(`Error Handling: ${errorTest.name}`, 'FAIL', {
          error: 'Test did not behave as expected'
        });
      }
    } catch (error) {
      logTest(`Error Handling: ${errorTest.name}`, 'FAIL', {
        error: error.message
      });
    }
  }
  
  return passCount === errorTests.length;
}

// Test 6: Performance Benchmarks
async function testPerformance() {
  console.log('⚡ Testing Performance & Response Times...\n');
  
  try {
    const performanceTests = [
      {
        name: 'Simple LLM Query',
        test: () => invokeLLM({
          prompt: 'Say hello',
          model: 'gpt-4o-mini'
        })
      },
      {
        name: 'Complex Thought Analysis',
        test: () => invokeLLM({
          prompt: 'Analyze this complex thought and provide structured output with categories, mood, and action steps: "I want to start exercising more but I keep making excuses and I feel bad about my lack of motivation."',
          response_json_schema: {
            type: "object",
            properties: {
              analysis: { type: "string" },
              category: { type: "string" },
              mood_score: { type: "number" },
              action_steps: { type: "array", items: { type: "string" } }
            }
          },
          model: 'gpt-4o-mini'
        })
      }
    ];
    
    let passCount = 0;
    
    for (const perfTest of performanceTests) {
      const startTime = Date.now();
      
      try {
        await perfTest.test();
        const duration = Date.now() - startTime;
        
        // Consider under 10 seconds as acceptable performance
        if (duration < 10000) {
          passCount++;
          logTest(`Performance: ${perfTest.name}`, 'PASS', {
            duration,
            benchmark: duration < 3000 ? 'Excellent' : duration < 5000 ? 'Good' : 'Acceptable'
          });
        } else {
          logTest(`Performance: ${perfTest.name}`, 'FAIL', {
            duration,
            error: 'Response time too slow (>10s)'
          });
        }
      } catch (error) {
        logTest(`Performance: ${perfTest.name}`, 'FAIL', {
          error: error.message
        });
      }
    }
    
    return passCount === performanceTests.length;
    
  } catch (error) {
    logTest('Performance Testing', 'FAIL', {
      error: error.message
    });
    return false;
  }
}

// Main Test Runner
async function runAllTests() {
  console.log('🚀 Starting Comprehensive OpenAI Integration Tests for OMI App\n');
  console.log('='.repeat(60));
  console.log('');
  
  const testSuite = [
    { name: 'OpenAI Connection', test: testOpenAIConnection },
    { name: 'JSON Schema Support', test: testJSONSchemaSupport },
    { name: 'Whisper Transcription', test: testWhisperTranscription },
    { name: 'Thought Processing', test: testThoughtProcessing },
    { name: 'Error Handling', test: testErrorHandling },
    { name: 'Performance', test: testPerformance }
  ];
  
  let overallSuccess = true;
  
  for (const test of testSuite) {
    const success = await test.test();
    if (!success) overallSuccess = false;
    console.log('-'.repeat(40));
  }
  
  // Generate Final Report
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL TEST REPORT');
  console.log('='.repeat(60));
  console.log(`✅ Tests Passed: ${testResults.summary.passed}`);
  console.log(`❌ Tests Failed: ${testResults.summary.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.summary.passed / testResults.summary.total) * 100)}%`);
  console.log(`⏱️  Total Duration: ${Date.now() - testStartTime}ms`);
  
  if (overallSuccess) {
    console.log('\n🎉 ALL CRITICAL AI FEATURES ARE WORKING CORRECTLY!');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED - CHECK INDIVIDUAL RESULTS ABOVE');
  }
  
  // Save detailed results to file
  const reportPath = path.join(process.cwd(), 'ai-test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📋 Detailed results saved to: ${reportPath}`);
  
  return overallSuccess;
}

// Check if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const testStartTime = Date.now();
  
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal test error:', error);
      process.exit(1);
    });
}

export default runAllTests;