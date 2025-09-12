// Purpose: Skip Vercel builds when only backend/server files changed in this mono-repo.
// Exit code semantics for Vercel ignoreCommand:
// - exit 0 → proceed with build
// - exit 1 → skip build

const { execSync } = require('node:child_process');

function getChangedFiles() {
  try {
    // Try to get the changed files from the last commit
    const output = execSync('git diff --name-only HEAD^ HEAD 2>/dev/null', { 
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim();
    
    return output ? output.split('\n') : [];
  } catch (error) {
    // If we can't determine changes, proceed with build to be safe
    console.log('Could not determine changed files, proceeding with build');
    return [];
  }
}

function shouldBuild(changedFiles) {
  // If no files changed or we couldn't determine, build anyway
  if (changedFiles.length === 0) {
    return true;
  }

  // Frontend-related patterns that should trigger a build
  const frontendPatterns = [
    /^src\//,
    /^public\//,
    /^app\//,
    /^next\.config\.ts$/,
    /^postcss\.config\.(js|mjs)$/,
    /^tailwind\.config\.(js|cjs|ts)$/,
    /^vercel\.json$/,
    /^package\.json$/,
    /^package-lock\.json$/,
    /^tsconfig\.json$/,
  ];

  // Backend-only patterns that should NOT trigger a build
  const backendOnlyPatterns = [
    /^lib\//,
    /^prisma\//,
    /^scripts\//,
    /^server-package\.json$/,
    /^tsconfig\.server\.json$/,
    /^railway\.json$/,
    /^\.railwayignore$/,
  ];

  // Check if any changed file is a frontend file
  const hasFrontendChanges = changedFiles.some(file => 
    frontendPatterns.some(pattern => pattern.test(file))
  );

  // Check if ALL changed files are backend-only
  const allBackendOnly = changedFiles.every(file =>
    backendOnlyPatterns.some(pattern => pattern.test(file))
  );

  // Build if there are frontend changes OR if not all changes are backend-only
  return hasFrontendChanges || !allBackendOnly;
}

try {
  const changedFiles = getChangedFiles();
  const shouldProceed = shouldBuild(changedFiles);
  
  if (shouldProceed) {
    console.log('Frontend changes detected, proceeding with build');
    process.exit(0);
  } else {
    console.log('Only backend changes detected, skipping build');
    process.exit(1);
  }
} catch (error) {
  // On any error, proceed with build to avoid false negatives
  console.log('Error in ignore script, proceeding with build to be safe');
  process.exit(0);
}


