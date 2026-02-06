#!/bin/bash

echo "Testing Coach Davis signin flow..."
echo ""

# Create a temp file to store cookies
COOKIE_JAR="/tmp/cookies.txt"
> "$COOKIE_JAR"

echo "1. Signing in as coach.davis@gpisd.org..."
SIGNIN_RESPONSE=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X POST http://localhost:3000/api/auth/teacher-signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "coach.davis@gpisd.org",
    "password": "password2"
  }')

echo "Signin response:"
echo "$SIGNIN_RESPONSE" | jq '.' 2>/dev/null || echo "$SIGNIN_RESPONSE"

echo ""
echo "Cookies after signin:"
cat "$COOKIE_JAR"

echo ""
echo "2. Checking session..."
SESSION_RESPONSE=$(curl -s -b "$COOKIE_JAR" \
  http://localhost:3000/api/auth/check-session)

echo "Session response:"
echo "$SESSION_RESPONSE" | jq '.' 2>/dev/null || echo "$SESSION_RESPONSE"
