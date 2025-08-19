#!/bin/bash

# Blockchain Payment Ledger Demo Script
# This script demonstrates all the key features of the blockchain system

echo "🔗 BLOCKCHAIN PAYMENT LEDGER DEMO"
echo "=================================="
echo ""

BASE_URL="http://localhost:8080/api/ledger"

# Function to print section headers
print_header() {
    echo ""
    echo "📌 $1"
    echo "$(printf '%.0s-' {1..50})"
}

# Function to format JSON output
format_json() {
    if command -v jq &> /dev/null; then
        echo "$1" | jq .
    else
        echo "$1"
    fi
}

print_header "1. Initial Blockchain Status"
response=$(curl -s "$BASE_URL/stats")
format_json "$response"

print_header "2. Adding Initial Transactions"
echo "💸 SYSTEM gives Alice 100 coins..."
response=$(curl -s -X POST "$BASE_URL/transaction" -d "sender=SYSTEM&receiver=Alice&amount=100")
format_json "$response"

echo ""
echo "💸 SYSTEM gives Bob 75 coins..."
response=$(curl -s -X POST "$BASE_URL/transaction" -d "sender=SYSTEM&receiver=Bob&amount=75")
format_json "$response"

echo ""
echo "💸 SYSTEM gives Charlie 50 coins..."
response=$(curl -s -X POST "$BASE_URL/transaction" -d "sender=SYSTEM&receiver=Charlie&amount=50")
format_json "$response"

print_header "3. Mining Block #1"
echo "⛏️  Miner1 is mining the block..."
response=$(curl -s -X POST "$BASE_URL/mine?minerAddress=Miner1")
mining_time=$(echo "$response" | jq -r '.miningTime // "N/A"')
block_hash=$(echo "$response" | jq -r '.blockHash // "N/A"')
nonce=$(echo "$response" | jq -r '.nonce // "N/A"')

echo "✅ Block mined successfully!"
echo "   Hash: $block_hash"
echo "   Nonce: $nonce"
echo "   Mining Time: ${mining_time}ms"

print_header "4. Checking Balances After Mining"
response=$(curl -s "$BASE_URL/balances")
format_json "$response"

print_header "5. Creating More Transactions"
echo "💸 Alice sends 30 coins to Bob..."
response=$(curl -s -X POST "$BASE_URL/transaction" -d "sender=Alice&receiver=Bob&amount=30")
format_json "$response"

echo ""
echo "💸 Bob sends 20 coins to Charlie..."
response=$(curl -s -X POST "$BASE_URL/transaction" -d "sender=Bob&receiver=Charlie&amount=20")
format_json "$response"

echo ""
echo "💸 Charlie sends 15 coins to Alice..."
response=$(curl -s -X POST "$BASE_URL/transaction" -d "sender=Charlie&receiver=Alice&amount=15")
format_json "$response"

print_header "6. Mining Block #2"
echo "⛏️  Miner2 is mining the block..."
response=$(curl -s -X POST "$BASE_URL/mine?minerAddress=Miner2")
mining_time=$(echo "$response" | jq -r '.miningTime // "N/A"')
block_hash=$(echo "$response" | jq -r '.blockHash // "N/A"')
nonce=$(echo "$response" | jq -r '.nonce // "N/A"')

echo "✅ Block mined successfully!"
echo "   Hash: $block_hash"
echo "   Nonce: $nonce"
echo "   Mining Time: ${mining_time}ms"

print_header "7. Final Balances"
response=$(curl -s "$BASE_URL/balances")
echo "Final account balances:"
if command -v jq &> /dev/null; then
    echo "$response" | jq -r 'to_entries[] | select(.value > 0 and .key != "SYSTEM") | "   \(.key): \(.value) coins"'
else
    format_json "$response"
fi

print_header "8. Blockchain Validation"
response=$(curl -s "$BASE_URL/validate")
is_valid=$(echo "$response" | jq -r '.valid // false')
message=$(echo "$response" | jq -r '.message // "Unknown"')

if [ "$is_valid" = "true" ]; then
    echo "✅ $message"
else
    echo "❌ $message"
fi

print_header "9. Final Blockchain Statistics"
response=$(curl -s "$BASE_URL/stats")
format_json "$response"

print_header "10. Transaction History Example"
echo "📋 Alice's transaction history:"
response=$(curl -s "$BASE_URL/history/Alice")
if command -v jq &> /dev/null; then
    echo "$response" | jq -r '.[] | "   \(.timestamp[0:19]) | \(.sender) → \(.receiver): \(.amount) coins"'
else
    format_json "$response"
fi

print_header "Demo Complete!"
echo ""
echo "🎉 Blockchain Payment Ledger Demo Completed Successfully!"
echo ""
echo "📊 Summary:"
echo "   • Created multiple transactions"
echo "   • Mined 2 blocks with Proof of Work"
echo "   • Validated blockchain integrity"
echo "   • Demonstrated balance tracking"
echo "   • Showed mining rewards"
echo ""
echo "🌐 Web Interface: http://localhost:8080"
echo "📚 API Docs: See README.md for complete API reference"
echo "" 