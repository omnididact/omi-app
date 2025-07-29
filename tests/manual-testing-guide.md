# OMI App OpenAI Integration - Manual Testing Guide

## Prerequisites
- ✅ Backend running on http://localhost:3001
- ✅ Frontend running on http://localhost:5173  
- ✅ OpenAI API key configured in .env
- ✅ User account created and logged in

## Critical Test Scenarios

### 1. OpenAI API Connection Test

**Test Steps:**
1. Open browser console (F12)
2. Navigate to any page
3. Run this test in console:

```javascript
// Test direct API connection
fetch('http://localhost:3001/ai/invoke-llm', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('authToken')
  },
  body: JSON.stringify({
    prompt: 'Reply with exactly "API_WORKING" if you can read this',
    model: 'gpt-4o-mini'
  })
})
.then(r => r.json())
.then(data => console.log('✅ API Response:', data))
.catch(err => console.error('❌ API Error:', err));
```

**Expected Result:** Response containing "API_WORKING"

### 2. Whisper Audio Transcription Test

**Test Steps:**
1. Go to Record page (/)
2. Ensure microphone access is granted
3. Click Voice tab
4. Record a clear 3-5 second message: "This is a test of the Whisper transcription system"
5. Stop recording and observe processing

**Expected Results:**
- ✅ Recording indicator appears during recording
- ✅ "AI Processing..." shows after stopping
- ✅ Transcribed text appears accurately
- ✅ Processing completes within 10 seconds

**Console Test (Alternative):**
```javascript
// Test audio transcription endpoint directly
// Note: You'll need an actual audio blob for this test
const testAudioTranscription = async () => {
  const response = await fetch('/ai/transcribe', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + localStorage.getItem('authToken')
    },
    body: new FormData() // Would need actual audio file
  });
  console.log('Transcription result:', await response.json());
};
```

### 3. Thought Processing & Categorization Test

**Test Cases:**

#### Test Case A: Clear Task (Should Auto-Route to Actions)
1. Go to Record page
2. Use Text input mode
3. Enter: "I need to learn how to set up a React development environment step by step"
4. Click "Process Thoughts"

**Expected Results:**
- ✅ Message: "📋 1 task added to Actions with step-by-step guidance"
- ✅ No triage cards appear
- ✅ Check Todo page - new item should appear with detailed action steps

#### Test Case B: Pure Emotion (Should Auto-Route to Thoughts)
1. Enter: "I feel really excited about my progress today and grateful for all the opportunities"
2. Click "Process Thoughts"

**Expected Results:**
- ✅ Message: "💭 1 thought archived"
- ✅ No triage cards appear
- ✅ Check Memory page - thought should be stored

#### Test Case C: Ambiguous Thought (Should Require Triage)
1. Enter: "I'm thinking about starting a side business but I'm not sure if it's the right time"
2. Click "Process Thoughts"

**Expected Results:**
- ✅ Message: "🤔 1 thought needs your decision"
- ✅ Triage card appears with swipe instructions
- ✅ Can swipe left (Thoughts) or right (Actions)

### 4. End-to-End Voice Pipeline Test

**Complete Voice Workflow:**
1. Go to Record page
2. Click Voice tab
3. Record: "How do I create a budget for my personal finances?"
4. Wait for processing
5. Observe auto-routing or triage
6. If triage appears, swipe right (Actions)
7. Go to Todo page
8. Verify task appears with detailed action steps

**Success Criteria:**
- ✅ Voice recorded without errors
- ✅ Transcription accurate
- ✅ AI correctly identifies as actionable task
- ✅ Auto-routes to Actions OR presents for triage
- ✅ Task appears in Todo with step-by-step guidance
- ✅ Each step includes recommendations and time estimates

### 5. Error Handling Tests

#### Test A: No Microphone Access
1. In browser settings, deny microphone access
2. Try to record voice
**Expected:** Graceful error message + switch to text input

#### Test B: Network Interruption
1. Start recording
2. Disconnect internet
3. Stop recording
**Expected:** Clear error message, not silent failure

