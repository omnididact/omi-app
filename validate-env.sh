#!/bin/bash

# Environment Validation Script for OMI App
# Validates all required environment variables and configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
WARNINGS=0

# Function to print colored output
print_status() {
    case $1 in
        "INFO")
            echo -e "${BLUE}ℹ️  $2${NC}"
            ;;
        "SUCCESS")
            echo -e "${GREEN}✅ $2${NC}"
            ((CHECKS_PASSED++))
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $2${NC}"
            ((WARNINGS++))
            ;;
        "ERROR")
            echo -e "${RED}❌ $2${NC}"
            ((CHECKS_FAILED++))
            ;;
    esac
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check file permissions
check_file_permissions() {
    local file=$1
    local expected_perms=$2
    
    if [[ -f "$file" ]]; then
        actual_perms=$(stat -c "%a" "$file" 2>/dev/null || stat -f "%OLp" "$file" 2>/dev/null)
        if [[ "$actual_perms" == "$expected_perms" ]]; then
            print_status "SUCCESS" "$file has correct permissions ($expected_perms)"
        else
            print_status "WARNING" "$file permissions are $actual_perms (expected $expected_perms)"
        fi
    else
        print_status "ERROR" "$file not found"
    fi
}

# Function to validate environment variables
validate_env_vars() {
    print_status "INFO" "=== Environment Variables Validation ==="
    
    # Check if .env file exists
    if [[ -f ".env" ]]; then
        print_status "SUCCESS" ".env file exists"
        source .env
    else
        print_status "ERROR" ".env file not found"
        print_status "INFO" "Create .env file with required variables:"
        echo "OPENAI_API_KEY=your_api_key_here"
        echo "JWT_SECRET=your_jwt_secret_here"
        echo "PORT=3001"
        echo "NODE_ENV=development"
        return 1
    fi
    
    # Check OPENAI_API_KEY
    if [[ -n "$OPENAI_API_KEY" ]]; then
        if [[ ${#OPENAI_API_KEY} -ge 40 ]]; then
            print_status "SUCCESS" "OPENAI_API_KEY is set and looks valid"
        else
            print_status "WARNING" "OPENAI_API_KEY is set but may be invalid (too short)"
        fi
    else
        print_status "ERROR" "OPENAI_API_KEY is not set"
    fi
    
    # Check JWT_SECRET
    if [[ -n "$JWT_SECRET" ]]; then
        if [[ ${#JWT_SECRET} -ge 32 ]]; then
            print_status "SUCCESS" "JWT_SECRET is set with adequate length"
        else
            print_status "WARNING" "JWT_SECRET is too short (should be at least 32 characters)"
        fi
    else
        print_status "ERROR" "JWT_SECRET is not set"
    fi
    
    # Check PORT
    if [[ -n "$PORT" ]]; then
        if [[ "$PORT" =~ ^[0-9]+$ ]] && [[ "$PORT" -ge 1024 ]] && [[ "$PORT" -le 65535 ]]; then
            print_status "SUCCESS" "PORT is set to valid value: $PORT"
        else
            print_status "WARNING" "PORT value may be invalid: $PORT"
        fi
    else
        print_status "WARNING" "PORT not set, will default to 3001"
    fi
    
    # Check NODE_ENV
    if [[ -n "$NODE_ENV" ]]; then
        case "$NODE_ENV" in
            "development"|"production"|"test")
                print_status "SUCCESS" "NODE_ENV is set to valid value: $NODE_ENV"
                ;;
            *)
                print_status "WARNING" "NODE_ENV has unexpected value: $NODE_ENV"
                ;;
        esac
    else
        print_status "WARNING" "NODE_ENV not set, will default to development"
    fi
}

# Function to validate Node.js environment
validate_nodejs() {
    print_status "INFO" "=== Node.js Environment Validation ==="
    
    # Check Node.js version
    if command_exists node; then
        NODE_VERSION=$(node --version)
        print_status "SUCCESS" "Node.js is installed: $NODE_VERSION"
        
        # Check if version is 16 or higher
        NODE_MAJOR_VERSION=$(echo "$NODE_VERSION" | sed 's/v//' | cut -d. -f1)
        if [[ "$NODE_MAJOR_VERSION" -ge 16 ]]; then
            print_status "SUCCESS" "Node.js version is compatible (>= 16)"
        else
            print_status "ERROR" "Node.js version is too old (< 16)"
        fi
    else
        print_status "ERROR" "Node.js is not installed"
    fi
    
    # Check npm version
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        print_status "SUCCESS" "npm is installed: $NPM_VERSION"
    else
        print_status "ERROR" "npm is not installed"
    fi
    
    # Check if node_modules exists
    if [[ -d "node_modules" ]]; then
        print_status "SUCCESS" "node_modules directory exists"
        
        # Check critical dependencies
        local critical_deps=("express" "cors" "better-sqlite3" "bcryptjs" "jsonwebtoken" "openai" "react" "react-dom")
        
        for dep in "${critical_deps[@]}"; do
            if [[ -d "node_modules/$dep" ]]; then
                print_status "SUCCESS" "$dep is installed"
            else
                print_status "ERROR" "$dep is not installed"
            fi
        done
    else
        print_status "ERROR" "node_modules directory not found. Run: npm install"
    fi
}

# Function to validate database setup
validate_database() {
    print_status "INFO" "=== Database Validation ==="
    
    # Check if server directory exists
    if [[ -d "server" ]]; then
        print_status "SUCCESS" "server directory exists"
    else
        print_status "ERROR" "server directory not found"
        return 1
    fi
    
    # Check if database file exists
    if [[ -f "server/database.sqlite" ]]; then
        print_status "SUCCESS" "SQLite database file exists"
        
        # Check file size
        DB_SIZE=$(stat -c%s "server/database.sqlite" 2>/dev/null || stat -f%z "server/database.sqlite" 2>/dev/null)
        if [[ "$DB_SIZE" -gt 0 ]]; then
            print_status "SUCCESS" "Database file has content (${DB_SIZE} bytes)"
        else
            print_status "WARNING" "Database file is empty"
        fi
        
        # Check database permissions
        check_file_permissions "server/database.sqlite" "644"
        
        # Test database accessibility (if sqlite3 is available)
        if command_exists sqlite3; then
            if sqlite3 server/database.sqlite ".tables" >/dev/null 2>&1; then
                TABLES=$(sqlite3 server/database.sqlite ".tables" 2>/dev/null)
                if [[ -n "$TABLES" ]]; then
                    print_status "SUCCESS" "Database is accessible and has tables"
                    echo "   Tables: $TABLES"
                else
                    print_status "WARNING" "Database is accessible but has no tables"
                fi
            else
                print_status "ERROR" "Cannot access database"
            fi
        else
            print_status "WARNING" "sqlite3 command not available, cannot test database access"
        fi
    else
        print_status "WARNING" "Database file not found (will be created on first run)"
    fi
    
    # Check database models
    local model_files=("server/models/database.js" "server/models/User.js" "server/models/Thought.js" "server/models/Goal.js")
    
    for model in "${model_files[@]}"; do
        if [[ -f "$model" ]]; then
            print_status "SUCCESS" "$model exists"
        else
            print_status "ERROR" "$model not found"
        fi
    done
}

# Function to validate server configuration
validate_server() {
    print_status "INFO" "=== Server Configuration Validation ==="
    
    # Check main server file
    if [[ -f "server/index.js" ]]; then
        print_status "SUCCESS" "server/index.js exists"
        
        # Basic syntax check
        if node -c server/index.js 2>/dev/null; then
            print_status "SUCCESS" "server/index.js has valid syntax"
        else
            print_status "ERROR" "server/index.js has syntax errors"
        fi
    else
        print_status "ERROR" "server/index.js not found"
    fi
    
    # Check route files
    local route_files=("server/routes/auth.js" "server/routes/thoughts.js" "server/routes/goals.js" "server/routes/ai.js")
    
    for route in "${route_files[@]}"; do
        if [[ -f "$route" ]]; then
            print_status "SUCCESS" "$route exists"
            
            # Basic syntax check
            if node -c "$route" 2>/dev/null; then
                print_status "SUCCESS" "$route has valid syntax"
            else
                print_status "ERROR" "$route has syntax errors"
            fi
        else
            print_status "ERROR" "$route not found"
        fi
    done
    
    # Check middleware
    if [[ -f "server/middleware/auth.js" ]]; then
        print_status "SUCCESS" "Authentication middleware exists"
    else
        print_status "ERROR" "Authentication middleware not found"
    fi
}

# Function to validate frontend configuration
validate_frontend() {
    print_status "INFO" "=== Frontend Configuration Validation ==="
    
    # Check package.json
    if [[ -f "package.json" ]]; then
        print_status "SUCCESS" "package.json exists"
        
        # Check if it's valid JSON
        if node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))" 2>/dev/null; then
            print_status "SUCCESS" "package.json is valid JSON"
        else
            print_status "ERROR" "package.json is invalid JSON"
        fi
    else
        print_status "ERROR" "package.json not found"
    fi
    
    # Check Vite configuration
    if [[ -f "vite.config.js" ]]; then
        print_status "SUCCESS" "vite.config.js exists"
    else
        print_status "WARNING" "vite.config.js not found"
    fi
    
    # Check main frontend files
    local frontend_files=("src/main.jsx" "src/App.jsx" "index.html")
    
    for file in "${frontend_files[@]}"; do
        if [[ -f "$file" ]]; then
            print_status "SUCCESS" "$file exists"
        else
            print_status "ERROR" "$file not found"
        fi
    done
    
    # Check if dist directory exists (build output)
    if [[ -d "dist" ]]; then
        print_status "SUCCESS" "dist directory exists (built)"
    else
        print_status "WARNING" "dist directory not found (run npm run build)"
    fi
}

# Function to test OpenAI connectivity
test_openai_connection() {
    print_status "INFO" "=== OpenAI API Connection Test ==="
    
    if [[ -z "$OPENAI_API_KEY" ]]; then
        print_status "ERROR" "Cannot test OpenAI connection - API key not set"
        return 1
    fi
    
    # Create a simple test script
    cat > /tmp/openai_test.js << 'EOF'
const OpenAI = require('openai');
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function testConnection() {
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Hello, this is a test.' }],
      max_tokens: 5
    });
    console.log('SUCCESS');
  } catch (error) {
    console.log('ERROR:', error.message);
    process.exit(1);
  }
}

