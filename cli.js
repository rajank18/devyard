#!/usr/bin/env node

import path from 'node:path';
import {
  scanGraveyard,
  resurrectProject,
  exportGraveyard,
  renderGravestone,
  renderResurrection,
  colors
} from './src/index.js';
import {
  LLMConnectionError,
  LLMAuthError,
  LLMModelNotFoundError,
  PROVIDERS
} from './src/llm.js';

function printHelp() {
  console.log(`
${colors.marigold('devyard')} ${colors.dim('v1.0.2')}
A cemetery for abandoned side projects.

${colors.bold('USAGE:')}
  devyard scan [dir] [--days <n>] [--provider <name>] [--ai] [--model <model>] [--api-key <key>]
  devyard resurrect <project> [--provider <name>] [--model <model>] [--api-key <key>]
  devyard export [dir] [--out <file>] [--days <n>] [--provider <name>] [--ai] [--model <model>]
  devyard --help
  devyard --version

${colors.bold('COMMANDS:')}
  ${colors.marigold('scan')} [dir]           Scan directory for dead git repos and print gravestones.
                       Default: pure local Git inspection with NO AI required.
                       Default dir: ~/projects, default inactivity: 180 days.
  ${colors.marigold('resurrect')} <project>  Find where you left off, why you stopped,
                       and the smallest next step to revive it (uses AI by default).
  ${colors.marigold('export')} [dir]         Export candlelit tombstones to a single self-contained HTML file.
                       Default output: graveyard.html.

${colors.bold('PROVIDERS:')}
  Scan runs 100% locally with zero AI by default! To enable AI-generated epitaphs,
  pass --ai or choose any of these providers:

  ${colors.candle('ollama')}     Local open-weight models (no key needed). Default: qwen2.5:3b
  ${colors.candle('openai')}     OpenAI API. Default: gpt-4o-mini ($OPENAI_API_KEY)
  ${colors.candle('gemini')}     Google Gemini API. Default: gemini-1.5-flash ($GEMINI_API_KEY)
  ${colors.candle('openrouter')} OpenRouter API. Default: meta-llama/llama-3.2-3b-instruct ($OPENROUTER_API_KEY)
  ${colors.candle('anthropic')}  Anthropic API. Default: claude-3-5-haiku-20241022 ($ANTHROPIC_API_KEY)

${colors.bold('OPTIONS:')}
  -p, --provider <name>  LLM provider: ${PROVIDERS.join(', ')}
  --ai                   Enable AI using local Ollama or your configured cloud provider
  --model <model>        LLM model override (or $DEVYARD_MODEL)
  --api-key <key>        API key for cloud providers
  --host <url>           Custom API or Ollama host endpoint
  --days <n>             Inactivity threshold in days (default: 180)
  --out <file>           Output HTML path for export (default: graveyard.html)
  -h, --help             Show this help message
  -v, --version          Show version number
`);
}

