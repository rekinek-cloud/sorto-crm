#!/bin/bash

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzMDY5MjNjYS04OGVkLTQ0MTctYTQxZC1jOWI0ZWJmZGVmMDgiLCJvcmdhbml6YXRpb25JZCI6ImZlNTlmMmIwLTkzZDAtNDE5My05YmFiLWFlZTc3OGMxYTQ0OSIsImVtYWlsIjoib3duZXJAZGVtby5jb20iLCJyb2xlIjoiT1dORVIiLCJpYXQiOjE3NjU3Mzk2ODQsImV4cCI6MTc2NTc0MDU4NCwiYXVkIjoiY3JtLWd0ZC1hcHAiLCJpc3MiOiJjcm0tZ3RkLXNhYXMifQ.nGTP9iTgFzwBIveIfPfLG4qvdLuBRT_nzYfriM3pdF8"

echo "===== TESTY FLOW API ====="
echo ""

echo "1. /flow/streams:"
curl -s "http://localhost:3003/api/v1/flow/streams" -H "Authorization: Bearer $TOKEN" | jq '.success, (.data | length)'
echo ""

echo "2. /flow/actions:"
curl -s "http://localhost:3003/api/v1/flow/actions" -H "Authorization: Bearer $TOKEN" | jq '.success, (.data | length)'
echo ""

echo "3. /flow/pending:"
curl -s "http://localhost:3003/api/v1/flow/pending?limit=1" -H "Authorization: Bearer $TOKEN" | jq '.success, .pagination.total'
echo ""

echo "4. /flow/stats:"
curl -s "http://localhost:3003/api/v1/flow/stats" -H "Authorization: Bearer $TOKEN" | jq '.success, .data.byStatus.PENDING'
echo ""

echo "5. /flow/rules:"
curl -s "http://localhost:3003/api/v1/flow/rules" -H "Authorization: Bearer $TOKEN" | jq '.success, (.data | length)'
echo ""

echo "6. /flow/patterns:"
curl -s "http://localhost:3003/api/v1/flow/patterns" -H "Authorization: Bearer $TOKEN" | jq '.success, (.data | length)'
echo ""

echo "7. /flow/history:"
curl -s "http://localhost:3003/api/v1/flow/history?limit=2" -H "Authorization: Bearer $TOKEN" | jq '.success, .statistics.totalProcessed'
echo ""

echo "8. /flow/awaiting:"
curl -s "http://localhost:3003/api/v1/flow/awaiting" -H "Authorization: Bearer $TOKEN" | jq '.success, (.data | length)'
