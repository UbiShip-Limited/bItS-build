#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# URLs
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:3001"

# Test data
TATTOO_REQUEST_DATA='{
  "contactEmail": "test@example.com",
  "contactPhone": "+1234567890",
  "description": "Test tattoo request for endpoint testing. This is a detailed description that meets the minimum requirements.",
  "placement": "arm",
  "size": "medium",
  "colorPreference": "black and grey",
  "style": "traditional",
  "purpose": "personal",
  "preferredArtist": "any",
  "timeframe": "1-2 months",
  "contactPreference": "email",
  "additionalNotes": "This is a test request for endpoint validation."
}'

APPOINTMENT_DATA='{
  "contactEmail": "appointment@example.com",
  "contactPhone": "+1234567890",
  "startAt": "'$(date -d '+7 days' -Iseconds)'",
  "duration": 120,
  "bookingType": "consultation",
  "note": "Test appointment booking",
  "isAnonymous": true
}'

function log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

function log_error() {
    echo -e "${RED}❌ $1${NC}"
}

function log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

function log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

function log_header() {
    echo -e "\n${BOLD}$1${NC}"
    echo "====================================="
}

function test_endpoint() {
    local method=$1
    local url=$2
    local data=$3
    local expected_status=$4
    local description=$5
    
    echo -e "\n${BLUE}Testing: $description${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$url" \
            -H "Content-Type: application/json")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "$method" "$url" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ "$http_code" -eq "$expected_status" ]; then
        log_success "$method $url - Status: $http_code"
        if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
            echo "$body" | jq . 2>/dev/null || echo "$body"
        fi
    else
        log_error "$method $url - Expected: $expected_status, Got: $http_code"
        echo "Response: $body"
    fi
    
    return $http_code
}

function check_server_status() {
    log_header "🔍 Checking Server Status"
    
    # Check frontend server
    if curl -s "$FRONTEND_URL/api/upload" > /dev/null; then
        log_success "Frontend server (Next.js) is running on port 3000"
    else
        log_error "Frontend server is not running on port 3000"
        return 1
    fi
    
    # Check backend server
    if curl -s "$BACKEND_URL/users" > /dev/null; then
        log_success "Backend server (Fastify) is running on port 3001"
    else
        log_error "Backend server is not running on port 3001"
        return 1
    fi
    
    return 0
}

function test_tattoo_requests() {
    log_header "🧪 Testing Tattoo Request Endpoints"
    
    # Test CREATE tattoo request (should work - public endpoint)
    test_endpoint "POST" "$FRONTEND_URL/api/tattoo-requests" "$TATTOO_REQUEST_DATA" 200 "Create tattoo request"
    
    # Test GET all tattoo requests (should require auth - expect 401)
    test_endpoint "GET" "$FRONTEND_URL/api/tattoo-requests" "" 401 "Get all tattoo requests (should require auth)"
    
    # Test GET specific tattoo request (should require auth - expect 401)
    test_endpoint "GET" "$FRONTEND_URL/api/tattoo-requests/test-id" "" 401 "Get tattoo request by ID (should require auth)"
    
    # Test UPDATE status (should require auth - expect 401)
    test_endpoint "PUT" "$FRONTEND_URL/api/tattoo-requests/test-id/status" '{"status": "reviewed"}' 401 "Update tattoo request status (should require auth)"
}

function test_appointments() {
    log_header "📅 Testing Appointment Endpoints"
    
    # Test CREATE appointment (anonymous - should work)
    test_endpoint "POST" "$FRONTEND_URL/api/appointments" "$APPOINTMENT_DATA" 200 "Create anonymous appointment"
    
    # Test GET all appointments (should require auth - expect 401)
    test_endpoint "GET" "$FRONTEND_URL/api/appointments" "" 401 "Get all appointments (should require auth)"
    
    # Test GET specific appointment (should require auth - expect 401)
    test_endpoint "GET" "$FRONTEND_URL/api/appointments/test-id" "" 401 "Get appointment by ID (should require auth)"
}

function test_direct_backend() {
    log_header "🔗 Testing Direct Backend Connection"
    
    # Test direct backend tattoo-requests endpoint
    test_endpoint "POST" "$BACKEND_URL/tattoo-requests" "$TATTOO_REQUEST_DATA" 200 "Direct backend tattoo request"
}

function test_existing_endpoints() {
    log_header "🔄 Testing Existing Endpoints"
    
    # Test various existing endpoints
    test_endpoint "GET" "$FRONTEND_URL/api/payments" "" 404 "Payments endpoint"
    test_endpoint "GET" "$FRONTEND_URL/api/webhooks" "" 404 "Webhooks endpoint"
    test_endpoint "GET" "$FRONTEND_URL/api/images" "" 404 "Images endpoint"
}

function main() {
    echo -e "${BOLD}🚀 Starting Endpoint Tests...${NC}"
    
    # Check if servers are running
    if ! check_server_status; then
        log_error "Servers are not running. Please start them first:"
        echo -e "${YELLOW}Frontend: npm run dev${NC}"
        echo -e "${YELLOW}Backend:  npm run dev:server${NC}"
        exit 1
    fi
    
    # Run tests
    test_direct_backend
    test_tattoo_requests
    test_appointments
    test_existing_endpoints
    
    log_header "📊 Test Summary"
    log_info "All endpoint tests completed!"
    log_info "Check the output above for detailed results."
    echo -e "\n${BOLD}✨ Testing complete!${NC}"
}

# Check if jq is installed (for pretty JSON output)
if ! command -v jq &> /dev/null; then
    log_warning "jq is not installed. JSON responses will not be pretty-printed."
fi

# Run the tests
main 