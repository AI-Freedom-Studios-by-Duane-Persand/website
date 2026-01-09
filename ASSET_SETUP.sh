#!/usr/bin/env bash
# Quick Start: Asset Permanent Access Setup

# ============================================================================
# AI Freedom Studios - Asset Permanent Access Quick Setup
# ============================================================================
# This script helps configure and test the new asset permanent access system

echo "🚀 Asset Permanent Access Setup"
echo "================================"

# Check environment
if [ -z "$R2_PUBLIC_BASE_URL" ]; then
  echo "⚠️  R2_PUBLIC_BASE_URL not set"
  echo "   Add to backend/.env: R2_PUBLIC_BASE_URL=https://assets.example.com"
else
  echo "✅ R2_PUBLIC_BASE_URL configured: $R2_PUBLIC_BASE_URL"
fi

if [ -z "$NEXT_PUBLIC_API_URL" ]; then
  echo "⚠️  NEXT_PUBLIC_API_URL not set"
  echo "   Add to frontend/.env.local: NEXT_PUBLIC_API_URL=https://api.example.com"
else
  echo "✅ NEXT_PUBLIC_API_URL configured: $NEXT_PUBLIC_API_URL"
fi

echo ""
echo "📋 Available Commands:"
echo "   1. Check URL Status:  curl -H 'Authorization: Bearer TOKEN' 'http://localhost:3000/api/storage/assets/status?url=ASSET_URL'"
echo "   2. Refresh Single URL: curl -X POST -H 'Authorization: Bearer TOKEN' 'http://localhost:3000/api/storage/assets/refresh-url?url=ASSET_URL'"
echo "   3. Batch Refresh:     curl -X POST -H 'Authorization: Bearer TOKEN' 'http://localhost:3000/api/storage/assets/refresh-batch'"
echo "   4. Migrate to Permanent: curl -X POST -H 'Authorization: Bearer TOKEN' 'http://localhost:3000/api/storage/assets/migrate-to-permanent'"

echo ""
echo "📚 Documentation:"
echo "   - Full Guide: docs/guides/ASSET_URL_MANAGEMENT.md"
echo "   - Implementation: ASSET_ACCESS_IMPLEMENTATION.md"

echo ""
echo "✨ Components to Use:"
echo "   Frontend:"
echo "     import { AssetImage, AssetVideo } from '@/components/AssetImage';"
echo "     import AssetUrlManager from '@/lib/asset-url-manager';"
echo ""
echo "   Usage:"
echo "     <AssetImage src={url} alt='asset' autoRefresh />"
echo "     <AssetVideo src={url} autoRefresh />"
echo "     const freshUrl = await AssetUrlManager.getAssetUrl(url);"
