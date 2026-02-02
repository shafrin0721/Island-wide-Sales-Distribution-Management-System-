#!/bin/bash

echo "Starting backend server..."
node server.js &
SERVER_PID=$!
sleep 4

echo ""
echo "=== TEST 1: Registration ==="
REG_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","full_name":"Test User","phone":"+1234567890","role":"customer"}')

echo "Registration Response:"
echo "$REG_RESPONSE" | jq .

TOKEN=$(echo "$REG_RESPONSE" | jq -r '.token')
echo "Token: $TOKEN"

echo ""
echo "=== TEST 2: Change Password ==="
PWD_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"currentPassword":"password123","newPassword":"newpassword456"}')

echo "Change Password Response:"
echo "$PWD_RESPONSE" | jq .

echo ""
echo "Stopping server..."
kill $SERVER_PID
