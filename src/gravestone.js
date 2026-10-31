import colors from './colors.js';

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

function wrapText(text, maxWidth) {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if (currentLine.length + 1 + word.length <= maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

export function renderGravestone({
  name,
  birthDate,
  deathDate,
  daysSinceLastCommit,
  epitaph = [],
  causeOfDeath = ''
}) {
  const WIDTH = 62;
  const innerWidth = WIDTH - 4; // space inside `|  ...  |`

  const bDate = formatDate(birthDate);
  const dDate = formatDate(deathDate);
  const ageStr = daysSinceLastCommit !== null && daysSinceLastCommit !== undefined
    ? ` (${daysSinceLastCommit} days dormant)`
    : '';

  const formatLine = (text) => {
    const rawLen = text.length;
    const padding = ' '.repeat(Math.max(0, innerWidth - rawLen));
    return `${colors.stone('│')}  ${text}${padding}  ${colors.stone('│')}`;
  };

  const hr = `${colors.stone('├' + '─'.repeat(WIDTH - 2) + '┤')}`;
  const topArch = `        ${colors.stone('.-' + '─'.repeat(WIDTH - 18) + '-.')}`;
  const roof = `      ${colors.stone('/')}${colors.marigold('          ✝  R. I. P.  ✝          ')}${colors.stone('\\')}`;
  const topWall = `    ${colors.stone('┌─' + '─'.repeat(WIDTH - 6) + '─┐')}`;
  const base = `${colors.candle(' ~*~')} ${colors.stone('└──' + '─'.repeat(WIDTH - 8) + '──┘')} ${colors.candle('~*~ ')}`;

  const lines = [];
  lines.push('');
  lines.push(topArch);
  lines.push(roof);
  lines.push(topWall);

  // Name header
  const nameLine = `${colors.bold(colors.marigold('PROJECT: ' + name))}`;
  // For padding calculation, strip ANSI from name
  const namePadding = ' '.repeat(Math.max(0, innerWidth - ('PROJECT: ' + name).length));
  lines.push(`${colors.stone('│')}  ${nameLine}${namePadding}  ${colors.stone('│')}`);

  // Dates
  const datesPlain = `Born: ${bDate}   ✝   Died: ${dDate}${ageStr}`;
  const datesFormatted = `${colors.stone('Born: ')}${colors.candle(bDate)}   ${colors.ember('✝')}   ${colors.stone('Died: ')}${colors.candle(dDate)}${colors.dim(ageStr)}`;
  const datesPadding = ' '.repeat(Math.max(0, innerWidth - datesPlain.length));
  lines.push(`${colors.stone('│')}  ${datesFormatted}${datesPadding}  ${colors.stone('│')}`);

  lines.push(hr);

  // Epitaph
  const epitaphLines = Array.isArray(epitaph) ? epitaph : [epitaph];
  for (const rawLine of epitaphLines) {
    const wrapped = wrapText(String(rawLine), innerWidth - 4);
    for (const w of wrapped) {
      const formatted = `"${colors.italic(colors.white(w))}"`;
      const pad = ' '.repeat(Math.max(0, innerWidth - (w.length + 2)));
      lines.push(`${colors.stone('│')}  ${formatted}${pad}  ${colors.stone('│')}`);
    }
  }

  lines.push(hr);

  // Cause of Death
  lines.push(formatLine(`${colors.bold(colors.ember('Cause of Death:'))}`));
  const wrappedCause = wrapText(causeOfDeath, innerWidth - 2);
  for (const w of wrappedCause) {
    const formatted = `${colors.white(w)}`;
    const pad = ' '.repeat(Math.max(0, innerWidth - w.length));
    lines.push(`${colors.stone('│')}  ${formatted}${pad}  ${colors.stone('│')}`);
  }

  lines.push(base);
  lines.push('');

  return lines.join('\n');
}

export function renderResurrection({
  name,
  deathDate,
  whereLeftOff,
  whyStopped,
  smallestNextStep
}) {
  const dDate = formatDate(deathDate);
  const out = [];

  out.push('');
  out.push(`${colors.candle('✦ ─────────')} ${colors.bold(colors.marigold('RESURRECTION PLAN: ' + name))} ${colors.candle('───────── ✦')}`);
  out.push(`${colors.dim(`Dormant since ${dDate}`)}`);
  out.push('');
  out.push(`${colors.bold(colors.candle('1. Where you left off:'))}`);
  out.push(`   ${whereLeftOff}`);
  out.push('');
  out.push(`${colors.bold(colors.ember('2. Why you probably stopped:'))}`);
  out.push(`   ${whyStopped}`);
  out.push('');
  out.push(`${colors.bold(colors.green('3. Smallest next step to revive:'))}`);
  out.push(`   ${colors.bold(smallestNextStep)}`);
  out.push('');
  out.push(`${colors.dim('─'.repeat(55))}`);
  out.push('');

  return out.join('\n');
}
