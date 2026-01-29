#!/bin/bash

# ============================================================================
# Gaming Network Command Center - Setup Script
# ============================================================================

set -e  # Exit on error

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  🎮 GAMING NETWORK COMMAND CENTER - SETUP v2.0 🎮        ║"
echo "║  ✅ Automatische Installation und Konfiguration          ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

# ============================================================================
# Step 1: Check prerequisites
# ============================================================================

print_step "Step 1: Checking prerequisites..."

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_success "Node.js found: $NODE_VERSION"
else
    print_error "Node.js not found!"
    echo "Please install Node.js first:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    echo "  sudo apt-get install -y nodejs"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    print_success "npm found: $NPM_VERSION"
else
    print_error "npm not found!"
    exit 1
fi

# Check if ntopng is running
if systemctl is-active --quiet ntopng 2>/dev/null; then
    print_success "ntopng is running"
else
    print_warning "ntopng is not running or not found"
    echo "Would you like to check ntopng status? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        systemctl status ntopng || true
    fi
    echo ""
fi

echo ""

# ============================================================================
# Step 2: Install npm dependencies
# ============================================================================

print_step "Step 2: Installing npm dependencies..."

if [ -f "package.json" ]; then
    print_info "Installing from existing package.json..."
    npm install
    print_success "Dependencies installed"
else
    print_info "Creating new project and installing dependencies..."
    
    # Create package.json if it doesn't exist
    cat > package.json << 'EOF'
{
  "name": "gaming-network-command-center",
  "version": "2.0.0",
  "description": "Gaming Network Command Center - Real-time network monitoring dashboard powered by ntop",
  "main": "gaming_server_live_v2.js",
  "scripts": {
    "start": "node gaming_server_live_v2.js",
    "diagnostic": "node ntop_diagnostic_v2.js",
    "dev": "nodemon gaming_server_live_v2.js"
  },
  "keywords": ["ntop", "network", "monitoring", "dashboard", "gaming"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
EOF
    
    npm install
    print_success "Dependencies installed"
fi

echo ""

# ============================================================================
# Step 3: Configure .env file
# ============================================================================

print_step "Step 3: Configuring .env file..."

if [ -f ".env" ]; then
    print_warning ".env file already exists"
    echo "Would you like to reconfigure it? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        print_info "Keeping existing .env configuration"
        echo ""
    else
        rm .env
    fi
fi

if [ ! -f ".env" ]; then
    echo ""
    print_info "Let's configure your ntop connection..."
    echo ""
    
    # NTOP_HOST
    echo "Enter ntop host/IP address [192.168.1.50]:"
    read -r NTOP_HOST
    NTOP_HOST=${NTOP_HOST:-192.168.1.50}
    
    # NTOP_PORT
    echo "Enter ntop port [3000]:"
    read -r NTOP_PORT
    NTOP_PORT=${NTOP_PORT:-3000}
    
    # NTOP_PROTOCOL
    echo "Enter protocol (http/https) [http]:"
    read -r NTOP_PROTOCOL
    NTOP_PROTOCOL=${NTOP_PROTOCOL:-http}
    
    # NTOP_USER
    echo "Enter ntop username [admin]:"
    read -r NTOP_USER
    NTOP_USER=${NTOP_USER:-admin}
    
    # NTOP_PASS
    echo "Enter ntop password [admin]:"
    read -rs NTOP_PASS
    NTOP_PASS=${NTOP_PASS:-admin}
    echo ""
    
    # NTOP_INTERFACE
    echo "Enter ntop interface ID [1]:"
    read -r NTOP_INTERFACE
    NTOP_INTERFACE=${NTOP_INTERFACE:-1}
    
    # Create .env file
    cat > .env << EOF
# Gaming Network Command Center Configuration
# Generated on $(date)

# ntop Connection
NTOP_HOST=$NTOP_HOST
NTOP_PORT=$NTOP_PORT
NTOP_PROTOCOL=$NTOP_PROTOCOL

# ntop Credentials
NTOP_USER=$NTOP_USER
NTOP_PASS=$NTOP_PASS

# ntop Interface
NTOP_INTERFACE=$NTOP_INTERFACE

# Advanced Settings
NTOP_TIMEOUT=10000
NTOP_REJECT_UNAUTHORIZED=false

# Server Settings
PORT=3001
EOF
    
    print_success ".env file created"
fi

echo ""

# ============================================================================
# Step 4: Test ntop connection
# ============================================================================

print_step "Step 4: Testing ntop connection..."
echo ""

if [ -f "ntop_diagnostic_v2.js" ]; then
    node ntop_diagnostic_v2.js
else
    print_warning "Diagnostic tool not found, skipping connection test"
fi

echo ""

# ============================================================================
# Step 5: Summary and next steps
# ============================================================================

print_success "Setup complete!"
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  🎉 INSTALLATION SUCCESSFUL!                             ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

print_info "Next steps:"
echo ""
echo "1️⃣  Start the server:"
echo "   ${CYAN}npm start${NC}"
echo "   # or"
echo "   ${CYAN}node gaming_server_live_v2.js${NC}"
echo ""

echo "2️⃣  Open the dashboard:"
echo "   ${CYAN}http://localhost:3001/gaming_dashboard_live.html${NC}"
echo ""

echo "3️⃣  Alternative: Run diagnostic tool:"
echo "   ${CYAN}npm run diagnostic${NC}"
echo "   # or"
echo "   ${CYAN}node ntop_diagnostic_v2.js${NC}"
echo ""

print_info "Configuration:"
echo "   ntop URL: $NTOP_PROTOCOL://$NTOP_HOST:$NTOP_PORT"
echo "   Interface ID: $NTOP_INTERFACE"
echo "   Server Port: 3001"
echo ""

print_info "Troubleshooting:"
echo "   - Check logs: ${CYAN}journalctl -u ntopng -f${NC}"
echo "   - Check ntop status: ${CYAN}systemctl status ntopng${NC}"
echo "   - Run diagnostic: ${CYAN}npm run diagnostic${NC}"
echo "   - View .env: ${CYAN}cat .env${NC}"
echo ""

echo "Happy monitoring! 🎮🚀"
echo ""
