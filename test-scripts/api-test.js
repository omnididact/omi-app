#!/usr/bin/env node

/**
 * Comprehensive API Testing Script for OMI App
 * Tests all critical endpoints and user flows
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = process.env.API_BASE || 'http://localhost:3001/api';
const TEST_EMAIL = `test${Date.now()}@example.com`;
const TEST_PASSWORD = 'testpass123';
const TEST_NAME = 'Test User';

class APITester {
  constructor() {
    this.token = null;
    this.testResults = [];
    this.userId = null;
  }

  async log(test, status, details = '') {
    const result = { test, status, timestamp: new Date().toISOString(), details };
    this.testResults.push(result);
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${emoji} ${test}: ${status} ${details}`);
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token && !options.skipAuth) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      return { response, data, status: response.status };
    } catch (error) {
      return { error: error.message, status: 0 };
    }
  }

  async testHealthCheck() {
    const { response, data, status, error } = await this.request('/health', { skipAuth: true });
    
    if (error) {
      await this.log('Health Check', 'FAIL', `Network error: ${error}`);
      return false;
    }

    if (status === 200 && data.status === 'OK') {
      await this.log('Health Check', 'PASS', 'Server is running');
      return true;
    } else {
      await this.log('Health Check', 'FAIL', `Status: ${status}, Response: ${JSON.stringify(data)}`);
      return false;
    }
  }

  async testUserRegistration() {
    const { response, data, status, error } = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: TEST_NAME
      }),
      skipAuth: true
    });

    if (error) {
      await this.log('User Registration', 'FAIL', `Network error: ${error}`);
      return false;
    }

    if (status === 201 && data.token && data.user) {
      this.token = data.token;
      this.userId = data.user.id;
      await this.log('User Registration', 'PASS', `User created with ID: ${this.userId}`);
      return true;
    } else {
      await this.log('User Registration', 'FAIL', `Status: ${status}, Response: ${JSON.stringify(data)}`);
      return false;
    }
  }

  async testUserLogin() {
    const { response, data, status, error } = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      }),
      skipAuth: true
    });

    if (error) {
      await this.log('User Login', 'FAIL', `Network error: ${error}`);
      return false;
    }

    if (status === 200 && data.token && data.user) {
      this.token = data.token;
      await this.log('User Login', 'PASS', 'Login successful');
      return true;
    } else {
      await this.log('User Login', 'FAIL', `Status: ${status}, Response: ${JSON.stringify(data)}`);
      return false;
    }
  }

  async testInvalidLogin() {
    const { response, data, status, error } = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: 'wrongpassword'
      }),
      skipAuth: true
    });

    if (status === 401 || status === 400) {
      await this.log('Invalid Login Rejection', 'PASS', 'Correctly rejected invalid credentials');
      return true;
    } else {
      await this.log('Invalid Login Rejection', 'FAIL', `Expected 401/400, got ${status}`);
      return false;
    }
  }

  async testProtectedRoute() {
    // Test without token
    const { status: noAuthStatus } = await this.request('/thoughts', { skipAuth: true });
    
    if (noAuthStatus === 401) {
      await this.log('Protected Route (No Auth)', 'PASS', 'Correctly rejected unauthorized request');
    } else {
      await this.log('Protected Route (No Auth)', 'FAIL', `Expected 401, got ${noAuthStatus}`);
      return false;
    }

    // Test with token
    const { status: authStatus } = await this.request('/thoughts');
    
    if (authStatus === 200) {
      await this.log('Protected Route (With Auth)', 'PASS', 'Authorized request accepted');
      return true;
    } else {
      await this.log('Protected Route (With Auth)', 'FAIL', `Expected 200, got ${authStatus}`);
      return false;
    }
  }

  async testThoughtsCRUD() {
    // Create thought
    const createData = {
      transcription: 'Test thought transcription',
      processed_text: 'This is a test thought for API testing',
      category: 'reflection',
      sub_category: 'testing',
      mood_score: 0.5,
      priority: 'medium',
      tags: ['test', 'api'],
      status: 'pending'
    };

    const { data: createResult, status: createStatus } = await this.request('/thoughts', {
      method: 'POST',
      body: JSON.stringify(createData)
    });

    if (createStatus !== 201) {
      await this.log('Create Thought', 'FAIL', `Status: ${createStatus}`);
      return false;
    }

    const thoughtId = createResult.id;
    await this.log('Create Thought', 'PASS', `Created thought with ID: ${thoughtId}`);

    // Read thoughts
    const { data: readResult, status: readStatus } = await this.request('/thoughts');
    
    if (readStatus === 200 && Array.isArray(readResult) && readResult.length > 0) {
      await this.log('Read Thoughts', 'PASS', `Retrieved ${readResult.length} thoughts`);
    } else {
      await this.log('Read Thoughts', 'FAIL', `Status: ${readStatus}, Type: ${typeof readResult}`);
      return false;
    }

    // Update thought
    const updateData = { status: 'memory_banked' };
    const { status: updateStatus } = await this.request(`/thoughts/${thoughtId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });

    if (updateStatus === 200) {
      await this.log('Update Thought', 'PASS', 'Thought updated successfully');
    } else {
      await this.log('Update Thought', 'FAIL', `Status: ${updateStatus}`);
      return false;
    }

    // Delete thought
    const { status: deleteStatus } = await this.request(`/thoughts/${thoughtId}`, {
      method: 'DELETE'
    });

    if (deleteStatus === 204) {
      await this.log('Delete Thought', 'PASS', 'Thought deleted successfully');
      return true;
    } else {
      await this.log('Delete Thought', 'FAIL', `Status: ${deleteStatus}`);
      return false;
    }
  }

  async testGoalsCRUD() {
    // Create goal
    const createData = {
      title: 'Test API Goal',
      description: 'This is a test goal created by API testing',
      status: 'active',
      priority: 'high',
      target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    const { data: createResult, status: createStatus } = await this.request('/goals', {
      method: 'POST',
      body: JSON.stringify(createData)
    });

    if (createStatus !== 201) {
      await this.log('Create Goal', 'FAIL', `Status: ${createStatus}`);
      return false;
    }

    const goalId = createResult.id;
    await this.log('Create Goal', 'PASS', `Created goal with ID: ${goalId}`);

    // Read goals
    const { data: readResult, status: readStatus } = await this.request('/goals');
    
    if (readStatus === 200 && Array.isArray(readResult)) {
      await this.log('Read Goals', 'PASS', `Retrieved ${readResult.length} goals`);
    } else {
      await this.log('Read Goals', 'FAIL', `Status: ${readStatus}`);
      return false;
    }

    // Update goal
    const updateData = { status: 'completed' };
    const { status: updateStatus } = await this.request(`/goals/${goalId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });

    if (updateStatus === 200) {
      await this.log('Update Goal', 'PASS', 'Goal updated successfully');
    } else {
      await this.log('Update Goal', 'FAIL', `Status: ${updateStatus}`);
      return false;
    }

    // Delete goal
    const { status: deleteStatus } = await this.request(`/goals/${goalId}`, {
      method: 'DELETE'
    });

    if (deleteStatus === 204) {
      await this.log('Delete Goal', 'PASS', 'Goal deleted successfully');
      return true;
    } else {
      await this.log('Delete Goal', 'FAIL', `Status: ${deleteStatus}`);
      return false;
    }
  }

  async testAITextProcessing() {
    const testText = "I need to learn React hooks for my project and set up a development environment";
    
    const { data, status, error } = await this.request('/ai/process', {
      method: 'POST',
      body: JSON.stringify({ text: testText })
    });

    if (error) {
      await this.log('AI Text Processing', 'FAIL', `Network error: ${error}`);
      return false;
    }

    if (status === 200 && data.thoughts && Array.isArray(data.thoughts)) {
      const thought = data.thoughts[0];
      if (thought.processed_text && thought.category && thought.mood_score !== undefined) {
        await this.log('AI Text Processing', 'PASS', `Processed text with category: ${thought.category}`);
        return true;
      }
    }

    await this.log('AI Text Processing', 'FAIL', `Status: ${status}, Response: ${JSON.stringify(data)}`);
    return false;
  }

  async testErrorHandling() {
    // Test invalid JSON
    const { status: invalidJsonStatus } = await this.request('/thoughts', {
      method: 'POST',
      body: 'invalid json',
      headers: { 'Content-Type': 'application/json' }
    });

    if (invalidJsonStatus === 400) {
      await this.log('Invalid JSON Handling', 'PASS', 'Correctly rejected invalid JSON');
    } else {
      await this.log('Invalid JSON Handling', 'FAIL', `Expected 400, got ${invalidJsonStatus}`);
    }

    // Test missing required fields
    const { status: missingFieldStatus } = await this.request('/thoughts', {
      method: 'POST',
      body: JSON.stringify({})
    });

    if (missingFieldStatus === 400) {
      await this.log('Missing Fields Handling', 'PASS', 'Correctly rejected incomplete data');
    } else {
      await this.log('Missing Fields Handling', 'FAIL', `Expected 400, got ${missingFieldStatus}`);
    }

    // Test non-existent endpoint
    const { status: notFoundStatus } = await this.request('/nonexistent');

    if (notFoundStatus === 404) {
      await this.log('404 Handling', 'PASS', 'Correctly returned 404 for missing endpoint');
      return true;
    } else {
      await this.log('404 Handling', 'FAIL', `Expected 404, got ${notFoundStatus}`);
      return false;
    }
  }

  async testRateLimiting() {
    // Make multiple rapid requests to test rate limiting
    const promises = Array(10).fill().map(() => this.request('/health', { skipAuth: true }));
    const results = await Promise.all(promises);
    
    const rateLimited = results.some(result => result.status === 429);
    
    if (rateLimited) {
      await this.log('Rate Limiting', 'PASS', 'Rate limiting is active');
    } else {
      await this.log('Rate Limiting', 'WARN', 'No rate limiting detected (may be intentional)');
    }
    
    return true;
  }

  async runAllTests() {
    console.log('🚀 Starting API Test Suite...\n');
    
    const tests = [
      () => this.testHealthCheck(),
      () => this.testUserRegistration(),
      () => this.testUserLogin(),
      () => this.testInvalidLogin(),
      () => this.testProtectedRoute(),
      () => this.testThoughtsCRUD(),
      () => this.testGoalsCRUD(),
      () => this.testAITextProcessing(),
      () => this.testErrorHandling(),
      () => this.testRateLimiting()
    ];

    let passed = 0;
    let total = 0;

    for (const test of tests) {
      try {
        const result = await test();
        if (result) passed++;
        total++;
      } catch (error) {
        await this.log('Test Execution', 'FAIL', error.message);
        total++;
      }
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📊 Test Summary:');
    console.log(`Total Tests: ${this.testResults.length}`);
    console.log(`Passed: ${this.testResults.filter(r => r.status === 'PASS').length}`);
    console.log(`Failed: ${this.testResults.filter(r => r.status === 'FAIL').length}`);
    console.log(`Warnings: ${this.testResults.filter(r => r.status === 'WARN').length}`);

    // Save test results
    const reportPath = path.join(__dirname, '../test-results.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        total: this.testResults.length,
        passed: this.testResults.filter(r => r.status === 'PASS').length,
        failed: this.testResults.filter(r => r.status === 'FAIL').length,
        warnings: this.testResults.filter(r => r.status === 'WARN').length
      },
      results: this.testResults
    }, null, 2));

    console.log(`\n📄 Detailed results saved to: ${reportPath}`);

    const failedTests = this.testResults.filter(r => r.status === 'FAIL').length;
    if (failedTests > 0) {
      console.log(`\n❌ ${failedTests} tests failed. Check the details above.`);
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    }
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new APITester();
  tester.runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

export default APITester;