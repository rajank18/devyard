// Minimal ANSI colors with NO_COLOR and TTY detection

const enabled = !process.env.NO_COLOR && (process.stdout.isTTY || process.env.FORCE_COLOR);

function wrap(start, end) {
  return (str = '') => (enabled ? `${start}${str}${end}` : String(str));
}

export const colors = {
  reset: enabled ? '\x1b[0m' : '',
  bold: wrap('\x1b[1m', '\x1b[22m'),
  dim: wrap('\x1b[2m', '\x1b[22m'),
  italic: wrap('\x1b[3m', '\x1b[23m'),
  underline: wrap('\x1b[4m', '\x1b[24m'),
  
  // Custom theme colors
  marigold: wrap('\x1b[38;2;255;158;0m', '\x1b[39m'),
  candle: wrap('\x1b[38;2;255;191;0m', '\x1b[39m'),
  ember: wrap('\x1b[38;2;255;94;0m', '\x1b[39m'),
  stone: wrap('\x1b[38;2;160;160;175m', '\x1b[39m'),
  darkStone: wrap('\x1b[38;2;90;90;105m', '\x1b[39m'),
  
  // Standard colors
  red: wrap('\x1b[31m', '\x1b[39m'),
  green: wrap('\x1b[32m', '\x1b[39m'),
  yellow: wrap('\x1b[33m', '\x1b[39m'),
  cyan: wrap('\x1b[36m', '\x1b[39m'),
  gray: wrap('\x1b[90m', '\x1b[39m'),
  white: wrap('\x1b[37m', '\x1b[39m')
};

export default colors;
