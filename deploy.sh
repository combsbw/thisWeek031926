#!/bin/bash
# Deploy Scholar's Journal to Cloudflare Pages
# Usage: ./deploy.sh

set -e

echo ""
echo "  ✦  Deploying Scholar's Journal  ✦"
echo ""

# Check for wrangler
if ! command -v wrangler &> /dev/null; then
    echo "  Wrangler not found. Installing..."
    npm install -g wrangler
    echo ""
    echo "  Now log in to Cloudflare:"
    wrangler login
    echo ""
fi

cd "$(dirname "$0")"
wrangler pages deploy . --project-name=scholars-journal

echo ""
echo "  ✦  Deploy complete!"
echo ""
echo "  Next steps if this is your first deploy:"
echo "  1. Go to https://one.dash.cloudflare.com"
echo "  2. Access → Applications → Add Application → Self-hosted"
echo "  3. Set domain to: scholars-journal.pages.dev"
echo "  4. Add a policy allowing your email and your daughter's email"
echo "  5. See DEPLOY-GUIDE.md for full walkthrough"
echo ""
