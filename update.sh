#!/bin/bash

# ============================================================================
# Update Script - Gaming Network Command Center v2.0
# ============================================================================

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  🔄 UPDATING Gaming Network Command Center v2.0         ║"
echo "║  ✅ L7 Stats Fix & Improvements                          ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Determine project directory
if [ -d "/opt/ntopDash" ]; then
    PROJECT_DIR="/opt/ntopDash"
elif [ -d "$(pwd)" ] && [ -f "$(pwd)/.env" ]; then
    PROJECT_DIR="$(pwd)"
else
    echo -e "${YELLOW}⚠️  Could not determine project directory${NC}"
    echo "Please run this script from your project directory"
    echo "Or specify: ./update.sh /path/to/project"
    exit 1
fi

echo -e "${CYAN}📁 Project directory: $PROJECT_DIR${NC}"
echo ""

# Stop running server
echo -e "${CYAN}🛑 Stopping old server...${NC}"
pkill -f gaming_server_live_v2.js 2>/dev/null
sleep 2
echo -e "${GREEN}✅ Stopped${NC}"
echo ""

# Backup old files
echo -e "${CYAN}💾 Backing up old files...${NC}"
if [ -f "$PROJECT_DIR/gaming_server_live_v2.js" ]; then
    cp "$PROJECT_DIR/gaming_server_live_v2.js" "$PROJECT_DIR/gaming_server_live_v2.js.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}✅ Backed up gaming_server_live_v2.js${NC}"
fi
echo ""

# Copy new files from outputs
OUTPUTS_DIR="/mnt/user-data/outputs"

if [ ! -d "$OUTPUTS_DIR" ]; then
    echo -e "${YELLOW}⚠️  Outputs directory not found: $OUTPUTS_DIR${NC}"
    echo "Are you running this from the correct location?"
    exit 1
fi

echo -e "${CYAN}📥 Copying updated files...${NC}"

# Copy main server file
if [ -f "$OUTPUTS_DIR/gaming_server_live_v2.js" ]; then
    cp "$OUTPUTS_DIR/gaming_server_live_v2.js" "$PROJECT_DIR/"
    echo -e "${GREEN}✅ Updated gaming_server_live_v2.js${NC}"
else
    echo -e "${YELLOW}⚠️  gaming_server_live_v2.js not found in outputs${NC}"
fi

# Copy dashboard
if [ -f "$OUTPUTS_DIR/gaming_dashboard_live_v2.html" ]; then
    cp "$OUTPUTS_DIR/gaming_dashboard_live_v2.html" "$PROJECT_DIR/"
    echo -e "${GREEN}✅ Updated gaming_dashboard_live_v2.html${NC}"
fi

# Copy diagnostic tools
if [ -f "$OUTPUTS_DIR/ntop_diagnostic_v2.js" ]; then
    cp "$OUTPUTS_DIR/ntop_diagnostic_v2.js" "$PROJECT_DIR/"
    echo -e "${GREEN}✅ Updated ntop_diagnostic_v2.js${NC}"
fi

if [ -f "$OUTPUTS_DIR/quick_test.js" ]; then
    cp "$OUTPUTS_DIR/quick_test.js" "$PROJECT_DIR/"
    chmod +x "$PROJECT_DIR/quick_test.js"
    echo -e "${GREEN}✅ Updated quick_test.js${NC}"
fi

# Copy docs
if [ -f "$OUTPUTS_DIR/FINAL_INSTALLATION_GUIDE.md" ]; then
    cp "$OUTPUTS_DIR/FINAL_INSTALLATION_GUIDE.md" "$PROJECT_DIR/"
fi

if [ -f "$OUTPUTS_DIR/L7_STATS_FIX.md" ]; then
    cp "$OUTPUTS_DIR/L7_STATS_FIX.md" "$PROJECT_DIR/"
fi

echo ""
echo -e "${CYAN}🧪 Testing new version...${NC}"
cd "$PROJECT_DIR"

# Quick test
if [ -f "quick_test.js" ]; then
    node quick_test.js
    TEST_RESULT=$?
    
    if [ $TEST_RESULT -eq 0 ]; then
        echo ""
        echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║  ✅ UPDATE SUCCESSFUL!                ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${CYAN}🚀 Next steps:${NC}"
        echo ""
        echo "1. Start the server:"
        echo -e "   ${GREEN}node gaming_server_live_v2.js${NC}"
        echo ""
        echo "2. Open the dashboard:"
        echo -e "   ${GREEN}http://localhost:3001/gaming_dashboard_live_v2.html${NC}"
        echo ""
        echo -e "${CYAN}📝 What's new:${NC}"
        echo "  ✅ L7 Stats now uses fallback (no more crashes)"
        echo "  ✅ Better error handling"
        echo "  ✅ Improved dashboard compatibility"
        echo "  ✅ More robust API handling"
        echo ""
    else
        echo ""
        echo -e "${YELLOW}⚠️  Tests failed, but update completed${NC}"
        echo "Check the errors above and try running manually:"
        echo -e "   ${GREEN}node gaming_server_live_v2.js${NC}"
        echo ""
    fi
else
    echo ""
    echo -e "${GREEN}✅ Update completed${NC}"
    echo "Start the server with:"
    echo -e "   ${GREEN}node gaming_server_live_v2.js${NC}"
    echo ""
fi
