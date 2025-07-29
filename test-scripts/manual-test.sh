#!/bin/bash

# Manual Testing Script for OMI App
# Run this script to perform manual testing of critical functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE="http://localhost:3001/api"
TEST_EMAIL="manual-test@example.com"
TEST_PASSWORD="testpass123"
TEST_NAME="Manual Test User"

# Function to print colored output
print_status() {
    case $1 in
        "INFO")
            echo -e "${BLUE}ℹ️  $2${NC}"
            ;;
        "SUCCESS")
            echo -e "${GREEN}✅ $2${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $2${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $2${NC}"
            ;;
    esac
}

# Function to wait for user input
wait_for_user() {
    echo ""
    read -p "Press Enter to continue or 'q' to quit: " -r input
    if [[ $input == "q" ]]; then
        print_status "INFO" "Manual testing stopped by user"
        exit 0
    fi
}

# Function to test HTTP endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local auth_header=$5

    print_status "INFO" "Testing: $method $endpoint"
    
    if [[ -n $auth_header ]]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_BASE$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $auth_header" \
            -d "$data" 2>/dev/null || echo -e "\n000")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_BASE$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null || echo -e "\n000")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | head -n -1)
    
    if [[ $status_code == $expected_status ]]; then
        print_status "SUCCESS" "Status: $status_code (Expected: $expected_status)"
        echo "Response: $response_body"
    else
        print_status "ERROR" "Status: $status_code (Expected: $expected_status)"
        echo "Response: $response_body"
    fi
}

# Check if servers are running
check_servers() {
    print_status "INFO" "Checking if servers are running..."
    
    # Check backend server
    if curl -s "$API_BASE/health" > /dev/null 2>&1; then
        print_status "SUCCESS" "Backend server is running on port 3001"
    else
        print_status "ERROR" "Backend server is not running. Please start with: npm run server"
        exit 1
    fi
    
    # Check frontend server
    if curl -s "http://localhost:5173" > /dev/null 2>&1; then
        print_status "SUCCESS" "Frontend server is running on port 5173"
    else
        print_status "WARNING" "Frontend server may not be running. Start with: npm run dev"
    fi
}

# Test 1: Health Check
test_health_check() {
    print_status "INFO" "=== Testing Health Check ==="
    test_endpoint "GET" "/health" "" "200"
    wait_for_user
}

# Test 2: User Registration
test_user_registration() {
    print_status "INFO" "=== Testing User Registration ==="
    
    # Create unique email for this test
    UNIQUE_EMAIL="test-$(date +%s)@example.com"
    
    test_endpoint "POST" "/auth/register" \
        "{\"email\":\"$UNIQUE_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\"}" \
        "201"
    
    print_status "INFO" "Try registering with the same email again (should fail)"
    test_endpoint "POST" "/auth/register" \
        "{\"email\":\"$UNIQUE_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\"}" \
        "400"
    
    wait_for_user
}