testConnection();
EOF
    
    # Run the test (with timeout)
    if timeout 30s node /tmp/openai_test.js 2>/dev/null | grep -q "SUCCESS"; then
        print_status "SUCCESS" "OpenAI API connection test passed"
    else
        print_status "ERROR" "OpenAI API connection test failed"
    fi
    
    # Clean up
    rm -f /tmp/openai_test.js
}

# Function to check port availability
check_port_availability() {
    print_status "INFO" "=== Port Availability Check ==="
    
    local ports=(3001 5173)
    
    for port in "${ports[@]}"; do
        if command_exists lsof; then
            if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
                PROCESS=$(lsof -Pi :$port -sTCP:LISTEN | tail -n +2 | awk '{print $1}' | head -1)
                print_status "WARNING" "Port $port is already in use by $PROCESS"
            else
                print_status "SUCCESS" "Port $port is available"
            fi
        elif command_exists netstat; then
            if netstat -an | grep -q ":$port.*LISTEN"; then
                print_status "WARNING" "Port $port appears to be in use"
            else
                print_status "SUCCESS" "Port $port appears to be available"
            fi
        else
            print_status "WARNING" "Cannot check port $port availability (lsof/netstat not available)"
        fi
    done
}

# Function to validate file structure
validate_file_structure() {
    print_status "INFO" "=== File Structure Validation ==="
    
    local required_dirs=("src" "server" "server/models" "server/routes" "server/middleware")
    
    for dir in "${required_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            print_status "SUCCESS" "Directory $dir exists"
        else
            print_status "ERROR" "Directory $dir not found"
        fi
    done
    
    # Check critical files
    local critical_files=(
        "package.json"
        "server/index.js"
        "src/main.jsx"
        "src/App.jsx"
        "src/api/client.js"
        "src/utils/audioRecorder.js"
    )
    
    for file in "${critical_files[@]}"; do
        if [[ -f "$file" ]]; then
            print_status "SUCCESS" "File $file exists"
        else
            print_status "ERROR" "File $file not found"
        fi
    done
}

