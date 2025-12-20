#!/bin/bash
# setup-mcp-foundation.sh
# Skrypt do instalacji podstawowych MCP servers dla CRM-GTD
# Autor: CRM-GTD Development Team
# Data: 2025-06-19

set -e  # Exit on any error

echo "🚀 CRM-GTD MCP Foundation Setup"
echo "================================="
echo "Setting up Claude Code MCP servers for enterprise development"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project paths
PROJECT_ROOT="$HOME/crm-gtd"
MCP_SERVERS_DIR="$HOME/crm-gtd-mcp-servers"
MCP_CONFIG_FILE="$PROJECT_ROOT/.mcp.json"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    # Check npm
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    # Check Claude Code
    if ! command_exists claude; then
        print_warning "Claude Code not found. Installing..."
        curl -fsSL https://claude.ai/install.sh | sh
        
        # Add to PATH if needed
        if [[ ":$PATH:" != *":$HOME/.claude/bin:"* ]]; then
            echo 'export PATH="$HOME/.claude/bin:$PATH"' >> ~/.bashrc
            export PATH="$HOME/.claude/bin:$PATH"
        fi
        
        print_success "Claude Code installed successfully"
    else
        print_success "Claude Code is already installed"
    fi
    
    # Check project directory
    if [ ! -d "$PROJECT_ROOT" ]; then
        print_warning "CRM-GTD project directory not found. Creating structure..."
        mkdir -p "$PROJECT_ROOT"/{src,prisma,docs,tests,scripts}
        print_success "Project structure created"
    fi
    
    # Create MCP servers directory
    mkdir -p "$MCP_SERVERS_DIR"
    
    print_success "All prerequisites checked"
}

# Install core MCP servers
install_core_mcp_servers() {
    print_status "Installing core MCP servers..."
    
    # Filesystem server for project access
    print_status "Setting up Filesystem MCP server..."
    claude mcp add filesystem -s user -- npx -y @modelcontextprotocol/server-filesystem \
        "$PROJECT_ROOT/src" \
        "$PROJECT_ROOT/prisma" \
        "$PROJECT_ROOT/docs" \
        "$PROJECT_ROOT/tests" \
        "$PROJECT_ROOT/scripts"
    
    # PostgreSQL server for database operations
    print_status "Setting up PostgreSQL MCP server..."
    claude mcp add postgres -s user -- npx -y @modelcontextprotocol/server-postgres
    
    # GitHub server for repository operations
    print_status "Setting up GitHub MCP server..."
    claude mcp add github -s user -- npx -y @modelcontextprotocol/server-github
    
    # Puppeteer for web automation and testing
    print_status "Setting up Puppeteer MCP server..."
    claude mcp add puppeteer -s user -- npx -y @modelcontextprotocol/server-puppeteer
    
    # Sequential thinking for complex problem solving
    print_status "Setting up Sequential Thinking MCP server..."
    claude mcp add sequential-thinking -s user -- npx -y @modelcontextprotocol/server-sequential-thinking
    
    # Web fetch for external API testing
    print_status "Setting up Web Fetch MCP server..."
    claude mcp add fetch -s user -- npx -y @kazuph/mcp-fetch
    
    print_success "Core MCP servers installed successfully"
}

# Create MCP configuration file
create_mcp_config() {
    print_status "Creating MCP configuration file..."
    
    # Get database URL from environment or use default
    DB_URL="${DATABASE_URL:-postgresql://postgres:password@localhost:5432/crm_gtd}"
    GITHUB_TOKEN="${GITHUB_TOKEN:-your_github_token_here}"
    
    cat > "$MCP_CONFIG_FILE" << EOF
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y", 
        "@modelcontextprotocol/server-filesystem",
        "$PROJECT_ROOT/src",
        "$PROJECT_ROOT/prisma", 
        "$PROJECT_ROOT/docs",
        "$PROJECT_ROOT/tests",
        "$PROJECT_ROOT/scripts"
      ]
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "$DB_URL"
      }
    },
    "github": {
      "command": "npx", 
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "$GITHUB_TOKEN"
      }
    },
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "fetch": {
      "command": "npx", 
      "args": ["-y", "@kazuph/mcp-fetch"]
    }
  }
}
EOF
    
    print_success "MCP configuration file created at $MCP_CONFIG_FILE"
}

# Create environment configuration
create_env_config() {
    print_status "Creating environment configuration..."
    
    # Create .env.example file
    cat > "$PROJECT_ROOT/.env.example" << EOF
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/crm_gtd

# GitHub Integration
GITHUB_TOKEN=your_github_token_here

# MCP Debug Mode
MCP_DEBUG=false

# Claude Code Configuration
CLAUDE_CLI_PATH=~/.claude/local/claude

# Security Configuration
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here

# Multi-tenant Configuration
TENANT_DB_PREFIX=tenant_
DEFAULT_RESOURCE_QUOTA=1000

# Performance Monitoring
PERFORMANCE_MONITORING_ENABLED=true
LOG_LEVEL=info
EOF

    # Create security configuration
    cat > "$PROJECT_ROOT/.security-config.json" << EOF
{
  "scanLevel": "comprehensive",
  "excludePatterns": [
    "node_modules/**",
    "dist/**", 
    "build/**",
    "coverage/**"
  ],
  "securityRules": {
    "sqlInjection": true,
    "xssVulnerabilities": true,
    "csrfProtection": true,
    "sensitiveDataExposure": true,
    "authenticationBypass": true,
    "accessControlFlaws": true
  },
  "complianceChecks": {
    "gdpr": true,
    "soc2": true,
    "hipaa": false
  },
  "severityThresholds": {
    "critical": 0,
    "high": 2,
    "medium": 5,
    "low": 10
  }
}
EOF
    
    print_success "Environment configuration files created"
}