#### Test C: Very Long Text Input
1. Paste a very long text (5000+ characters) in text input
2. Click Process Thoughts
**Expected:** Either processes successfully or shows appropriate error

### 6. Performance Tests

#### Test A: Response Time
- Voice recordings should process within 10 seconds
- Text processing should complete within 5 seconds
- UI should remain responsive during processing

#### Test B: Concurrent Usage
1. Open multiple browser tabs
2. Process thoughts simultaneously
3. Verify all process correctly without interference

### 7. Data Persistence Test

**Test Steps:**
1. Process several thoughts (mix of voice and text)
2. Navigate between pages
3. Refresh browser
4. Check that all processed thoughts appear correctly in:
   - Todo page (for actioned thoughts)
   - Memory page (for archived thoughts)

## Console Testing Scripts

### Quick API Health Check
```javascript
const testAPIHealth = async () => {
  const tests = [
    {
      name: 'LLM Service',
      endpoint: '/ai/invoke-llm',
      payload: { prompt: 'Say "OK"', model: 'gpt-4o-mini' }
    },
    {
      name: 'Image Generation',
      endpoint: '/ai/generate-image', 
      payload: { prompt: 'A simple red circle' }
    }
  ];

  for (const test of tests) {
    try {
      const response = await fetch(`http://localhost:3001${test.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('authToken')
        },
        body: JSON.stringify(test.payload)
      });
      
      const result = await response.json();
      console.log(`✅ ${test.name}:`, result);
    } catch (error) {
      console.error(`❌ ${test.name}:`, error);
    }
  }
};

testAPIHealth();
```

### Thought Processing Validation
```javascript
const validateThoughtProcessing = async (text) => {
  try {
    const response = await fetch('http://localhost:3001/ai/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('authToken')
      },
      body: JSON.stringify({ text })
    });
    
    const result = await response.json();
    console.log('Thought Processing Result:', result);
    
    // Validate structure
    if (result.thoughts && result.thoughts[0]) {
      const thought = result.thoughts[0];
      console.log('✅ Structure valid');
      console.log('Category:', thought.category);
      console.log('Auto Destination:', thought.auto_destination);
      console.log('Requires Triage:', thought.requires_triage);
      console.log('Action Steps:', thought.action_steps?.length || 0);
    } else {
      console.error('❌ Invalid response structure');
    }
  } catch (error) {
    console.error('❌ Processing failed:', error);
  }
};

// Test with different types of thoughts
validateThoughtProcessing("I need to organize my workspace");
validateThoughtProcessing("I feel happy about today");
validateThoughtProcessing("Maybe I should learn Python or JavaScript");
```

## Success Criteria Summary

### ✅ Critical Must-Pass Tests:
1. **API Connection**: LLM responds correctly to test prompts
2. **Voice Recording**: Audio captures and transcribes accurately  
3. **Thought Routing**: AI correctly auto-routes clear tasks/emotions
4. **Triage System**: Ambiguous thoughts present swipe interface
5. **Data Persistence**: All processed thoughts save to database
6. **Error Handling**: Graceful failure messages (no silent errors)

### ⚠️ Performance Benchmarks:
- Voice transcription: < 10 seconds
- Text processing: < 5 seconds  
- UI responsiveness: No blocking operations
- Auto-routing accuracy: > 80% for clear cases

### 🎯 Advanced Features:
- Step-by-step action guidance for tasks
- Mood scoring accuracy
- Tag generation relevance
- Priority assignment logic

## Troubleshooting Common Issues

### Issue: "Failed to process AI request"
- **Check:** OpenAI API key in .env
- **Check:** Backend server logs for specific errors
- **Check:** Network connectivity

### Issue: Audio not recording
- **Check:** Browser microphone permissions
- **Check:** Audio device availability
- **Try:** Switch to text input mode

### Issue: Thoughts not appearing in Todo/Memory
- **Check:** User authentication token
- **Check:** Database connectivity  
- **Check:** Browser network tab for API errors

### Issue: Slow processing times
- **Check:** OpenAI API status
- **Check:** Network speed
- **Consider:** Current API load/rate limits