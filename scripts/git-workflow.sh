#!/bin/bash

# CRM-GTD Smart Git Workflow Helper
# Usage: ./scripts/git-workflow.sh [command] [options]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

function show_help() {
    echo "CRM-GTD Smart Git Workflow Helper"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  status           Show status of all branches"
    echo "  switch-v1        Switch to V1 development"
    echo "  switch-v2        Switch to V2 development"
    echo "  switch-prod      Switch to production V1"
    echo "  new-feature      Create new feature branch"
    echo "  new-hotfix       Create new hotfix branch"
    echo "  merge-v1         Merge develop-v1 to production-v1"
    echo "  deploy-v1        Deploy V1 to production"
    echo "  deploy-v2        Deploy V2 to development"
    echo "  list-branches    List all branches"
    echo ""
    echo "Examples:"
    echo "  $0 new-feature v1 user-management"
    echo "  $0 new-feature v2 new-dashboard"
    echo "  $0 new-hotfix critical-login-bug"
}

function show_status() {
    echo "=== Git Workflow Status ==="
    echo ""
    echo "Current branch: $(git branch --show-current)"
    echo ""
    echo "Branch status:"
    echo "📦 production-v1:  $(git log production-v1 --oneline -1)"
    echo "🔧 develop-v1:     $(git log develop-v1 --oneline -1)"
    echo "🚀 develop-v2:     $(git log develop-v2 --oneline -1)"
    echo "📌 master:         $(git log master --oneline -1)"
    echo ""
    echo "Uncommitted changes:"
    if [[ -n $(git status --porcelain) ]]; then
        git status --short
    else
        echo "✅ Working directory clean"
    fi
}

function switch_branch() {
    local target_branch=$1
    echo "Switching to $target_branch..."
    
    # Check for uncommitted changes
    if [[ -n $(git status --porcelain) ]]; then
        echo "⚠️  You have uncommitted changes. Please commit or stash them first."
        git status --short
        exit 1
    fi
    
    git checkout "$target_branch"
    echo "✅ Switched to $target_branch"
}

function new_feature() {
    local version=$1
    local feature_name=$2
    
    if [[ -z "$version" ]] || [[ -z "$feature_name" ]]; then
        echo "Usage: $0 new-feature [v1|v2] <feature-name>"
        exit 1
    fi
    
    local base_branch="develop-$version"
    local feature_branch="feature/$version-$feature_name"
    
    echo "Creating new feature branch: $feature_branch"
    echo "Base branch: $base_branch"
    
    git checkout "$base_branch"
    git pull origin "$base_branch" 2>/dev/null || echo "Note: No remote tracking"
    git checkout -b "$feature_branch"
    
    echo "✅ Created and switched to $feature_branch"
    echo "💡 Start developing your feature!"
    echo "💡 When done, merge back to $base_branch"
}

function new_hotfix() {
    local hotfix_name=$1
    
    if [[ -z "$hotfix_name" ]]; then
        echo "Usage: $0 new-hotfix <hotfix-name>"
        exit 1
    fi
    
    local hotfix_branch="hotfix/$hotfix_name"
    
    echo "Creating new hotfix branch: $hotfix_branch"
    echo "Base branch: production-v1"
    
    git checkout production-v1
    git checkout -b "$hotfix_branch"
    
    echo "✅ Created and switched to $hotfix_branch"
    echo "🚨 Fix the critical issue!"
    echo "💡 When done, merge to production-v1 and develop-v1"
}

function merge_v1() {
    echo "Merging develop-v1 into production-v1..."
    
    # Switch to production-v1
    git checkout production-v1
    
    # Merge develop-v1
    git merge develop-v1 --no-ff -m "Merge develop-v1 into production-v1
    
    🤖 Generated with [Claude Code](https://claude.ai/code)
    
    Co-Authored-By: Claude <noreply@anthropic.com>"
    
    echo "✅ Merged develop-v1 into production-v1"
}

function deploy_v1() {
    echo "Deploying V1 to production..."
    git checkout production-v1
    
    # Here you would add deployment commands
    echo "🚀 V1 deployment started"
    echo "💡 Run: docker-compose -f docker-compose.v1.yml up --build -d"
}

function deploy_v2() {
    echo "Deploying V2 to development..."
    git checkout develop-v2
    
    # Here you would add deployment commands
    echo "🚀 V2 deployment started"
    echo "💡 Run: docker-compose -f docker-compose.v2.yml up --build -d"
}

function list_branches() {
    echo "=== All Branches ==="
    echo ""
    echo "Local branches:"
    git branch -v
    echo ""
    echo "Remote branches:"
    git branch -rv 2>/dev/null || echo "No remote branches"
}

# Main command processing
case "${1:-help}" in
    "status")
        show_status
        ;;
    "switch-v1")
        switch_branch "develop-v1"
        ;;
    "switch-v2")
        switch_branch "develop-v2"
        ;;
    "switch-prod")
        switch_branch "production-v1"
        ;;
    "new-feature")
        new_feature "$2" "$3"
        ;;
    "new-hotfix")
        new_hotfix "$2"
        ;;
    "merge-v1")
        merge_v1
        ;;
    "deploy-v1")
        deploy_v1
        ;;
    "deploy-v2")
        deploy_v2
        ;;
    "list-branches")
        list_branches
        ;;
    "help"|*)
        show_help
        ;;
esac