function parseArgs(args) {
  const options = {
    command: null,
    positional: [],
    days: 180,
    provider: process.env.DEVYARD_PROVIDER || process.env.PROJECTYARD_PROVIDER || null,
    ai: false,
    model: process.env.DEVYARD_MODEL || process.env.PROJECTYARD_MODEL || null,
    apiKey: null,
    host: process.env.OLLAMA_HOST || null,
    outFile: 'graveyard.html'
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      i++;
    } else if (arg === '--version' || arg === '-v') {
      options.version = true;
      i++;
    } else if (arg === '--ai') {
      options.ai = true;
      i++;
    } else if (arg === '--days') {
      options.days = parseInt(args[++i], 10) || 180;
      i++;
    } else if (arg.startsWith('--days=')) {
      options.days = parseInt(arg.split('=')[1], 10) || 180;
      i++;
    } else if (arg === '-p' || arg === '--provider') {
      options.provider = args[++i];
      i++;
    } else if (arg.startsWith('--provider=')) {
      options.provider = arg.split('=')[1];
      i++;
    } else if (arg === '--model') {
      options.model = args[++i];
      i++;
    } else if (arg.startsWith('--model=')) {
      options.model = arg.split('=')[1];
      i++;
    } else if (arg === '--api-key') {
      options.apiKey = args[++i];
      i++;
    } else if (arg.startsWith('--api-key=')) {
      options.apiKey = arg.split('=')[1];
      i++;
    } else if (arg === '--host') {
      options.host = args[++i];
      i++;
    } else if (arg.startsWith('--host=')) {
      options.host = arg.split('=')[1];
      i++;
    } else if (arg === '--out') {
      options.outFile = args[++i];
      i++;
    } else if (arg.startsWith('--out=')) {
      options.outFile = arg.split('=')[1];
      i++;
    } else if (!options.command && ['scan', 'resurrect', 'export'].includes(arg)) {
      options.command = arg;
      i++;
    } else {
      options.positional.push(arg);
      i++;
    }
  }

  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  if (options.version) {
    console.log('devyard v1.0.2');
    process.exit(0);
  }

  const command = options.command || 'scan';

  const onProviderSelected = (provider) => {
    if (provider === 'none') {
      console.log(colors.dim('ℹ Running in local Git mode (no AI). Pass --ai or --provider <name> for AI epitaphs.'));
    } else {
      console.log(colors.dim(`ℹ Using AI provider: ${colors.marigold(provider.toUpperCase())}`));
    }
  };

  try {
    if (command === 'scan') {
      const targetDir = options.positional[0] || '~/projects';
      console.log(`${colors.dim('Inspecting graveyard at')} ${colors.marigold(targetDir)}${colors.dim('...')}`);

      // Scan is no-ai by default unless --ai or --provider is explicitly given
      let scanProvider = 'none';
      if (options.provider) {
        scanProvider = options.provider;
      } else if (options.ai) {
        scanProvider = 'ollama';
      }

      const { deadProjects, totalScanned } = await scanGraveyard({
        dir: targetDir,
        days: options.days,
        provider: scanProvider,
        model: options.model,
        apiKey: options.apiKey,
        host: options.host,
        onProviderSelected
      });

      if (totalScanned === 0) {
        console.log(`\n${colors.dim('No git repositories found in')} ${targetDir}.`);
        return;
      }

      if (deadProjects.length === 0) {
        console.log(`\n${colors.green('All ' + totalScanned + ' projects are alive!')} None dormant for ${options.days}+ days.`);
        return;
      }

      console.log(`\n${colors.marigold('Found ' + deadProjects.length + ' abandoned project' + (deadProjects.length === 1 ? '' : 's') + ' in the yard:')}\n`);

      for (const project of deadProjects) {
        console.log(renderGravestone(project));
      }
    } else if (command === 'resurrect') {
      const targetProject = options.positional[0];
      if (!targetProject) {
        console.error(`${colors.red('Error:')} Missing project name or path.\nUsage: devyard resurrect <project>`);
        process.exit(1);
      }

      console.log(`${colors.candle('Summoning the spirit of')} ${colors.marigold(targetProject)}${colors.candle('...')}`);

      const resurrection = await resurrectProject({
        target: targetProject,
        provider: options.provider || (options.ai ? 'ollama' : null),
        model: options.model,
        apiKey: options.apiKey,
        host: options.host,
        onProviderSelected
      });

      console.log(renderResurrection(resurrection));
    } else if (command === 'export') {
      const targetDir = options.positional[0] || '~/projects';
      console.log(`${colors.dim('Gathering tombstones from')} ${colors.marigold(targetDir)}${colors.dim('...')}`);

      let exportProvider = 'none';
      if (options.provider) {
        exportProvider = options.provider;
      } else if (options.ai) {
        exportProvider = 'ollama';
      }

      const { deadProjects, outFile } = await exportGraveyard({
        dir: targetDir,
        outFile: options.outFile,
        days: options.days,
        provider: exportProvider,
        model: options.model,
        apiKey: options.apiKey,
        host: options.host,
        onProviderSelected
      });

      console.log(`\n${colors.candle('✦')} Exported ${colors.marigold(deadProjects.length)} gravestones to ${colors.white(outFile)}`);
    } else {
      console.error(`${colors.red('Error:')} Unknown command "${command}".`);
      printHelp();
      process.exit(1);
    }
  } catch (err) {
    if (err instanceof LLMConnectionError || err instanceof LLMModelNotFoundError || err instanceof LLMAuthError) {
      console.error(`\n${colors.red('Error:')} ${err.message}\n`);
      process.exit(1);
    }

    if (err.message && (err.message.includes('Directory does not exist') || err.message.includes('Could not find git repository'))) {
      console.error(`\n${colors.red('Error:')} ${err.message}\n`);
      process.exit(1);
    }

    // Friendly error display without stack traces for expected failure modes
    console.error(`\n${colors.red('Error:')} ${err.message || err}\n`);
    process.exit(1);
  }
}

main();
