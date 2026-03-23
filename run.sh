#!/bin/bash

# Cyber2U - Full Stack Startup Script
# Starts PostgreSQL, MailHog, Backend, and Frontend services via Docker Compose
# Creates a demo user account and displays URLs

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
BACKEND_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:3001"
MAILHOG_URL="http://localhost:8025"
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="cyber2u_db"
DB_USER="cyber2u_user"
DB_PASSWORD="developmentpassword"
DEMO_EMAIL="demo.user@cyber2u.local"

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠  $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker and try again."
        exit 1
    fi
    print_success "Docker found"
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose and try again."
        exit 1
    fi
    print_success "Docker Compose found"
}

# Start Docker Compose services
start_services() {
    print_info "Starting Docker services..."
    cd "$PROJECT_ROOT"
    
    # Build and start all services
    docker-compose up -d
    
    print_info "Waiting for services to be healthy..."
    
    # Wait for PostgreSQL
    local pg_ready=0
    local attempts=0
    while [ $pg_ready -eq 0 ] && [ $attempts -lt 30 ]; do
        if docker exec "$(docker-compose ps -q postgres)" pg_isready -U "$DB_USER" -d "$DB_NAME" &> /dev/null; then
            pg_ready=1
            print_success "PostgreSQL is ready"
        else
            attempts=$((attempts + 1))
            sleep 1
        fi
    done
    
    if [ $pg_ready -eq 0 ]; then
        print_error "PostgreSQL failed to start"
        exit 1
    fi
    
    # Wait for MailHog
    local mailhog_ready=0
    attempts=0
    while [ $mailhog_ready -eq 0 ] && [ $attempts -lt 30 ]; do
        if curl -sf http://localhost:8025 &> /dev/null; then
            mailhog_ready=1
            print_success "MailHog is ready"
        else
            attempts=$((attempts + 1))
            sleep 1
        fi
    done
    
    if [ $mailhog_ready -eq 0 ]; then
        print_error "MailHog failed to start"
        exit 1
    fi
    
    # Wait for Backend to be responsive
    local backend_ready=0
    attempts=0
    while [ $backend_ready -eq 0 ] && [ $attempts -lt 60 ]; do
        if curl -sf "$BACKEND_URL/health" &> /dev/null; then
            backend_ready=1
            print_success "Backend API is ready"
        else
            attempts=$((attempts + 1))
            sleep 1
        fi
    done
    
    if [ $backend_ready -eq 0 ]; then
        print_error "Backend API failed to start"
        print_info "Checking backend logs:"
        docker-compose logs backend
        exit 1
    fi
    
    # Wait for Frontend
    local frontend_ready=0
    attempts=0
    while [ $frontend_ready -eq 0 ] && [ $attempts -lt 60 ]; do
        if curl -sf "$FRONTEND_URL" &> /dev/null; then
            frontend_ready=1
            print_success "Frontend is ready"
        else
            attempts=$((attempts + 1))
            sleep 1
        fi
    done
    
    if [ $frontend_ready -eq 0 ]; then
        print_warning "Frontend is taking longer to start. It may still be building."
    fi
}

# Create demo user via API
create_demo_user() {
    print_info "Creating demo user account..."
    
    local response
    local max_attempts=10
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        response=$(curl -s -X POST "$BACKEND_URL/api/auth/demo-bootstrap" \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"$DEMO_EMAIL\"}" 2>/dev/null || echo "")
        
        if echo "$response" | grep -q "token"; then
            print_success "Demo user created successfully"
            
            # Extract token and userId from response
            local token=$(echo "$response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
            local userId=$(echo "$response" | grep -o '"userId":[0-9]*' | cut -d':' -f2)
            
            echo "$response" > /tmp/cyber2u_demo_response.json
            
            return 0
        fi
        
        attempt=$((attempt + 1))
        sleep 2
    done
    
    print_warning "Demo user creation may not have succeeded. Check logs or create manually."
    return 1
}

# Display startup information
display_info() {
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           Cyber2U Services Started Successfully                 ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${BLUE}📱 Web Application:${NC}"
    echo -e "   URL: ${YELLOW}${FRONTEND_URL}${NC}"
    echo ""
    
    echo -e "${BLUE}📧 Email Inbox (MailHog):${NC}"
    echo -e "   URL: ${YELLOW}${MAILHOG_URL}${NC}"
    echo -e "   SMTP: localhost:1025"
    echo ""
    
    echo -e "${BLUE}🔌 Backend API:${NC}"
    echo -e "   URL: ${YELLOW}${BACKEND_URL}${NC}"
    echo -e "   Health: ${YELLOW}${BACKEND_URL}/health${NC}"
    echo ""
    
    echo -e "${BLUE}🗄️  Database:${NC}"
    echo -e "   Host: ${YELLOW}${DB_HOST}${NC}"
    echo -e "   Port: ${YELLOW}${DB_PORT}${NC}"
    echo -e "   Database: ${YELLOW}${DB_NAME}${NC}"
    echo -e "   User: ${YELLOW}${DB_USER}${NC}"
    echo -e "   Password: ${YELLOW}${DB_PASSWORD}${NC}"
    echo ""
    
    echo -e "${BLUE}👤 Demo User Account:${NC}"
    echo -e "   Email: ${YELLOW}${DEMO_EMAIL}${NC}"
    echo -e "   Password: ${YELLOW}(Magic link - check MailHog)${NC}"
    echo -e "   Status: ${GREEN}Pre-authenticated and ready to use${NC}"
    echo -e "   Access: Open ${FRONTEND_URL} and you'll be logged in"
    echo ""
    
    echo -e "${BLUE}📚 API Documentation:${NC}"
    echo -e "   Demo Bootstrap: POST ${BACKEND_URL}/api/auth/demo-bootstrap"
    echo -e "   Magic Link: POST ${BACKEND_URL}/api/auth/request-magic-link"
    echo -e "   Quiz: GET ${BACKEND_URL}/api/quiz/weekly"
    echo -e "   Progress: GET ${BACKEND_URL}/api/progress"
    echo ""
    
    echo -e "${BLUE}🛑 Stopping Services:${NC}"
    echo -e "   Run: ${YELLOW}docker-compose down${NC}"
    echo -e "   Or: ${YELLOW}docker-compose down -v${NC} (to remove volumes/data)"
    echo ""
    
    echo -e "${BLUE}📋 View Logs:${NC}"
    echo -e "   All: ${YELLOW}docker-compose logs -f${NC}"
    echo -e "   Backend: ${YELLOW}docker-compose logs -f backend${NC}"
    echo -e "   Frontend: ${YELLOW}docker-compose logs -f frontend${NC}"
    echo ""
}

# Main execution
main() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                  Cyber2U Startup Script                         ║${NC}"
    echo -e "${BLUE}║         Starting Frontend, Backend, and Database Services      ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    check_prerequisites
    echo ""
    
    start_services
    echo ""
    
    create_demo_user
    echo ""
    
    display_info
    
    echo -e "${YELLOW}💡 Tip: Keep this terminal open to view service logs${NC}"
    echo -e "${YELLOW}   Press Ctrl+C to stop all services${NC}"
    echo ""
}

# Run main
main

# Keep services running (show logs)
print_info "Showing Docker Compose logs (Press Ctrl+C to stop all services)..."
docker-compose logs -f
