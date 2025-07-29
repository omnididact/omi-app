# Comprehensive Testing Plan for OMI App Migration

## Project Overview
Successfully migrated React app from base44 to custom backend with:
- **Backend**: Express.js with SQLite (better-sqlite3) 
- **Authentication**: JWT-based system
- **AI Integration**: OpenAI GPT-4o-mini for LLM calls
- **Speech**: Whisper API for audio transcription
- **Frontend**: React 18 with Vite dev server

## 1. CRITICAL USER FLOWS TESTING

### 1.1 Authentication Flow Testing
**Priority: HIGH**

#### Test Cases:
1. **User Registration**
   ```bash
   # Test endpoint manually
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"testpass123","name":"Test User"}'
   ```
   - ✅ Valid email/password registration
   - ✅ Duplicate email rejection
   - ✅ Weak password rejection
   - ✅ JWT token generation
   - ✅ User data storage in SQLite

2. **User Login**
   ```bash
   # Test endpoint manually
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"testpass123"}'
   ```
   - ✅ Valid credentials login
   - ✅ Invalid credentials rejection
   - ✅ JWT token return
   - ✅ Token storage in localStorage

3. **Authentication Persistence**
   - ✅ Page refresh maintains login state
   - ✅ Token expiration handling
   - ✅ Automatic logout on invalid token
   - ✅ Protected routes redirect to login

### 1.2 Voice Recording & AI Processing Flow
**Priority: HIGH**

#### Test Cases:
1. **Voice Recording**
   - ✅ Microphone permission request
   - ✅ Recording start/stop functionality
   - ✅ Recording timer accuracy
   - ✅ Cancel recording functionality
   - ✅ Audio quality (webm/opus format)

2. **Whisper Transcription**
   ```bash
   # Test transcription endpoint
   curl -X POST http://localhost:3001/api/ai/transcribe \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -F "audio=@test_audio.webm"
   ```
   - ✅ Audio file upload
   - ✅ Whisper API integration
   - ✅ Transcription accuracy
   - ✅ Error handling for poor audio
   - ✅ File size limits (10mb)

3. **AI Text Processing**
   ```bash
   # Test LLM processing
   curl -X POST http://localhost:3001/api/ai/process \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{"text":"I need to learn React hooks for my project"}'
   ```
   - ✅ GPT-4o-mini integration
   - ✅ Thought categorization (reflection, idea, concern, goal, memory, task, emotion, observation)
   - ✅ Auto-routing logic (thoughts vs actions)
   - ✅ Triage system for ambiguous thoughts
   - ✅ Action step generation for tasks

### 1.3 CRUD Operations Testing
**Priority: HIGH**

#### Thoughts Management:
```bash
# Test thoughts CRUD
curl -X GET http://localhost:3001/api/thoughts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

curl -X POST http://localhost:3001/api/thoughts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"processed_text":"Test thought","category":"reflection","status":"pending"}'
```

#### Goals Management:
```bash
# Test goals CRUD
curl -X GET http://localhost:3001/api/goals \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

curl -X POST http://localhost:3001/api/goals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"title":"Learn React","description":"Master React hooks","status":"active"}'
```

#### Test Cases:
- ✅ Create, read, update, delete operations
- ✅ User-specific data isolation
- ✅ SQLite database persistence
- ✅ Data validation and sanitization
- ✅ Error handling for invalid data

### 1.4 Page Navigation & UI Testing
**Priority: MEDIUM**

#### Test Cases:
- ✅ All page routes functional (/record, /goals, /insights, etc.)
- ✅ AuthWrapper protecting routes
- ✅ Page transitions and animations
- ✅ Mobile responsiveness
- ✅ Component error boundaries
- ✅ Loading states and spinners

## 2. INTEGRATION TESTING

### 2.1 API Integration Testing
Create test script for comprehensive API testing:

```javascript
// api-test.js
const API_BASE = 'http://localhost:3001/api';

async function runAPITests() {
  // 1. Health check
  const health = await fetch(`${API_BASE}/health`);
  console.log('Health:', await health.json());
  
  // 2. Register user
  const register = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `test${Date.now()}@example.com`,
      password: 'testpass123',
      name: 'Test User'
    })
  });
  const registerData = await register.json();
  console.log('Register:', registerData);
  
  // 3. Login and get token
  // 4. Test protected endpoints
  // 5. Test AI endpoints
  // 6. Test CRUD operations
}
```

### 2.2 Database Integration Testing
```bash
# Check SQLite database
sqlite3 server/database.sqlite ".tables"
sqlite3 server/database.sqlite "SELECT * FROM users LIMIT 5;"
sqlite3 server/database.sqlite "SELECT * FROM thoughts ORDER BY created_at DESC LIMIT 10;"
```

