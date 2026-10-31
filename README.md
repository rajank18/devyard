# 🪦 devyard

> **A cemetery for abandoned side projects.**

Catalog your unfinished repositories, commemorate their unfulfilled potential with terminal gravestones, and resurrect them when inspiration strikes again.

Runs **100% locally with zero external npm dependencies**. `devyard scan` runs on pure local Git history with **no AI required by default**. If you want AI-generated epitaphs or revival advice, you can enable them with `--ai` or choose any provider (**Ollama, OpenAI, Gemini, OpenRouter, Anthropic**).

---

## ⚡ Quick Start

No installation required. Run directly with `npx`:

```bash
# 1. Scan your projects folder (zero AI, zero network calls, zero keys by default!)
npx devyard scan

# 2. Want creative AI epitaphs? Simply pass --ai or pick your preferred provider:
npx devyard scan --ai                   # Uses local Ollama
npx devyard scan --provider openai      # Uses OpenAI (OPENAI_API_KEY)
npx devyard scan --provider gemini      # Uses Google Gemini (GEMINI_API_KEY)
npx devyard scan --provider openrouter  # Uses OpenRouter (OPENROUTER_API_KEY)
npx devyard scan --provider anthropic   # Uses Anthropic Claude (ANTHROPIC_API_KEY)

# Scan a custom folder or customize dormancy threshold (default: 180 days)
npx devyard scan ~/code --days 90

# Get an actionable plan to revive an abandoned repo (uses AI by default)
npx devyard resurrect my-unfinished-app

# Export a self-contained candlelit HTML cemetery
npx devyard export ~/projects --out graveyard.html
```

---

## 🧠 Optional AI Providers: Choose Your Engine

`scan` runs in local Git mode with no AI by default. When you want AI-crafted epitaphs and causes of death, pick any provider:

| Provider | CLI Flag | Environment Variable | Default Model | Notes |
|---|---|---|---|---|
| **Local Git (Default)** | *(default for scan)* | *(none)* | *(heuristic)* | Instant, 100% offline, zero network calls |
| **Ollama** | `--ai` or `--provider ollama` | *(none needed)* | `qwen2.5:3b` | 100% private & local |
| **OpenAI** | `--provider openai` | `OPENAI_API_KEY` | `gpt-4o-mini` | Fast & lightweight |
| **Google Gemini** | `--provider gemini` | `GEMINI_API_KEY` | `gemini-1.5-flash` | Generous free tier |
| **OpenRouter** | `--provider openrouter` | `OPENROUTER_API_KEY` | `meta-llama/llama-3.2-3b-instruct` | Access to 100+ open-weight models |
| **Anthropic** | `--provider anthropic` | `ANTHROPIC_API_KEY` | `claude-3-5-haiku-20241022` | Sharp, concise analysis |

You can override the model for any provider via `--model` or `DEVYARD_MODEL`:
```bash
npx devyard scan --provider openrouter --model deepseek/deepseek-r1
npx devyard scan --provider ollama --model mistral:7b
```

---

## 🔒 Why Local Open-Weight Models Matter

When using local models like Ollama:
1. 🔒 **Private Code Stays on Your Machine**: Abandoned side projects often contain unfinished proprietary logic, experimental internal APIs, or scratch configuration. Not a single byte of your code or commit history ever leaves localhost.
2. 📴 **100% Offline**: Works on airplanes, in remote areas, or inside air-gapped environments.
3. 💸 **Completely Free**: No monthly subscriptions, no token burn, no surprise rate limits.
4. 🔄 **Freely Swappable**: Use any model in your local catalog.

---

## 🕯️ Commands

### 1. `devyard scan [dir]`
Scans all direct git repositories inside `dir` (defaults to `~/projects`). For every repo dormant for 180+ days (configurable via `--days`):
- Gathers the last 20 commit messages, up to 30 unfinished `TODO`/`FIXME` lines, and the README header.
- Inscribes an ASCII gravestone with birth date, death date, a 2-line epitaph, and the cause of death.
- **Runs without AI by default** using pure local Git analysis. Add `--ai` or `--provider <name>` for AI epitaphs.

```bash
# Pure local Git analysis (default)
devyard scan ~/projects --days 120

# With AI epitaphs
devyard scan ~/projects --ai
devyard scan ~/projects --provider openai
```

### 2. `devyard resurrect <project>`
Inspects the repository's last commits and unfinished tasks to answer:
1. **Where you left off**
2. **Why you probably stopped**
3. **The smallest next step to revive it**

```bash
# Uses AI by default (Ollama or configured cloud provider)
devyard resurrect ghost-protocol

# Explicitly choose your provider
devyard resurrect ghost-protocol --provider gemini
devyard resurrect ghost-protocol --provider none
```

### 3. `devyard export [dir] --out graveyard.html`
Generates a static, single-file HTML cemetery featuring candlelit tombstones, marigold-orange accents, atmospheric dark backgrounds, and CSS flickering candle animations.
- **Zero external assets**: No external fonts, scripts, or stylesheets. Completely self-contained.

```bash
devyard export ~/projects --out graveyard.html
devyard export ~/projects --ai --out graveyard.html
```

---

## 🪦 Sample Output

```
        .-────────────────────────────────────────────-.
      /          ✝  R. I. P.  ✝          \
    ┌──────────────────────────────────────────────────────────┐
    │  PROJECT: ghost-protocol                                 │
    │  Born: 2023-01-15   ✝   Died: 2023-08-10 (447 days dormant)│
    ├──────────────────────────────────────────────────────────┤
    │  "Last words: WIP auth rewrite and broken tokens"        │
    │  "3 unfinished tasks left in the dark."                  │
    ├──────────────────────────────────────────────────────────┤
    │  Cause of Death:                                         │
    │  Abandoned midway through an architectural overhaul.     │
 ~*~ └──────────────────────────────────────────────────────────┘ ~*~
```

---

## 🛠️ CLI Options

| Flag | Description | Default |
|---|---|---|
| `-p, --provider <name>` | LLM provider: `ollama`, `openai`, `gemini`, `openrouter`, `anthropic`, `none` | `none` for scan, `ollama` for resurrect |
| `--ai` | Enable AI on scan or export using Ollama or configured cloud provider | `false` |
| `--model <name>` | Model name override | Provider default (or `$DEVYARD_MODEL`) |
| `--api-key <key>` | API key for cloud providers | Inherited from provider env variable |
| `--days <n>` | Dormancy threshold in days | `180` |
| `--host <url>` | Custom API or Ollama host endpoint | Provider default (or `$OLLAMA_HOST`) |
| `--out <file>` | Output file path for HTML export | `graveyard.html` |
| `-h, --help` | Display help screen | |
| `-v, --version` | Display version | `1.0.0` |

---

## 🧪 Testing

The test suite runs with Node's native `node:test` runner with zero external dependencies:

```bash
npm test
```

Includes 51 tests covering git repo discovery, commit date calculations, TODO/FIXME scanning, prompt construction, offline default scan mode, multi-provider API mocks (Ollama, OpenAI, Gemini, OpenRouter, Anthropic), connection error recovery, and static HTML export.

---

## 📄 License

MIT &copy; devyard contributors
