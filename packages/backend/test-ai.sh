#!/bin/bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzMDY5MjNjYS04OGVkLTQ0MTctYTQxZC1jOWI0ZWJmZGVmMDgiLCJvcmdhbml6YXRpb25JZCI6ImZlNTlmMmIwLTkzZDAtNDE5My05YmFiLWFlZTc3OGMxYTQ0OSIsImVtYWlsIjoib3duZXJAZGVtby5jb20iLCJyb2xlIjoiT1dORVIiLCJpYXQiOjE3NjU4Nzk5MzYsImV4cCI6MTc2NTg4MDgzNiwiYXVkIjoiY3JtLWd0ZC1hcHAiLCJpc3MiOiJjcm0tZ3RkLXNhYXMifQ.lhHnxZNsjMpWWfxvuwseq1bcw9-1muWQOeI1tQamCWs"

echo "=== Testing flow/suggest with AI ==="
curl -s "http://localhost:3003/api/v1/flow/suggest/18aac342-2507-43af-9d14-5d8210ff44cb?refresh=true" \
  -H "Authorization: Bearer $TOKEN"