## 3. ERROR HANDLING & EDGE CASES

### 3.1 Network & API Errors
- ✅ Server offline scenarios
- ✅ API timeout handling
- ✅ Invalid response handling
- ✅ Network connectivity issues
- ✅ Rate limiting responses

### 3.2 Audio & Speech Errors
- ✅ Microphone access denied
- ✅ No microphone available
- ✅ Poor audio quality
- ✅ Silent recordings
- ✅ Large file uploads
- ✅ Whisper API failures

### 3.3 Data Validation
- ✅ Invalid JWT tokens
- ✅ Malformed request data
- ✅ SQL injection attempts
- ✅ XSS prevention
- ✅ File upload validation

## 4. PERFORMANCE TESTING

### 4.1 Load Testing
- ✅ Multiple concurrent users
- ✅ Large audio file processing
- ✅ Database query performance
- ✅ Memory usage monitoring
- ✅ Response time benchmarks

### 4.2 Browser Compatibility
- ✅ Chrome/Safari/Firefox testing
- ✅ Mobile browser testing
- ✅ WebRTC MediaRecorder support
- ✅ LocalStorage functionality
- ✅ Responsive design validation

## 5. MANUAL TESTING CHECKLIST

### 5.1 Happy Path Testing
1. **Complete User Journey**
   - [ ] Register new account
   - [ ] Login successfully
   - [ ] Record voice note
   - [ ] Verify transcription accuracy
   - [ ] Check AI processing results
   - [ ] Verify data appears in correct sections
   - [ ] Navigate between all pages
   - [ ] Create/edit goals
   - [ ] Logout and login again

2. **Voice Recording Flow**
   - [ ] Start voice recording
   - [ ] Speak clear test sentence
   - [ ] Stop recording
   - [ ] Verify transcription matches speech
   - [ ] Check AI categorization is logical
   - [ ] Verify auto-routing works correctly

3. **Text Input Flow**
   - [ ] Switch to text input mode
   - [ ] Enter test thoughts/tasks
   - [ ] Verify AI processing
   - [ ] Check triage system for ambiguous inputs
   - [ ] Test swipe gestures on mobile

### 5.2 Error Scenario Testing
1. **Authentication Errors**
   - [ ] Test with wrong password
   - [ ] Test with non-existent email
   - [ ] Test with expired token
   - [ ] Test accessing protected routes without auth

2. **Recording Errors**
   - [ ] Deny microphone permission
   - [ ] Record silence
   - [ ] Cancel recording mid-way
   - [ ] Test very short recordings

3. **Network Errors**
   - [ ] Disconnect internet during recording
   - [ ] Test with slow connection
   - [ ] Server restart during operation

## 6. AUTOMATED TESTING IMPLEMENTATION

### 6.1 Unit Tests
```javascript
// Example test structure
describe('AudioRecorder', () => {
  test('should start recording successfully', async () => {
    const recorder = new AudioRecorder();
    const result = await recorder.startRecording();
    expect(result).toBe(true);
  });
});

describe('API Client', () => {
  test('should handle authentication', async () => {
    const client = new APIClient();
    const response = await client.post('/auth/login', {
      email: 'test@example.com',
      password: 'testpass123'
    });
    expect(response.token).toBeDefined();
  });
});
```

### 6.2 Integration Tests
```javascript
// Example integration test
describe('Voice to AI Flow', () => {
  test('should complete full voice processing pipeline', async () => {
    // 1. Mock audio recording
    // 2. Test transcription
    // 3. Test AI processing
    // 4. Verify database storage
    // 5. Check UI updates
  });
});
```

## 7. TESTING TIMELINE

### Phase 1: Critical Path (Day 1)
- Authentication flow
- Basic voice recording
- AI processing
- Data persistence

### Phase 2: Feature Complete (Day 2)
- All CRUD operations
- Error handling
- Edge cases
- Performance basics

### Phase 3: Polish (Day 3)
- Mobile testing
- Browser compatibility
- User experience
- Performance optimization

## 8. SUCCESS CRITERIA

### Must Have:
- [ ] User can register/login successfully
- [ ] Voice recording → transcription → AI processing works end-to-end
- [ ] Data persists correctly in SQLite
- [ ] All pages load and function
- [ ] No critical security vulnerabilities

### Should Have:
- [ ] Graceful error handling
- [ ] Good performance under normal load
- [ ] Mobile-friendly experience
- [ ] Proper loading states

### Nice to Have:
- [ ] Offline functionality
- [ ] Advanced error recovery
- [ ] Performance optimizations
- [ ] Enhanced accessibility