import fs from 'node:fs';
import path from 'node:path';
import {
  findGitRepos,
  collectRepoDetails,
  resolvePath
} from './repo.js';
import {
  generateLLMCompletion,
  generateHeuristicEpitaph,
  generateHeuristicResurrect,
  detectConfiguredProvider,
  buildEpitaphPrompt,
  buildResurrectPrompt,
  parseEpitaphResponse,
  parseResurrectResponse
} from './llm.js';
import { renderGravestone, renderResurrection } from './gravestone.js';
import { generateGraveyardHtml } from './export-html.js';
import colors from './colors.js';

function resolveActiveProvider({ provider, defaultProvider = 'none' }) {
  if (provider === 'none') {
    return 'none';
  }

  if (provider) {
    return provider.toLowerCase();
  }

  // Check if an explicit provider is in environment
  const configured = detectConfiguredProvider();
  if (configured) {
    return configured;
  }

  return defaultProvider;
}

export async function scanGraveyard({
  dir,
  days = 180,
  provider = 'none',
  model,
  apiKey,
  host,
  referenceDate = new Date(),
  onProviderSelected = null
} = {}) {
  const targetDir = resolvePath(dir);
  const repos = findGitRepos(targetDir);

  if (repos.length === 0) {
    return { targetDir, deadProjects: [], totalScanned: 0, providerUsed: 'none' };
  }

  const deadProjects = [];

  for (const repo of repos) {
    const details = collectRepoDetails(repo.path, { daysThreshold: days, referenceDate });
    if (details.isDead) {
      deadProjects.push(details);
    }
  }

  // Scan defaults to 'none' (pure local Git mode)
  const activeProvider = resolveActiveProvider({ provider, defaultProvider: 'none' });
  if (typeof onProviderSelected === 'function') {
    onProviderSelected(activeProvider);
  }

  // Generate epitaphs
  for (const project of deadProjects) {
    if (activeProvider === 'none') {
      const heuristic = generateHeuristicEpitaph(project);
      project.epitaph = heuristic.epitaph;
      project.causeOfDeath = heuristic.causeOfDeath;
    } else {
      const prompt = buildEpitaphPrompt(project);
      const response = await generateLLMCompletion({
        prompt,
        provider: activeProvider,
        model,
        apiKey,
        host
      });
      const { epitaph, causeOfDeath } = parseEpitaphResponse(response, project.name);
      project.epitaph = epitaph;
      project.causeOfDeath = causeOfDeath;
    }
  }

  return {
    targetDir,
    totalScanned: repos.length,
    deadProjects,
    providerUsed: activeProvider
  };
}

export async function resurrectProject({
  target,
  searchDir,
  provider,
  model,
  apiKey,
  host,
  onProviderSelected = null
} = {}) {
  if (!target) {
    throw new Error('Please specify a project name or path to resurrect.');
  }

  let repoPath = null;

  // 1. Is target an existing directory?
  const directPath = path.resolve(target);
  if (fs.existsSync(path.join(directPath, '.git'))) {
    repoPath = directPath;
  } else {
    // 2. Search in searchDir or default ~/projects
    const baseDir = resolvePath(searchDir);
    if (fs.existsSync(baseDir)) {
      const candidate = path.join(baseDir, target);
      if (fs.existsSync(path.join(candidate, '.git'))) {
        repoPath = candidate;
      }
    }
    // 3. Search in current working directory
    if (!repoPath) {
      const cwdCandidate = path.join(process.cwd(), target);
      if (fs.existsSync(path.join(cwdCandidate, '.git'))) {
        repoPath = cwdCandidate;
      }
    }
  }

  if (!repoPath) {
    throw new Error(`Could not find git repository for project "${target}".`);
  }

  const details = collectRepoDetails(repoPath);
  // Resurrect defaults to ollama/configured AI model, fallback to heuristic
  const activeProvider = resolveActiveProvider({ provider, defaultProvider: 'ollama' });
  if (typeof onProviderSelected === 'function') {
    onProviderSelected(activeProvider);
  }

  let result;
  if (activeProvider === 'none') {
    result = generateHeuristicResurrect(details);
  } else {
    try {
      const prompt = buildResurrectPrompt(details);
      const response = await generateLLMCompletion({
        prompt,
        provider: activeProvider,
        model,
        apiKey,
        host
      });
      result = parseResurrectResponse(response);
    } catch (err) {
      // If user didn't explicitly request a provider and default failed, fallback to heuristic
      if (!provider && err) {
        result = generateHeuristicResurrect(details);
      } else {
        throw err;
      }
    }
  }

  return {
    ...result,
    name: details.name,
    path: repoPath,
    deathDate: details.deathDate,
    providerUsed: activeProvider
  };
}

export async function exportGraveyard({
  dir,
  outFile = 'graveyard.html',
  days = 180,
  provider = 'none',
  model,
  apiKey,
  host,
  referenceDate = new Date(),
  onProviderSelected = null
} = {}) {
  const { targetDir, totalScanned, deadProjects, providerUsed } = await scanGraveyard({
    dir,
    days,
    provider,
    model,
    apiKey,
    host,
    referenceDate,
    onProviderSelected
  });

  const html = generateGraveyardHtml(deadProjects, {
    directory: targetDir,
    daysThreshold: days
  });

  const resolvedOut = path.resolve(outFile);
  const parentDir = path.dirname(resolvedOut);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  fs.writeFileSync(resolvedOut, html, 'utf-8');

  return {
    targetDir,
    totalScanned,
    deadProjects,
    outFile: resolvedOut,
    providerUsed
  };
}

export {
  findGitRepos,
  collectRepoDetails,
  resolvePath,
  renderGravestone,
  renderResurrection,
  generateGraveyardHtml,
  colors
};
