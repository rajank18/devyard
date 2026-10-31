function formatDate(isoStr) {
  if (!isoStr) return 'Unknown';
  try {
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return isoStr;
    return d.toISOString().split('T')[0];
  } catch {
    return isoStr;
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function generateGraveyardHtml(projects, options = {}) {
  const {
    directory = '~/projects',
    daysThreshold = 180,
    generatedAt = new Date().toISOString()
  } = options;

  const totalDead = projects.length;
  const dateStr = formatDate(generatedAt);

  const tombstoneCards = projects.map((p) => {
    const bDate = formatDate(p.birthDate);
    const dDate = formatDate(p.deathDate);
    const ageDays = p.daysSinceLastCommit !== null && p.daysSinceLastCommit !== undefined
      ? `${p.daysSinceLastCommit} days dormant`
      : 'dormant';

    const epitaphLines = Array.isArray(p.epitaph) ? p.epitaph : [p.epitaph || ''];
    const epitaphHtml = epitaphLines
      .filter(Boolean)
      .map(line => `<div class="epitaph-line">&ldquo;${escapeHtml(line)}&rdquo;</div>`)
      .join('\n');

    const cause = p.causeOfDeath || 'Fell into silent slumber.';

    return `
      <article class="tombstone" data-name="${escapeHtml(p.name)}">
        <div class="candle-container" aria-hidden="true">
          <div class="flame"></div>
          <div class="wick"></div>
          <div class="wax"></div>
        </div>
        <div class="tombstone-arch">
          <div class="rip-emblem">✝ R. I. P. ✝</div>
        </div>
        <div class="tombstone-body">
          <h2 class="project-name">${escapeHtml(p.name)}</h2>
          <div class="tombstone-dates">
            <span class="date-born" title="First commit">Born: ${escapeHtml(bDate)}</span>
            <span class="sep">&bull;</span>
            <span class="date-died" title="Last commit">Died: ${escapeHtml(dDate)}</span>
          </div>
          <div class="dormant-badge">${escapeHtml(ageDays)}</div>
          
          <div class="epitaph-box">
            ${epitaphHtml}
          </div>

          <div class="cause-box">
            <span class="cause-label">Cause of Death</span>
            <p class="cause-text">${escapeHtml(cause)}</p>
          </div>
        </div>
        <div class="tombstone-base"></div>
      </article>
    `;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevYard &bull; The Digital Graveyard</title>
  <style>
    :root {
      --bg: #090a0f;
      --card-bg: #141620;
      --card-border: #282b3d;
      --marigold: #ff9e00;
      --marigold-deep: #ff7a00;
      --sky-top: #120e24;
      --sky-bottom: #1d1636;
      --ground: #0b0914;
      --stone: #2c2a45;
      --stone-lit: #3d3a5e;
      --stone-edge: #54507c;
      --bone: #f3ead7;
      --mist: #a9a4c4;
      --dim: #7a7699;
      --glow: rgba(255, 164, 27, 0.4);
      --grass-a: #1c3a2a;
      --grass-b: #285238;
      --serif: "Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif;
      --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      position: relative;
      min-height: 100vh;
      color: var(--bone);
      font-family: var(--sans);
      line-height: 1.55;
      padding: 5.5rem 1.5rem 5rem;
      background:
        radial-gradient(ellipse 70% 40% at 50% 100%, rgba(255, 164, 27, 0.07), transparent 70%),
        linear-gradient(to bottom, var(--sky-top) 0%, var(--sky-bottom) 45%, var(--ground) 100%);
      background-attachment: fixed;
      overflow-x: hidden;
    }

    /* Papel picado banner: the one big gesture on the page */
    .papel {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 44px;
      background-repeat: repeat-x;
      background-size: 240px 44px;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='44'><rect width='240' height='3' fill='%23c9a45a'/><polygon points='4,3 56,3 56,34 43,40 30,34 17,40 4,34' fill='%23ff7a00'/><circle cx='30' cy='17' r='5' fill='%2317122b'/><circle cx='15' cy='25' r='2' fill='%2317122b'/><circle cx='45' cy='25' r='2' fill='%2317122b'/><polygon points='64,3 116,3 116,34 103,40 90,34 77,40 64,34' fill='%23d6336c'/><circle cx='90' cy='17' r='5' fill='%2317122b'/><circle cx='75' cy='25' r='2' fill='%2317122b'/><circle cx='105' cy='25' r='2' fill='%2317122b'/><polygon points='124,3 176,3 176,34 163,40 150,34 137,40 124,34' fill='%232ec4b6'/><circle cx='150' cy='17' r='5' fill='%2317122b'/><circle cx='135' cy='25' r='2' fill='%2317122b'/><circle cx='165' cy='25' r='2' fill='%2317122b'/><polygon points='184,3 236,3 236,34 223,40 210,34 197,40 184,34' fill='%23ffc53d'/><circle cx='210' cy='17' r='5' fill='%2317122b'/><circle cx='195' cy='25' r='2' fill='%2317122b'/><circle cx='225' cy='25' r='2' fill='%2317122b'/></svg>");
      filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.45));
    }

    header {
      position: relative;
      text-align: center;
      max-width: 760px;
      margin: 0 auto 4.5rem;
    }

    /* Moon behind the title */
    header::before {
      content: "";
      position: absolute;
      top: -2.2rem;
      left: 50%;
      width: 190px;
      height: 190px;
      transform: translateX(-50%);
      border-radius: 50%;
      background: radial-gradient(circle at 38% 36%, #fff8e6 0%, #f1e3bd 45%, #c9b98c 100%);
      box-shadow: 0 0 60px 20px rgba(241, 227, 189, 0.16), 0 0 140px 50px rgba(255, 164, 27, 0.08);
      opacity: 0.92;
      z-index: 0;
    }

    header > * { position: relative; z-index: 1; }

    .graveyard-icon {
      display: block;
      height: 1.2rem;
      margin-bottom: 4.2rem;
      font-size: 0;
    }

    h1 {
      font-family: var(--serif);
      font-size: clamp(2.8rem, 8vw, 4.6rem);
      font-weight: 700;
      letter-spacing: 0.02em;
      line-height: 1.05;
      color: var(--bone);
      text-shadow: 0 2px 0 rgba(0, 0, 0, 0.5), 0 0 36px rgba(11, 9, 20, 0.9);
      margin-bottom: 0.7rem;
    }

    .tagline {
      font-family: var(--serif);
      font-style: italic;
      font-size: 1.2rem;
      color: var(--mist);
      margin-bottom: 1.8rem;
    }

    .graveyard-meta {
      display: inline-flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.5rem 1.6rem;
      padding: 0.55rem 1.5rem;
      border-radius: 999px;
      background: rgba(18, 14, 36, 0.72);
      border: 1px solid rgba(255, 164, 27, 0.28);
      font-size: 0.86rem;
      color: var(--mist);
      backdrop-filter: blur(4px);
    }

    .meta-highlight { color: var(--marigold); font-weight: 600; }

    .search-bar { margin-top: 1.6rem; }

    .search-bar input {
      width: 100%;
      max-width: 380px;
      padding: 0.7rem 1.3rem;
      border-radius: 999px;
      border: 1px solid var(--stone-edge);
      background: rgba(18, 14, 36, 0.8);
      color: var(--bone);
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .search-bar input::placeholder { color: var(--dim); }

    .search-bar input:focus-visible {
      border-color: var(--marigold);
      box-shadow: 0 0 0 3px var(--glow);
    }

    .graveyard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
      gap: 3.4rem 2.2rem;
      max-width: 1180px;
      margin: 0 auto;
      align-items: stretch;
    }

    /* Tombstone */
    .tombstone {
      position: relative;
      display: flex;
      flex-direction: column;
      padding: 3rem 1.6rem 1.6rem;
      border-radius: 110px 110px 8px 8px;
      background:
        radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.07), transparent 65%),
        linear-gradient(to bottom, var(--stone-lit) 0%, var(--stone) 100%);
      border: 1px solid var(--stone-edge);
      box-shadow: 0 18px 34px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      overflow: visible;
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }

    /* Carved inner border */
    .tombstone::before {
      content: "";
      position: absolute;
      inset: 9px;
      border-radius: 102px 102px 4px 4px;
      border: 1px solid rgba(255, 255, 255, 0.07);
      box-shadow: inset 0 0 18px rgba(0, 0, 0, 0.25);
      pointer-events: none;
    }

    /* Vary the stones so the yard feels lived in */
    .tombstone:nth-child(3n+2) { border-radius: 22px 22px 8px 8px; }
    .tombstone:nth-child(3n+2)::before { border-radius: 14px 14px 4px 4px; }
    .tombstone:nth-child(3n) { border-radius: 60px 60px 8px 8px; }
    .tombstone:nth-child(3n)::before { border-radius: 52px 52px 4px 4px; }

    .tombstone:hover {
      transform: translateY(-4px);
      box-shadow: 0 22px 40px rgba(0, 0, 0, 0.7), 0 0 28px var(--glow), inset 0 1px 0 rgba(255, 255, 255, 0.12);
    }

    /* Candle, lit once on load */
    .candle-container {
      position: absolute;
      top: -26px;
      right: 30px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .flame {
      width: 12px;
      height: 19px;
      border-radius: 50% 50% 35% 35%;
      background: radial-gradient(ellipse at bottom, #fff 0%, #ffe45c 30%, #ff7b00 72%, transparent 100%);
      box-shadow: 0 0 16px 5px rgba(255, 170, 0, 0.65);
      transform-origin: center bottom;
      animation: ignite 0.9s ease-out both, flicker 1.8s 0.9s infinite ease-in-out alternate;
    }

    .tombstone:nth-child(2n) .flame { animation-delay: 0.25s, 1.15s; }
    .tombstone:nth-child(3n) .flame { animation-delay: 0.5s, 1.4s; }
    .tombstone:nth-child(5n) .flame { animation-delay: 0.8s, 1.7s; }

    .wick { width: 2px; height: 5px; background: #3a3a44; }

    .wax {
      width: 11px;
      height: 15px;
      border-radius: 2px;
      background: linear-gradient(to right, #d9d3c0, #f3ead7 55%, #cfc8b3);
    }

    @keyframes ignite {
      0% { transform: scale(0); opacity: 0; }
      60% { transform: scale(1.25); opacity: 1; }
      100% { transform: scale(1); opacity: 0.95; }
    }

    @keyframes flicker {
      0% { transform: scale(1) rotate(-1deg); opacity: 0.95; }
      30% { transform: scale(1.1) rotate(2deg); opacity: 1; }
      60% { transform: scale(0.94) rotate(-2deg); opacity: 0.86; }
      100% { transform: scale(1.04) rotate(1deg); opacity: 0.97; }
    }

    .tombstone-arch { text-align: center; margin-bottom: 0.9rem; }

    .rip-emblem {
      font-family: var(--serif);
      font-size: 0.95rem;
      letter-spacing: 0.3em;
      color: var(--marigold);
      opacity: 0.9;
    }

    .tombstone-body {
      position: relative;
      flex: 1;
      display: flex;
      flex-direction: column;
      text-align: center;
    }

    .project-name {
      font-family: var(--serif);
      font-size: 1.7rem;
      font-weight: 700;
      line-height: 1.2;
      color: var(--bone);
      word-break: break-word;
      text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.6), 0 1px 0 rgba(255, 255, 255, 0.08);
      margin-bottom: 0.45rem;
    }

    .tombstone-dates {
      font-family: var(--serif);
      font-size: 0.92rem;
      color: var(--mist);
      margin-bottom: 0.7rem;
    }

    .sep { color: var(--marigold-deep); margin: 0 0.45rem; }

    .dormant-badge {
      align-self: center;
      margin-bottom: 1.2rem;
      padding: 0.2rem 0.8rem;
      border-radius: 999px;
      border: 1px solid rgba(255, 164, 27, 0.4);
      background: rgba(255, 122, 0, 0.12);
      color: var(--marigold);
      font-size: 0.78rem;
      font-weight: 600;
    }

    .epitaph-box {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-bottom: 1.3rem;
      padding: 1.5rem 0.4rem 0.9rem;
      font-family: var(--serif);
      font-style: italic;
      font-size: 1.02rem;
      line-height: 1.6;
      color: #efe9f7;
      border-top: 1px solid rgba(255, 164, 27, 0.35);
    }

    .epitaph-box::before {
      content: "“";
      position: absolute;
      top: -0.35rem;
      left: 50%;
      transform: translateX(-50%);
      padding: 0 0.6rem;
      font-size: 2.2rem;
      line-height: 1;
      color: var(--marigold);
      background: var(--stone);
    }

    .cause-box {
      margin-top: auto;
      padding: 0.7rem 0.95rem;
      text-align: left;
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.28);
      border: 1px solid rgba(255, 255, 255, 0.06);
      box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.35);
    }

    .cause-label {
      display: block;
      margin-bottom: 0.15rem;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--marigold-deep);
    }

    .cause-text { font-size: 0.88rem; color: #e4dff0; }

    /* Grass bleeds off the bottom edge of the stone */
    .tombstone-base {
      height: 14px;
      margin: 1.3rem -1.6rem -1.6rem;
      border-radius: 0 0 7px 7px;
      background: repeating-linear-gradient(90deg, var(--grass-a) 0 3px, var(--grass-b) 3px 5px, #17301f 5px 9px);
      box-shadow: inset 0 3px 4px rgba(0, 0, 0, 0.35);
    }

    .empty-graveyard,
    .no-match {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem 1rem;
      font-family: var(--serif);
      font-style: italic;
      font-size: 1.15rem;
      color: var(--mist);
    }

    .no-match { display: none; }

    footer {
      margin-top: 5.5rem;
      text-align: center;
      font-size: 0.85rem;
      color: var(--dim);
    }

    footer strong { color: var(--marigold); font-weight: 600; }

    @media (max-width: 520px) {
      body { padding: 5rem 1rem 4rem; }
      .graveyard-grid { grid-template-columns: 1fr; }
    }

    @media (prefers-reduced-motion: reduce) {
      .flame { animation: none; }
      .tombstone { transition: none; }
      .tombstone:hover { transform: none; }
    }
  </style>
</head>
<body>
  <div class="papel" aria-hidden="true"></div>

  <header>
    <span class="graveyard-icon" aria-hidden="true">.</span>
    <h1>DevYard</h1>
    <p class="tagline">A cemetery for abandoned side projects</p>
    <div class="graveyard-meta">
      <span>Buried: <span class="meta-highlight">${totalDead} dead repos</span></span>
      <span>Threshold: <span class="meta-highlight">${daysThreshold}+ days</span></span>
      <span>Cataloged: <span class="meta-highlight">${escapeHtml(dateStr)}</span></span>
    </div>
    <div class="search-bar">
      <input type="text" id="projectSearch" placeholder="Search gravestones..." aria-label="Search gravestones">
    </div>
  </header>

  <main class="graveyard-grid" id="graveyardGrid">
    ${tombstoneCards || '<div class="empty-graveyard">No dead projects found in this yard. Every repo here has been committed to recently.</div>'}
    <div class="no-match" id="noMatch">No gravestones match that search.</div>
  </main>

  <footer>
    <p>Cataloged by <strong>devyard</strong> &bull; Generated locally with open-weight intelligence</p>
  </footer>

  <script>
    const searchInput = document.getElementById('projectSearch');
    const cards = document.querySelectorAll('.tombstone');
    const noMatch = document.getElementById('noMatch');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        let visible = 0;
        cards.forEach(card => {
          const name = (card.getAttribute('data-name') || '').toLowerCase();
          const text = card.textContent.toLowerCase();
          const show = !query || name.includes(query) || text.includes(query);
          card.style.display = show ? '' : 'none';
          if (show) visible++;
        });
        if (noMatch && cards.length) {
          noMatch.style.display = visible === 0 ? 'block' : 'none';
        }
      });
    }
  </script>
</body>
</html>`;
}
