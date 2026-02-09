#!/bin/bash
# Firebase Hosting Deployment Script for ISDN System
# This script automates the deployment process

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 ISDN System - Firebase Hosting Deployment${NC}"
echo "=================================================="

# Check if Firebase CLI is installed
echo -e "\n${YELLOW}Step 1: Checking Firebase CLI...${NC}"
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}✗ Firebase CLI not found${NC}"
    echo -e "${YELLOW}Install with: npm install -g firebase-tools${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Firebase CLI found${NC}"
firebase --version

# Check if logged in
echo -e "\n${YELLOW}Step 2: Checking Firebase login...${NC}"
if ! firebase projects:list &> /dev/null; then
    echo -e "${RED}✗ Not logged in to Firebase${NC}"
    echo -e "${YELLOW}Running: firebase login${NC}"
    firebase login
fi
echo -e "${GREEN}✓ Logged in to Firebase${NC}"

# Verify project
echo -e "\n${YELLOW}Step 3: Verifying Firebase project...${NC}"
PROJECT=$(firebase use 2>/dev/null || echo "default")
if [ "$PROJECT" = "isdn-6291c" ]; then
    echo -e "${GREEN}✓ Project: isdn-6291c${NC}"
else
    echo -e "${YELLOW}Setting project to isdn-6291c...${NC}"
    firebase use isdn-6291c
fi

# Check configuration files
echo -e "\n${YELLOW}Step 4: Checking configuration files...${NC}"
if [ -f "firebase.json" ]; then
    echo -e "${GREEN}✓ firebase.json found${NC}"
else
    echo -e "${RED}✗ firebase.json not found${NC}"
    exit 1
fi

if [ -f ".firebaseignore" ]; then
    echo -e "${GREEN}✓ .firebaseignore found${NC}"
else
    echo -e "${RED}✗ .firebaseignore not found${NC}"
    exit 1
fi

# Clean up test files
echo -e "\n${YELLOW}Step 5: Cleaning up test files...${NC}"
rm -f test-*.html 2>/dev/null
echo -e "${GREEN}✓ Test files removed${NC}"

# Preview before deployment
echo -e "\n${YELLOW}Step 6: Preview before deployment...${NC}"
echo -e "Files to be deployed:"
find . -type f \
    ! -path "./node_modules/*" \
    ! -path "./.git/*" \
    ! -path "./backend/*" \
    ! -name ".*" \
    ! -name "*.md" \
    ! -name "test-*.html" \
    -newer firebase.json 2>/dev/null | head -20
echo -e "${YELLOW}... and more files${NC}"

# Deploy
echo -e "\n${YELLOW}Step 7: Deploying to Firebase Hosting...${NC}"
echo -e "${YELLOW}This may take a few minutes...${NC}"
firebase deploy --only hosting

# Check deployment status
echo -e "\n${YELLOW}Step 8: Verifying deployment...${NC}"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Deployment successful!${NC}"
    echo -e "\n${GREEN}Your ISDN system is now live:${NC}"
    echo -e "${GREEN}📍 https://isdn-6291c.web.app${NC}"
    echo -e "${GREEN}📍 https://isdn-6291c.firebaseapp.com${NC}"
    echo -e "\n${GREEN}View your Firebase Console:${NC}"
    echo -e "${GREEN}📊 https://console.firebase.google.com/project/isdn-6291c${NC}"
else
    echo -e "${RED}✗ Deployment failed${NC}"
    exit 1
fi

echo -e "\n${GREEN}Deployment complete! 🎉${NC}"
