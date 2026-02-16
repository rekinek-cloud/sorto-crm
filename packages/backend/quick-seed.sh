#!/bin/bash

echo "🚀 CRM-GTD Quick Seed Deployment"
echo "================================="

# Check if we're in the right directory
if [ ! -f "prisma/seed-complete-data.ts" ]; then
    echo "❌ Error: Must run from packages/backend directory"
    echo "💡 Run: cd packages/backend && ./quick-seed.sh"
    exit 1
fi

# Make sure the script is executable
chmod +x quick-seed.sh

echo "🔍 Checking database connection..."

# Test database connection
npx prisma db execute --schema prisma/schema.prisma --stdin <<< "SELECT 1;" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Database connection failed"
    echo "💡 Make sure Docker containers are running:"
    echo "   docker start crm-postgres-v1"
    exit 1
fi

echo "✅ Database connection successful"

echo "🌱 Running comprehensive seed..."

# Run the seed script
npx ts-node prisma/seed-complete-data.ts

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 SEED DEPLOYMENT SUCCESSFUL!"
    echo "=============================="
    echo ""
    echo "🌐 Your CRM-GTD system is ready:"
    echo "   Frontend: https://crm.dev.sorto.ai/crm/"
    echo "   API: https://crm.dev.sorto.ai/crm/api/v1/"
    echo ""
    echo "📊 Key features populated:"
    echo "   ✅ GTD Contexts & Buckets"
    echo "   ✅ Organizations & Users"
    echo "   ✅ Companies & Contacts"
    echo "   ✅ Projects & Tasks"
    echo "   ✅ Products & Services"
    echo "   ✅ AI Providers & Models"
    echo "   ✅ Communication Channels"
    echo "   ✅ Smart Mailboxes"
    echo "   ✅ Knowledge Base"
    echo "   ✅ Focus Modes & Habits"
    echo "   ✅ Email Templates & Rules"
    echo ""
    echo "🎯 Ready for production use!"
else
    echo "❌ Seed deployment failed"
    echo "💡 Check the error messages above"
    exit 1
fi