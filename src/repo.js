import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.next',
  '.nuxt',
  'coverage',
  'vendor',
  '.turbo',
  '.cache',
  'target',
  'out',
  '__pycache__',
  '.svn',
  '.hg'
]);

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.pdf',
  '.zip', '.gz', '.tar', '.tgz', '.7z', '.rar',
  '.exe', '.bin', '.dll', '.so', '.dylib',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.mp3', '.mp4', '.mov', '.avi', '.wav', '.wasm',
  '.pyc', '.class', '.jar', '.lock', '.min.js', '.min.css', '.map'
]);

export function resolvePath(dirPath) {
  if (!dirPath) {
    return path.join(os.homedir(), 'projects');
  }
  if (dirPath.startsWith('~')) {
    return path.join(os.homedir(), dirPath.slice(1));
  }
  return path.resolve(dirPath);
}

export function findGitRepos(parentDir) {
  const resolved = resolvePath(parentDir);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Directory does not exist: ${resolved}`);
  }

  const stat = fs.statSync(resolved);
  if (!stat.isDirectory()) {
    throw new Error(`Path is not a directory: ${resolved}`);
  }

  const entries = fs.readdirSync(resolved, { withFileTypes: true });
  const repos = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const fullPath = path.join(resolved, entry.name);
      const gitPath = path.join(fullPath, '.git');
      if (fs.existsSync(gitPath)) {
        repos.push({
          name: entry.name,
          path: fullPath
        });
      }
    }
  }

  return repos;
}

export function getCommitDates(repoDir) {
  try {
    const lastCommit = execFileSync('git', ['log', '-1', '--format=%cI'], {
      cwd: repoDir,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim();

    if (!lastCommit) {
      return { birthDate: null, deathDate: null, isEmpty: true };
    }

    const firstCommitOutput = execFileSync('git', ['log', '--reverse', '--format=%cI'], {
      cwd: repoDir,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim();

    const firstCommit = firstCommitOutput.split(/\r?\n/)[0] || lastCommit;

    return {
      birthDate: firstCommit,
      deathDate: lastCommit,
      isEmpty: false
    };
  } catch {
    // Empty repo with no commits or git error
    return {
      birthDate: null,
      deathDate: null,
      isEmpty: true
    };
  }
}

export function isRepoDead(lastCommitIso, daysThreshold = 180, referenceDate = new Date()) {
  if (!lastCommitIso) {
    return { isDead: false, daysSinceLastCommit: null };
  }

  const commitTime = new Date(lastCommitIso).getTime();
  if (Number.isNaN(commitTime)) {
    return { isDead: false, daysSinceLastCommit: null };
  }

  const refTime = referenceDate instanceof Date ? referenceDate.getTime() : new Date(referenceDate).getTime();
  const diffMs = refTime - commitTime;
  const daysSinceLastCommit = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return {
    isDead: daysSinceLastCommit >= daysThreshold,
    daysSinceLastCommit: Math.max(0, daysSinceLastCommit)
  };
}

export function getRecentCommits(repoDir, limit = 20) {
  try {
    const output = execFileSync('git', ['log', `-${limit}`, '--format=%s'], {
      cwd: repoDir,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim();

    if (!output) return [];
    return output.split(/\r?\n/).filter(line => line.trim().length > 0);
  } catch {
    return [];
  }
}

export function getReadmeSnippet(repoDir, maxLines = 15) {
  try {
    const entries = fs.readdirSync(repoDir);
    const readmeFile = entries.find(name => /^readme(\..+)?$/i.test(name));
    if (!readmeFile) return '';

    const content = fs.readFileSync(path.join(repoDir, readmeFile), 'utf-8');
    const lines = content.split(/\r?\n/);
    return lines.slice(0, maxLines).join('\n').trim();
  } catch {
    return '';
  }
}

function isBinaryBuffer(buffer) {
  const checkLen = Math.min(buffer.length, 512);
  for (let i = 0; i < checkLen; i++) {
    if (buffer[i] === 0) {
      return true;
    }
  }
  return false;
}

export function extractTodos(repoDir, limit = 30) {
  const todos = [];
  const todoRegex = /\b(TODO|FIXME)\b[:\s]*(.*)/i;

  function scanDir(currentDir) {
    if (todos.length >= limit) return;

    let entries;
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (todos.length >= limit) break;

      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(repoDir, fullPath);

      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
          scanDir(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (BINARY_EXTENSIONS.has(ext)) continue;

        try {
          const fd = fs.openSync(fullPath, 'r');
          const buffer = Buffer.alloc(512);
          const bytesRead = fs.readSync(fd, buffer, 0, 512, 0);
          fs.closeSync(fd);

          if (isBinaryBuffer(buffer.subarray(0, bytesRead))) {
            continue;
          }

          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = content.split(/\r?\n/);

          for (let i = 0; i < lines.length; i++) {
            if (todos.length >= limit) break;
            const line = lines[i];
            const match = line.match(todoRegex);
            if (match) {
              const matchedKeyword = match[1].toUpperCase();
              const rest = match[2].trim();
              const fullTodo = rest ? `${matchedKeyword}: ${rest}` : matchedKeyword;
              todos.push({
                file: relativePath.replace(/\\/g, '/'),
                line: i + 1,
                text: fullTodo.slice(0, 150)
              });
            }
          }
        } catch {
          // ignore unreadable file
        }
      }
    }
  }

  scanDir(repoDir);
  return todos;
}

export function collectRepoDetails(repoDir, options = {}) {
  const { daysThreshold = 180, referenceDate = new Date() } = options;
  const name = path.basename(repoDir);
  const { birthDate, deathDate, isEmpty } = getCommitDates(repoDir);
  const { isDead, daysSinceLastCommit } = isRepoDead(deathDate, daysThreshold, referenceDate);
  const commits = isEmpty ? [] : getRecentCommits(repoDir, 20);
  const todos = extractTodos(repoDir, 30);
  const readme = getReadmeSnippet(repoDir, 15);

  return {
    name,
    path: repoDir,
    birthDate,
    deathDate,
    isEmpty,
    isDead,
    daysSinceLastCommit,
    commits,
    todos,
    readme
  };
}