# Verify installation
verify_installation() {
    print_status "Verifying MCP installation..."
    
    # List installed MCP servers
    echo ""
    print_status "Installed MCP servers:"
    claude mcp list
    
    # Test MCP configuration
    print_status "Testing MCP configuration..."
    if claude -p "Hello, this is a test to verify MCP servers are working correctly" --mcp-config "$MCP_CONFIG_FILE" > /dev/null 2>&1; then
        print_success "MCP configuration test passed"
    else
        print_warning "MCP configuration test failed - check your setup"
    fi
    
    # Check file permissions
    if [ -r "$MCP_CONFIG_FILE" ]; then
        print_success "MCP configuration file is readable"
    else
        print_error "MCP configuration file is not readable"
    fi
    
    print_success "Installation verification completed"
}

# Create helpful scripts
create_helper_scripts() {
    print_status "Creating helper scripts..."
    
    # Create daily development cycle script
    cat > "$PROJECT_ROOT/scripts/daily-dev-cycle.sh" << 'EOF'
#!/bin/bash
# Daily development cycle with Claude Code MCP

PROJECT_ROOT="$(dirname "$(dirname "$(readlink -f "$0")")")"
MCP_CONFIG="$PROJECT_ROOT/.mcp.json"

echo "🚀 Starting daily development cycle..."

# Security scan
echo "🛡️ Running security scan..."
claude -p "Run comprehensive security scan on recent changes and report any vulnerabilities or compliance issues" \
  --mcp-config "$MCP_CONFIG" \
  --output-format stream-json

# Performance check
echo "📊 Checking performance metrics..."
claude -p "Analyze application performance and identify any bottlenecks or optimization opportunities" \
  --mcp-config "$MCP_CONFIG"

# Generate daily tasks
echo "📋 Generating today's development tasks..."
claude -p "Based on Phase 4 roadmap, generate prioritized development tasks for today focusing on enterprise security and multi-tenant features" \
  --mcp-config "$MCP_CONFIG"

echo "✅ Daily development cycle completed!"
EOF

    # Create security audit script
    cat > "$PROJECT_ROOT/scripts/security-audit.sh" << 'EOF'
#!/bin/bash
# Comprehensive security audit with Claude Code MCP

PROJECT_ROOT="$(dirname "$(dirname "$(readlink -f "$0")")")"
MCP_CONFIG="$PROJECT_ROOT/.mcp.json"

echo "🔒 Starting comprehensive security audit..."

# GDPR compliance check
claude -p "Perform GDPR compliance audit on the entire codebase, check for data protection, privacy controls, and right to be forgotten implementation" \
  --mcp-config "$MCP_CONFIG"

# SOC2 compliance check  
claude -p "Audit code for SOC2 Type II compliance including access controls, system operations, and security monitoring" \
  --mcp-config "$MCP_CONFIG"

# Vulnerability assessment
claude -p "Conduct thorough vulnerability assessment including SQL injection, XSS, CSRF, authentication bypass, and privilege escalation" \
  --mcp-config "$MCP_CONFIG"

echo "✅ Security audit completed!"
EOF

    # Create tenant management script
    cat > "$PROJECT_ROOT/scripts/tenant-ops.sh" << 'EOF'
#!/bin/bash
# Tenant operations with Claude Code MCP

PROJECT_ROOT="$(dirname "$(dirname "$(readlink -f "$0")")")"
MCP_CONFIG="$PROJECT_ROOT/.mcp.json"

OPERATION="$1"
TENANT_ID="$2"

case "$OPERATION" in
    "create")
        echo "🏢 Creating new tenant..."
        claude -p "Create new tenant with full isolation, resource quotas, and billing setup. Tenant name: $TENANT_ID" \
          --mcp-config "$MCP_CONFIG"
        ;;
    "monitor")
        echo "📊 Monitoring tenant resources..."
        claude -p "Monitor resource usage, performance metrics, and quota status for tenant: $TENANT_ID" \
          --mcp-config "$MCP_CONFIG"
        ;;
    "isolate")
        echo "🔒 Checking tenant isolation..."
        claude -p "Verify complete data isolation and check for any cross-tenant data leaks for tenant: $TENANT_ID" \
          --mcp-config "$MCP_CONFIG"
        ;;
    *)
        echo "Usage: $0 {create|monitor|isolate} <tenant_id>"
        exit 1
        ;;
esac
EOF

    # Make scripts executable
    chmod +x "$PROJECT_ROOT/scripts/"*.sh
    
    print_success "Helper scripts created and made executable"
}

# Main installation process
main() {
    echo ""
    print_status "Starting CRM-GTD MCP Foundation Setup..."
    echo ""
    
    check_prerequisites
    echo ""
    
    install_core_mcp_servers
    echo ""
    
    create_mcp_config
    echo ""
    
    create_env_config
    echo ""
    
    create_helper_scripts
    echo ""
    
    verify_installation
    echo ""
    
    print_success "🎉 MCP Foundation Setup Complete!"
    echo ""
    echo "Next steps:"
    echo "1. Update GITHUB_TOKEN in $MCP_CONFIG_FILE"
    echo "2. Configure DATABASE_URL in .env file"
    echo "3. Run: cd $PROJECT_ROOT && ./scripts/daily-dev-cycle.sh"
    echo "4. Start developing with Claude Code: claude --mcp-config $MCP_CONFIG_FILE"
    echo ""
    echo "For security audit: ./scripts/security-audit.sh"
    echo "For tenant operations: ./scripts/tenant-ops.sh create|monitor|isolate <tenant_id>"
    echo ""
    print_success "Happy coding with AI acceleration! 🚀"
}

# Run main function
main "$@"