# Test 3: User Login
test_user_login() {
    print_status "INFO" "=== Testing User Login ==="
    
    # First register a user
    UNIQUE_EMAIL="login-test-$(date +%s)@example.com"
    register_response=$(curl -s -X POST "$API_BASE/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$UNIQUE_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\"}")
    
    print_status "INFO" "Registered user for login test"
    
    # Test valid login
    print_status "INFO" "Testing valid login credentials"
    login_response=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$UNIQUE_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
    
    login_status=$(echo "$login_response" | tail -n1)
    login_body=$(echo "$login_response" | head -n -1)
    
    if [[ $login_status == "200" ]]; then
        print_status "SUCCESS" "Login successful"
        # Extract token for later use
        JWT_TOKEN=$(echo "$login_body" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
        print_status "INFO" "JWT Token extracted for authenticated tests"
        echo "Response: $login_body"
    else
        print_status "ERROR" "Login failed with status: $login_status"
        echo "Response: $login_body"
    fi
    
    # Test invalid login
    print_status "INFO" "Testing invalid login credentials"
    test_endpoint "POST" "/auth/login" \
        "{\"email\":\"$UNIQUE_EMAIL\",\"password\":\"wrongpassword\"}" \
        "401"
    
    wait_for_user
}

# Test 4: Protected Routes
test_protected_routes() {
    print_status "INFO" "=== Testing Protected Routes ==="
    
    # Test without authentication
    print_status "INFO" "Testing access without authentication (should fail)"
    test_endpoint "GET" "/thoughts" "" "401"
    
    if [[ -n $JWT_TOKEN ]]; then
        # Test with authentication
        print_status "INFO" "Testing access with authentication (should succeed)"
        test_endpoint "GET" "/thoughts" "" "200" "$JWT_TOKEN"
    else
        print_status "WARNING" "No JWT token available, skipping authenticated test"
    fi
    
    wait_for_user
}

# Test 5: CRUD Operations
test_crud_operations() {
    print_status "INFO" "=== Testing CRUD Operations ==="
    
    if [[ -z $JWT_TOKEN ]]; then
        print_status "WARNING" "No JWT token available, skipping CRUD tests"
        return
    fi
    
    # Create a thought
    print_status "INFO" "Testing thought creation"
    create_response=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/thoughts" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -d '{"transcription":"Test thought","processed_text":"This is a test thought","category":"reflection","mood_score":0.5,"priority":"medium","tags":["test"],"status":"pending"}')
    
    create_status=$(echo "$create_response" | tail -n1)
    create_body=$(echo "$create_response" | head -n -1)
    
    if [[ $create_status == "201" ]]; then
        print_status "SUCCESS" "Thought created successfully"
        # Extract thought ID
        THOUGHT_ID=$(echo "$create_body" | grep -o '"id":[0-9]*' | cut -d':' -f2)
        print_status "INFO" "Created thought with ID: $THOUGHT_ID"
    else
        print_status "ERROR" "Failed to create thought: $create_status"
        echo "Response: $create_body"
    fi
    
    # Read thoughts
    print_status "INFO" "Testing thought retrieval"
    test_endpoint "GET" "/thoughts" "" "200" "$JWT_TOKEN"
    
    if [[ -n $THOUGHT_ID ]]; then
        # Update thought
        print_status "INFO" "Testing thought update"
        test_endpoint "PUT" "/thoughts/$THOUGHT_ID" \
            '{"status":"memory_banked"}' \
            "200" "$JWT_TOKEN"
        
        # Delete thought
        print_status "INFO" "Testing thought deletion"
        test_endpoint "DELETE" "/thoughts/$THOUGHT_ID" "" "204" "$JWT_TOKEN"
    fi
    
    wait_for_user
}

# Test 6: AI Integration
test_ai_integration() {
    print_status "INFO" "=== Testing AI Integration ==="
    
    if [[ -z $JWT_TOKEN ]]; then
        print_status "WARNING" "No JWT token available, skipping AI tests"
        return
    fi
    
    print_status "INFO" "Testing AI text processing"
    test_endpoint "POST" "/ai/process" \
        '{"text":"I need to learn React hooks for my project"}' \
        "200" "$JWT_TOKEN"
    
    wait_for_user
}

# Test 7: Error Handling
test_error_handling() {
    print_status "INFO" "=== Testing Error Handling ==="
    
    # Test invalid JSON
    print_status "INFO" "Testing invalid JSON handling"
    invalid_response=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d "invalid json" 2>/dev/null)
    
    invalid_status=$(echo "$invalid_response" | tail -n1)
    if [[ $invalid_status == "400" ]]; then
        print_status "SUCCESS" "Invalid JSON correctly rejected"
    else
        print_status "ERROR" "Invalid JSON not handled properly: $invalid_status"
    fi
    
    # Test missing fields
    print_status "INFO" "Testing missing required fields"
    test_endpoint "POST" "/auth/login" '{}' "400"
    
    # Test non-existent endpoint
    print_status "INFO" "Testing non-existent endpoint"
    test_endpoint "GET" "/nonexistent" "" "404"
    
    wait_for_user
}

