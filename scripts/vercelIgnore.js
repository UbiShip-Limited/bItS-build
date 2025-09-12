// Purpose: Skip Vercel builds when only backend/server files changed in this mono-repo.
// Exit code semantics for Vercel ignoreCommand:
// - exit 0 → proceed with build
// - exit 1 → skip build

const { execSync } = require('node:child_process');

function getChangedFiles() {
  const candidates = [
    'git diff --name-only HEAD^ HEAD',
    'git diff --name-only origin/HEAD...HEAD',
  ];
  for (const cmd of candidates) {
    try {
      const out = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim();
      if (out) return out.split('\n');
    } catch {}
  }
  // Fallback: no diff found, allow build
  return [];
}

function shouldBuild(changed) {
  // Frontend-affecting globs
  const frontendRegexes = [
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

  // If any changed file matches frontend patterns → build
  return changed.some((f) => frontendRegexes.some((re) => re.test(f)));
}

try {
  const changed = getChangedFiles();
  if (changed.length === 0) {
    // No diff available or empty diff → proceed to be safe
    process.exit(0);
  }
  if (shouldBuild(changed)) {
    process.exit(0);
  }
  // Only backend/server files changed → skip Vercel build
  process.exit(1);
} catch {
  // On any error, proceed with build to avoid false negatives
  process.exit(0);
}


