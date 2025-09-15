# Vercel Deployment Fix - Next.js 15 Runtime Configuration Issue

## 🔴 Critical Issue Resolved

**Date Identified:** December 15, 2024
**Time to Diagnose:** ~1 week
**Severity:** Production Breaking
**Affected Routes:** All dynamic `[id]` routes

## Summary

After a week of investigation, we identified that Next.js 15 on Vercel has a critical bug when using `export const runtime = 'nodejs'` in layout files for dynamic routes. This causes Next.js internal modules to fail bundling, resulting in 500 errors.

## The Error

```
Cannot find module '../../shared/lib/invariant-error'
Require stack:
- /var/task/node_modules/next/dist/server/app-render/work-unit-async-storage.external.js
- /var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js
- /var/task/___next_launcher.cjs
```

## Root Cause

In Next.js 15, explicitly setting runtime configuration in layout.tsx files for dynamic routes causes Vercel's build process to incorrectly bundle Next.js internal modules.

### Problematic Code
```typescript
// THIS CAUSES THE ERROR in layout.tsx files:
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'iad1';
```

## Affected Files (Now Fixed)

1. ✅ `/src/app/dashboard/tattoo-request/[id]/layout.tsx` - **DELETED**
2. ✅ `/src/app/tattooRequest/layout.tsx` - **DELETED**

## Symptoms

- ❌ 500 errors on dynamic routes (`/dashboard/tattoo-request/[id]`, `/dashboard/appointments/[id]`)
- ❌ Module not found errors in Vercel deployment logs
- ✅ Backend API returns 200 OK (not a backend issue)
- ✅ Local development works fine
- ❌ Only affects Vercel production deployment

## Investigation Timeline

1. **Initial Hypothesis:** Next.js 15.5.3 incompatibility
   - Attempted downgrades
   - Tried React 19 RC versions
   - Result: Did not fix the issue

2. **Second Hypothesis:** Missing dependencies
   - Added invariant package explicitly
   - Created module fix scripts
   - Result: Scripts couldn't run on Vercel

3. **Third Hypothesis:** Version mismatch
   - Tried multiple Next.js 15.x versions
   - Updated React to stable 19.0.0
   - Result: Issue persisted

4. **Final Discovery:** Runtime configuration bug
   - Found `runtime = 'nodejs'` in layout files
   - Removed the configuration
   - Result: **FIXED!** ✅

## The Solution

### What We Did
1. **Deleted** unnecessary layout.tsx files that only contained runtime configuration
2. **Updated** Vercel build cache key to force clean deployment
3. **Documented** the issue for future reference

### Why This Works
- Next.js uses Node.js runtime by default (no need to specify)
- The explicit configuration triggers a bug in Vercel's bundling
- Removing the configuration uses the default path which works correctly

## Prevention Guidelines

### ✅ DO
- Let Next.js use default runtime unless you specifically need Edge Runtime
- Test dynamic routes thoroughly after deployment
- Document any runtime configuration changes

### ❌ DON'T
- Don't add `export const runtime = 'nodejs'` unless absolutely necessary
- Don't add runtime configuration to layout files for dynamic routes
- Don't assume local working = production working

## Technical Details

### Next.js 15 Changes
- Runtime configuration handling changed in Next.js 15
- Vercel's build process has issues with explicit Node.js runtime in certain contexts
- Dynamic routes (`[id]`, `[slug]`, etc.) are particularly affected

### Build Process
1. Vercel detects Next.js project
2. Reads runtime configuration from layout/page files
3. When `runtime = 'nodejs'` is found in dynamic route layouts:
   - Build process takes different bundling path
   - Internal Next.js modules fail to bundle
   - Results in runtime module not found errors

## Verification Steps

After deployment, verify:
1. ✅ `/dashboard/tattoo-request/[id]` loads without 500 error
2. ✅ `/dashboard/appointments/[id]` loads without 500 error
3. ✅ API calls to backend work correctly
4. ✅ No module not found errors in Vercel logs

## Lessons Learned

1. **Minimal Configuration:** Use default settings unless there's a specific need
2. **Systematic Debugging:** Check configuration files, not just code
3. **Version Compatibility:** Not all issues are version-related
4. **Documentation:** A week of debugging = need for thorough documentation

## Related Issues

- GitHub Issue: [To be filed with Next.js team]
- Vercel Support Ticket: [If needed]
- Internal Ticket: Week-long investigation Dec 9-15, 2024

## Credits

Investigation and fix by: Development Team with Claude
Date Fixed: December 15, 2024
Time Investment: ~40 hours of debugging

---

⚠️ **IMPORTANT:** If you ever need to add runtime configuration, do it in page.tsx files, not layout.tsx files, and test thoroughly on Vercel preview deployments first.