# Test 8: Frontend Integration
test_frontend_integration() {
    print_status "INFO" "=== Frontend Integration Test ==="
    
    print_status "INFO" "Please manually test the following in your browser:"
    echo ""
    echo "1. Open http://localhost:5173"
    echo "2. Test user registration"
    echo "3. Test user login"
    echo "4. Test voice recording (if microphone available)"
    echo "5. Test text input processing"
    echo "6. Navigate between pages"
    echo "7. Test logout functionality"
    echo ""
    print_status "INFO" "Check browser console for any JavaScript errors"
    
    read -p "Did all frontend tests pass? (y/n): " -r frontend_result
    if [[ $frontend_result == "y" ]]; then
        print_status "SUCCESS" "Frontend integration tests passed"
    else
        print_status "ERROR" "Frontend integration tests failed"
    fi
    
    wait_for_user
}

# Test 9: Database Persistence
test_database_persistence() {
    print_status "INFO" "=== Testing Database Persistence ==="
    
    # Check if database file exists
    if [[ -f "server/database.sqlite" ]]; then
        print_status "SUCCESS" "Database file exists"
        
        # Check database tables
        print_status "INFO" "Checking database tables"
        sqlite3 server/database.sqlite ".tables" 2>/dev/null || print_status "WARNING" "SQLite3 command not available"
        
        # Check record count
        user_count=$(sqlite3 server/database.sqlite "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "N/A")
        thought_count=$(sqlite3 server/database.sqlite "SELECT COUNT(*) FROM thoughts;" 2>/dev/null || echo "N/A")
        goal_count=$(sqlite3 server/database.sqlite "SELECT COUNT(*) FROM goals;" 2>/dev/null || echo "N/A")
        
        print_status "INFO" "Database records - Users: $user_count, Thoughts: $thought_count, Goals: $goal_count"
    else
        print_status "ERROR" "Database file not found"
    fi
    
    wait_for_user
}

# Test 10: Environment Configuration
test_environment_config() {
    print_status "INFO" "=== Testing Environment Configuration ==="
    
    # Check environment variables
    if [[ -f ".env" ]]; then
        print_status "SUCCESS" ".env file exists"
        
        # Check critical variables (without exposing values)
        if grep -q "OPENAI_API_KEY" .env; then
            print_status "SUCCESS" "OPENAI_API_KEY is configured"
        else
            print_status "ERROR" "OPENAI_API_KEY not found in .env"
        fi
        
        if grep -q "JWT_SECRET" .env; then
            print_status "SUCCESS" "JWT_SECRET is configured"
        else
            print_status "ERROR" "JWT_SECRET not found in .env"
        fi
    else
        print_status "ERROR" ".env file not found"
    fi
    
    # Check Node.js version
    node_version=$(node --version)
    print_status "INFO" "Node.js version: $node_version"
    
    # Check npm dependencies
    if [[ -d "node_modules" ]]; then
        print_status "SUCCESS" "node_modules directory exists"
    else
        print_status "ERROR" "node_modules not found - run npm install"
    fi
    
    wait_for_user
}

# Main function
main() {
    print_status "INFO" "🧪 OMI App Manual Testing Script"
    print_status "INFO" "This script will guide you through testing all critical functionality"
    echo ""
    
    # Check prerequisites
    check_servers
    
    print_status "INFO" "Starting manual testing process..."
    echo ""
    
    # Run all tests
    test_health_check
    test_user_registration
    test_user_login
    test_protected_routes
    test_crud_operations
    test_ai_integration
    test_error_handling
    test_database_persistence
    test_environment_config
    test_frontend_integration
    
    print_status "SUCCESS" "🎉 Manual testing completed!"
    print_status "INFO" "Review the results above and fix any issues found"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi