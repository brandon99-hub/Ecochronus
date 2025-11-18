#!/bin/bash

# Test script for API endpoints
# Usage: bash test-api.sh

BASE_URL="http://localhost:3000"

echo "=== Health Check ==="
curl -X GET "$BASE_URL/health" | jq

echo -e "\n=== Signup ==="
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "testpassword123"
  }')

echo $SIGNUP_RESPONSE | jq

# Extract tokens from signup response (requires jq)
ACCESS_TOKEN=$(echo $SIGNUP_RESPONSE | jq -r '.data.accessToken // empty')
REFRESH_TOKEN=$(echo $SIGNUP_RESPONSE | jq -r '.data.refreshToken // empty')

if [ -z "$ACCESS_TOKEN" ]; then
  echo -e "\n=== Login (if signup failed or user exists) ==="
  LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "testpassword123"
    }')
  
  echo $LOGIN_RESPONSE | jq
  ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken // empty')
  REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.refreshToken // empty')
fi

if [ ! -z "$ACCESS_TOKEN" ]; then
  echo -e "\n=== Get Profile ==="
  curl -s -X GET "$BASE_URL/api/users/profile" \
    -H "Authorization: Bearer $ACCESS_TOKEN" | jq

  echo -e "\n=== List Missions ==="
  curl -s -X GET "$BASE_URL/api/missions" \
    -H "Authorization: Bearer $ACCESS_TOKEN" | jq

  echo -e "\n=== Get Rewards ==="
  curl -s -X GET "$BASE_URL/api/rewards" \
    -H "Authorization: Bearer $ACCESS_TOKEN" | jq
else
  echo "Failed to get access token"
fi