# Function to check security configurations
validate_security() {
    print_status "INFO" "=== Security Configuration Validation ==="
    
    # Check .env permissions
    if [[ -f ".env" ]]; then
        check_file_permissions ".env" "600"
    fi
    
    # Check for common security issues
    if [[ -f ".env" ]] && grep -q "password.*123" .env; then
        print_status "WARNING" ".env contains weak passwords"
    fi
    
    # Check if sensitive files are in .gitignore
    if [[ -f ".gitignore" ]]; then
        print_status "SUCCESS" ".gitignore exists"
        
        if grep -q ".env" .gitignore; then
            print_status "SUCCESS" ".env is in .gitignore"
        else
            print_status "ERROR" ".env should be in .gitignore"
        fi
        
        if grep -q "node_modules" .gitignore; then
            print_status "SUCCESS" "node_modules is in .gitignore"
        else
            print_status "WARNING" "node_modules should be in .gitignore"
        fi
    else
        print_status "WARNING" ".gitignore not found"
    fi
}

# Main function
main() {
    echo -e "${BLUE}🔍 OMI App Environment Validation${NC}"
    echo -e "${BLUE}===================================${NC}"
    echo ""
    
    # Load environment variables if .env exists
    if [[ -f ".env" ]]; then
        set -a  # Mark variables for export
        source .env
        set +a  # Unmark variables for export
    fi
    
    # Run all validations
    validate_env_vars
    echo ""
    validate_nodejs
    echo ""
    validate_database
    echo ""
    validate_server
    echo ""
    validate_frontend
    echo ""
    validate_file_structure
    echo ""
    validate_security
    echo ""
    check_port_availability
    echo ""
    test_openai_connection
    echo ""
    
    # Summary
    echo -e "${BLUE}=== Validation Summary ===${NC}"
    print_status "INFO" "Checks passed: $CHECKS_PASSED"
    print_status "INFO" "Warnings: $WARNINGS"
    print_status "INFO" "Checks failed: $CHECKS_FAILED"
    echo ""
    
    if [[ $CHECKS_FAILED -eq 0 ]]; then
        print_status "SUCCESS" "🎉 Environment validation completed successfully!"
        if [[ $WARNINGS -gt 0 ]]; then
            print_status "WARNING" "Please review the warnings above"
        fi
        exit 0
    else
        print_status "ERROR" "❌ Environment validation failed with $CHECKS_FAILED errors"
        print_status "INFO" "Please fix the errors above before proceeding"
        exit 1
    fi
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi