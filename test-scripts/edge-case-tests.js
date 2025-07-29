#!/usr/bin/env node

/**
 * Edge Case and Error Handling Test Suite for OMI App
 * Tests boundary conditions, error scenarios, and recovery mechanisms
 */

const fs = require('fs');
const path = require('path');

const API_BASE = process.env.API_BASE || 'http://localhost:3001/api';

class EdgeCaseTester {
  constructor() {
    this.token = null;
    this.testResults = [];
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
      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = await response.text();
      }
      return { response, data, status: response.status };
    } catch (error) {
      return { error: error.message, status: 0 };
    }
  }

  async setupTestUser() {
    const email = `edge-test-${Date.now()}@example.com`;
    const { data, status } = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password: 'testpass123',
        name: 'Edge Test User'
      }),
      skipAuth: true
    });

    if (status === 201) {
      this.token = data.token;
      return true;
    }
    return false;
  }

  // Test 1: Authentication Edge Cases
  async testAuthenticationEdgeCases() {
    console.log('\n🔐 Testing Authentication Edge Cases...\n');

    // Test 1.1: Empty credentials
    const { status: emptyStatus } = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({}),
      skipAuth: true
    });
    
    if (emptyStatus === 400) {
      await this.log('Empty credentials rejection', 'PASS', 'Correctly rejected empty login');
    } else {
      await this.log('Empty credentials rejection', 'FAIL', `Expected 400, got ${emptyStatus}`);
    }

    // Test 1.2: Invalid email format
    const { status: invalidEmailStatus } = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'not-an-email',
        password: 'validpass123',
        name: 'Test User'
      }),
      skipAuth: true
    });
    
    if (invalidEmailStatus === 400) {
      await this.log('Invalid email format rejection', 'PASS', 'Correctly rejected invalid email');
    } else {
      await this.log('Invalid email format rejection', 'FAIL', `Expected 400, got ${invalidEmailStatus}`);
    }

    // Test 1.3: Password too short
    const { status: shortPassStatus } = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: `test-${Date.now()}@example.com`,
        password: '123',
        name: 'Test User'
      }),
      skipAuth: true
    });
    
    if (shortPassStatus === 400) {
      await this.log('Short password rejection', 'PASS', 'Correctly rejected short password');
    } else {
      await this.log('Short password rejection', 'FAIL', `Expected 400, got ${shortPassStatus}`);
    }

    // Test 1.4: Malformed JWT token
    const { status: malformedTokenStatus } = await this.request('/thoughts', {
      headers: { 'Authorization': 'Bearer invalid.jwt.token' }
    });
    
    if (malformedTokenStatus === 401) {
      await this.log('Malformed JWT rejection', 'PASS', 'Correctly rejected invalid JWT');
    } else {
      await this.log('Malformed JWT rejection', 'FAIL', `Expected 401, got ${malformedTokenStatus}`);
    }

    // Test 1.5: Missing Authorization header
    const { status: noAuthStatus } = await this.request('/thoughts', {
      skipAuth: true,
      headers: {}
    });
    
    if (noAuthStatus === 401) {
      await this.log('Missing auth header rejection', 'PASS', 'Correctly rejected missing auth');
    } else {
      await this.log('Missing auth header rejection', 'FAIL', `Expected 401, got ${noAuthStatus}`);
    }
  }

  // Test 2: Input Validation Edge Cases
  async testInputValidationEdgeCases() {
    console.log('\n📝 Testing Input Validation Edge Cases...\n');

    if (!this.token) {
      await this.log('Input validation tests', 'FAIL', 'No auth token available');
      return;
    }

    // Test 2.1: Extremely long text input
    const longText = 'A'.repeat(10000);
    const { status: longTextStatus } = await this.request('/thoughts', {
      method: 'POST',
      body: JSON.stringify({
        transcription: longText,
        processed_text: longText,
        category: 'reflection',
        mood_score: 0.5,
        priority: 'medium',
        tags: ['test'],
        status: 'pending'
      })
    });
    
    // Should either accept or reject gracefully (not crash)
    if (longTextStatus === 201 || longTextStatus === 400) {
      await this.log('Long text input handling', 'PASS', `Handled gracefully with status ${longTextStatus}`);
    } else {
      await this.log('Long text input handling', 'FAIL', `Unexpected status ${longTextStatus}`);
    }

    // Test 2.2: Special characters and Unicode
    const specialText = '🚀 Special chars: <>&"\'\\n\\t\\r 测试 العربية';
    const { status: specialCharsStatus } = await this.request('/thoughts', {
      method: 'POST',
      body: JSON.stringify({
        transcription: specialText,
        processed_text: specialText,
        category: 'reflection',
        mood_score: 0.5,
        priority: 'medium',
        tags: ['special', 'unicode'],
        status: 'pending'
      })
    });
    
    if (specialCharsStatus === 201) {
      await this.log('Special characters handling', 'PASS', 'Handled Unicode and special chars');
    } else {
      await this.log('Special characters handling', 'FAIL', `Status ${specialCharsStatus}`);
    }

    // Test 2.3: Null and undefined values
    const { status: nullValueStatus } = await this.request('/thoughts', {
      method: 'POST',
      body: JSON.stringify({
        transcription: null,
        processed_text: undefined,
        category: 'reflection',
        mood_score: null,
        priority: 'medium',
        tags: null,
        status: 'pending'
      })
    });
    
    if (nullValueStatus === 400) {
      await this.log('Null values rejection', 'PASS', 'Correctly rejected null values');
    } else {
      await this.log('Null values rejection', 'FAIL', `Expected 400, got ${nullValueStatus}`);
    }

    // Test 2.4: Invalid enum values
    const { status: invalidEnumStatus } = await this.request('/thoughts', {
      method: 'POST',
      body: JSON.stringify({
        transcription: 'Test thought',
        processed_text: 'Test thought',
        category: 'invalid_category',
        mood_score: 0.5,
        priority: 'invalid_priority',
        tags: ['test'],
        status: 'invalid_status'
      })
    });
    
    if (invalidEnumStatus === 400) {
      await this.log('Invalid enum values rejection', 'PASS', 'Correctly rejected invalid enums');
    } else {
      await this.log('Invalid enum values rejection', 'FAIL', `Expected 400, got ${invalidEnumStatus}`);
    }

    // Test 2.5: Out-of-range numeric values
    const { status: outOfRangeStatus } = await this.request('/thoughts', {
      method: 'POST',
      body: JSON.stringify({
        transcription: 'Test thought',
        processed_text: 'Test thought',
        category: 'reflection',
        mood_score: 999, // Should be between -1 and 1
        priority: 'medium',
        tags: ['test'],
        status: 'pending'
      })
    });
    
    if (outOfRangeStatus === 400) {
      await this.log('Out-of-range values rejection', 'PASS', 'Correctly rejected out-of-range mood_score');
    } else {
      await this.log('Out-of-range values rejection', 'FAIL', `Expected 400, got ${outOfRangeStatus}`);
    }
  }

  // Test 3: Database Constraint Edge Cases
  async testDatabaseConstraintEdgeCases() {
    console.log('\n🗄️ Testing Database Constraint Edge Cases...\n');

    if (!this.token) {
      await this.log('Database constraint tests', 'FAIL', 'No auth token available');
      return;
    }

    // Test 3.1: Update non-existent record
    const { status: updateNonExistentStatus } = await this.request('/thoughts/999999', {
      method: 'PUT',
      body: JSON.stringify({ status: 'completed' })
    });
    
    if (updateNonExistentStatus === 404) {
      await this.log('Update non-existent record', 'PASS', 'Correctly returned 404');
    } else {
      await this.log('Update non-existent record', 'FAIL', `Expected 404, got ${updateNonExistentStatus}`);
    }

    // Test 3.2: Delete non-existent record
    const { status: deleteNonExistentStatus } = await this.request('/thoughts/999999', {
      method: 'DELETE'
    });
    
    if (deleteNonExistentStatus === 404) {
      await this.log('Delete non-existent record', 'PASS', 'Correctly returned 404');
    } else {
      await this.log('Delete non-existent record', 'FAIL', `Expected 404, got ${deleteNonExistentStatus}`);
    }

    // Test 3.3: Access other user's data (create another user first)
    const otherUserEmail = `other-${Date.now()}@example.com`;
    const { data: otherUserData, status: otherUserStatus } = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: otherUserEmail,
        password: 'testpass123',
        name: 'Other User'
      }),
      skipAuth: true
    });

    if (otherUserStatus === 201) {
      // Create a thought with the other user's token
      const { data: thoughtData } = await this.request('/thoughts', {
        method: 'POST',
        body: JSON.stringify({
          transcription: 'Other user thought',
          processed_text: 'Other user thought',
          category: 'reflection',
          mood_score: 0.5,
          priority: 'medium',
          tags: ['test'],
          status: 'pending'
        }),
        headers: { 'Authorization': `Bearer ${otherUserData.token}` }
      });

      if (thoughtData && thoughtData.id) {
        // Try to access with original user's token
        const { status: accessOtherUserStatus } = await this.request(`/thoughts/${thoughtData.id}`, {
          method: 'GET'
        });
        
        if (accessOtherUserStatus === 404 || accessOtherUserStatus === 403) {
          await this.log('User data isolation', 'PASS', 'Cannot access other user data');
        } else {
          await this.log('User data isolation', 'FAIL', `Data isolation failed: ${accessOtherUserStatus}`);
        }
      }
    }
  }

  // Test 4: Network and Timeout Edge Cases
  async testNetworkEdgeCases() {
    console.log('\n🌐 Testing Network Edge Cases...\n');

    // Test 4.1: Malformed JSON
    try {
      const response = await fetch(`${API_BASE}/thoughts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: '{"invalid": json}'
      });
      
      if (response.status === 400) {
        await this.log('Malformed JSON handling', 'PASS', 'Correctly rejected invalid JSON');
      } else {
        await this.log('Malformed JSON handling', 'FAIL', `Expected 400, got ${response.status}`);
      }
    } catch (error) {
      await this.log('Malformed JSON handling', 'FAIL', `Network error: ${error.message}`);
    }

    // Test 4.2: Wrong Content-Type header
    const { status: wrongContentTypeStatus } = await this.request('/thoughts', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        transcription: 'Test',
        processed_text: 'Test',
        category: 'reflection',
        mood_score: 0.5,
        priority: 'medium',
        tags: ['test'],
        status: 'pending'
      })
    });
    
    // Should handle gracefully or reject appropriately
    if (wrongContentTypeStatus === 400 || wrongContentTypeStatus === 415) {
      await this.log('Wrong Content-Type handling', 'PASS', `Correctly handled with status ${wrongContentTypeStatus}`);
    } else {
      await this.log('Wrong Content-Type handling', 'WARN', `Unexpected handling: ${wrongContentTypeStatus}`);
    }

    // Test 4.3: Empty request body
    const { status: emptyBodyStatus } = await this.request('/thoughts', {
      method: 'POST',
      body: ''
    });
    
    if (emptyBodyStatus === 400) {
      await this.log('Empty request body handling', 'PASS', 'Correctly rejected empty body');
    } else {
      await this.log('Empty request body handling', 'FAIL', `Expected 400, got ${emptyBodyStatus}`);
    }

    // Test 4.4: Very large request body (simulated)
    const largeObject = {
      transcription: 'x'.repeat(1000),
      processed_text: 'x'.repeat(1000),
      category: 'reflection',
      mood_score: 0.5,
      priority: 'medium',
      tags: Array(100).fill('tag'),
      status: 'pending',
      extraData: 'x'.repeat(5000)
    };
    
    const { status: largeBodyStatus } = await this.request('/thoughts', {
      method: 'POST',
      body: JSON.stringify(largeObject)
    });
    
    // Should either accept or reject with 413 (too large)
    if ([201, 400, 413].includes(largeBodyStatus)) {
      await this.log('Large request body handling', 'PASS', `Handled appropriately: ${largeBodyStatus}`);
    } else {
      await this.log('Large request body handling', 'FAIL', `Unexpected status: ${largeBodyStatus}`);
    }
  }

  // Test 5: AI Integration Edge Cases
  async testAIIntegrationEdgeCases() {
    console.log('\n🤖 Testing AI Integration Edge Cases...\n');

    if (!this.token) {
      await this.log('AI integration tests', 'FAIL', 'No auth token available');
      return;
    }

    // Test 5.1: Empty text processing
    const { status: emptyTextStatus } = await this.request('/ai/process', {
      method: 'POST',
      body: JSON.stringify({ text: '' })
    });
    
    if (emptyTextStatus === 400) {
      await this.log('Empty text processing', 'PASS', 'Correctly rejected empty text');
    } else {
      await this.log('Empty text processing', 'FAIL', `Expected 400, got ${emptyTextStatus}`);
    }

    // Test 5.2: Very long text processing
    const veryLongText = 'This is a very long text. '.repeat(500); // ~12,500 characters
    const { status: longTextAIStatus } = await this.request('/ai/process', {
      method: 'POST',
      body: JSON.stringify({ text: veryLongText })
    });
    
    // Should handle gracefully (either process or reject appropriately)
    if ([200, 400, 413].includes(longTextAIStatus)) {
      await this.log('Long text AI processing', 'PASS', `Handled appropriately: ${longTextAIStatus}`);
    } else {
      await this.log('Long text AI processing', 'FAIL', `Unexpected status: ${longTextAIStatus}`);
    }

    // Test 5.3: Text with only special characters
    const specialOnlyText = '!@#$%^&*()_+-={}[]|\\:";\'<>?,./ 🎉🚀💯';
    const { status: specialOnlyStatus } = await this.request('/ai/process', {
      method: 'POST',
      body: JSON.stringify({ text: specialOnlyText })
    });
    
    if ([200, 400].includes(specialOnlyStatus)) {
      await this.log('Special characters only processing', 'PASS', `Handled: ${specialOnlyStatus}`);
    } else {
      await this.log('Special characters only processing', 'FAIL', `Unexpected: ${specialOnlyStatus}`);
    }

    // Test 5.4: Non-English text
    const nonEnglishText = '这是中文测试。هذا اختبار باللغة العربية। Это русский тест.';
    const { status: nonEnglishStatus } = await this.request('/ai/process', {
      method: 'POST',
      body: JSON.stringify({ text: nonEnglishText })
    });
    
    if (nonEnglishStatus === 200) {
      await this.log('Non-English text processing', 'PASS', 'Processed non-English text');
    } else {
      await this.log('Non-English text processing', 'WARN', `May not support non-English: ${nonEnglishStatus}`);
    }
  }

  // Test 6: Concurrent Request Edge Cases
  async testConcurrentRequestEdgeCases() {
    console.log('\n⚡ Testing Concurrent Request Edge Cases...\n');

    if (!this.token) {
      await this.log('Concurrent request tests', 'FAIL', 'No auth token available');
      return;
    }

    // Test 6.1: Multiple simultaneous requests
    const concurrentRequests = Array(5).fill().map((_, i) => 
      this.request('/thoughts', {
        method: 'POST',
        body: JSON.stringify({
          transcription: `Concurrent test ${i}`,
          processed_text: `Concurrent test ${i}`,
          category: 'reflection',
          mood_score: 0.5,
          priority: 'medium',
          tags: ['concurrent'],
          status: 'pending'
        })
      })
    );

    try {
      const results = await Promise.all(concurrentRequests);
      const successCount = results.filter(r => r.status === 201).length;
      
      if (successCount === 5) {
        await this.log('Concurrent requests handling', 'PASS', 'All 5 concurrent requests succeeded');
      } else if (successCount > 0) {
        await this.log('Concurrent requests handling', 'WARN', `${successCount}/5 requests succeeded`);
      } else {
        await this.log('Concurrent requests handling', 'FAIL', 'No concurrent requests succeeded');
      }
    } catch (error) {
      await this.log('Concurrent requests handling', 'FAIL', `Error: ${error.message}`);
    }

    // Test 6.2: Rapid sequential requests
    const startTime = Date.now();
    let rapidSuccessCount = 0;
    
    for (let i = 0; i < 10; i++) {
      const { status } = await this.request('/thoughts', {
        method: 'POST',
        body: JSON.stringify({
          transcription: `Rapid test ${i}`,
          processed_text: `Rapid test ${i}`,
          category: 'reflection',
          mood_score: 0.5,
          priority: 'medium',
          tags: ['rapid'],
          status: 'pending'
        })
      });
      
      if (status === 201) rapidSuccessCount++;
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    if (rapidSuccessCount >= 8) {
      await this.log('Rapid sequential requests', 'PASS', `${rapidSuccessCount}/10 succeeded in ${totalTime}ms`);
    } else {
      await this.log('Rapid sequential requests', 'WARN', `Only ${rapidSuccessCount}/10 succeeded`);
    }
  }

  // Test 7: Memory and Resource Edge Cases
  async testResourceEdgeCases() {
    console.log('\n💾 Testing Resource Edge Cases...\n');

    if (!this.token) {
      await this.log('Resource tests', 'FAIL', 'No auth token available');
      return;
    }

    // Test 7.1: Create many records to test memory usage
    const BATCH_SIZE = 50;
    let createdCount = 0;
    
    for (let i = 0; i < BATCH_SIZE; i++) {
      const { status } = await this.request('/thoughts', {
        method: 'POST',
        body: JSON.stringify({
          transcription: `Memory test ${i}`,
          processed_text: `Memory test ${i} - testing memory usage with many records`,
          category: 'reflection',
          mood_score: Math.random() * 2 - 1,
          priority: ['low', 'medium', 'high'][i % 3],
          tags: [`test-${i}`, 'memory', 'batch'],
          status: 'pending'
        })
      });
      
      if (status === 201) createdCount++;
      
      // Small delay to avoid overwhelming the server
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    if (createdCount >= BATCH_SIZE * 0.8) {
      await this.log('Batch record creation', 'PASS', `Created ${createdCount}/${BATCH_SIZE} records`);
    } else {
      await this.log('Batch record creation', 'FAIL', `Only created ${createdCount}/${BATCH_SIZE} records`);
    }

    // Test 7.2: Retrieve all records (testing query performance)
    const { status: retrieveAllStatus, data: allThoughts } = await this.request('/thoughts');
    
    if (retrieveAllStatus === 200 && Array.isArray(allThoughts)) {
      await this.log('Large dataset retrieval', 'PASS', `Retrieved ${allThoughts.length} records`);
    } else {
      await this.log('Large dataset retrieval', 'FAIL', `Failed to retrieve records: ${retrieveAllStatus}`);
    }
  }

  async runAllEdgeCaseTests() {
    console.log('🧪 Starting Edge Case Test Suite...\n');
    
    // Setup test user
    if (!(await this.setupTestUser())) {
      console.log('❌ Failed to setup test user. Aborting tests.');
      return;
    }

    const tests = [
      () => this.testAuthenticationEdgeCases(),
      () => this.testInputValidationEdgeCases(),
      () => this.testDatabaseConstraintEdgeCases(),
      () => this.testNetworkEdgeCases(),
      () => this.testAIIntegrationEdgeCases(),
      () => this.testConcurrentRequestEdgeCases(),
      () => this.testResourceEdgeCases()
    ];

    for (const test of tests) {
      try {
        await test();
      } catch (error) {
        await this.log('Test Execution', 'FAIL', error.message);
      }
      // Delay between test suites
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Summary
    console.log('\n📊 Edge Case Test Summary:');
    console.log(`Total Tests: ${this.testResults.length}`);
    console.log(`Passed: ${this.testResults.filter(r => r.status === 'PASS').length}`);
    console.log(`Failed: ${this.testResults.filter(r => r.status === 'FAIL').length}`);
    console.log(`Warnings: ${this.testResults.filter(r => r.status === 'WARN').length}`);

    // Save detailed results
    const reportPath = path.join(__dirname, '../edge-case-test-results.json');
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
      console.log(`\n⚠️  ${failedTests} edge case tests failed. Review for potential issues.`);
    } else {
      console.log('\n✅ All edge case tests passed!');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new EdgeCaseTester();
  tester.runAllEdgeCaseTests().catch(error => {
    console.error('❌ Edge case test suite failed:', error);
    process.exit(1);
  });
}

module.exports = EdgeCaseTester;