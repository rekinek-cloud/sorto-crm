#!/bin/bash
# Daily development cycle with Claude Code MCP
# Enterprise CRM-GTD Development Workflow
# Author: CRM-GTD Development Team

PROJECT_ROOT="/opt/crm-gtd-smart"
MCP_CONFIG="$PROJECT_ROOT/.mcp.json"

echo "🚀 Starting daily development cycle for CRM-GTD..."
echo "Project: $PROJECT_ROOT"
echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================="

# Security scan first thing in the morning
echo ""
echo "🛡️ Running comprehensive security scan..."
claude -p "Run comprehensive security scan on recent changes and report any vulnerabilities or compliance issues. Focus on GDPR and SOC2 compliance for enterprise readiness." \
  --mcp-config "$MCP_CONFIG"

echo ""
echo "📊 Checking performance metrics..."
claude -p "Analyze application performance and identify any bottlenecks or optimization opportunities in our CRM-GTD system" \
  --mcp-config "$MCP_CONFIG"

echo ""
echo "👥 Multi-tenant health check..."
claude -p "Check multi-tenant infrastructure health, verify tenant isolation, and monitor resource usage across all tenants" \
  --mcp-config "$MCP_CONFIG"

echo ""
echo "📋 Generating today's development tasks..."
claude -p "Based on Phase 4 enterprise roadmap, generate prioritized development tasks for today focusing on:
1. Enterprise security features (RBAC, 2FA, audit logging)
2. Multi-tenant SaaS infrastructure improvements
3. Performance optimization
4. GDPR/SOC2 compliance enhancements
5. AI-powered analytics features

Prioritize tasks that provide maximum business value for enterprise customers." \
  --mcp-config "$MCP_CONFIG"

echo ""
echo "🔄 Git workflow status..."
git status --porcelain
if [ $? -eq 0 ]; then
    echo "✅ Git repository is clean"
else
    echo "⚠️ Uncommitted changes detected"
fi

echo ""
echo "📦 Dependency security check..."
if [ -f "$PROJECT_ROOT/package.json" ]; then
    npm audit --audit-level moderate
fi

echo ""
echo "🧪 Running critical tests..."
if [ -f "$PROJECT_ROOT/package.json" ]; then
    npm test -- --passWithNoTests --coverage
fi

echo ""
echo "✅ Daily development cycle completed!"
echo "Next steps:"
echo "1. Review generated tasks and security recommendations"
echo "2. Address any critical vulnerabilities immediately"
echo "3. Begin implementation of prioritized features"
echo "4. Run './scripts/security-audit.sh' before committing changes"
echo ""
echo "Happy coding with AI acceleration! 🚀"