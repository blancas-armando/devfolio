/**
 * DevFolio Design System - ASCII Logo
 *
 * Branded ASCII art for the welcome screen.
 * Monochrome, no gradients - clean and professional.
 */

// Main DevFolio logo - block style
export const logoBlock = `
██████╗ ███████╗██╗   ██╗███████╗ ██████╗ ██╗     ██╗ ██████╗
██╔══██╗██╔════╝██║   ██║██╔════╝██╔═══██╗██║     ██║██╔═══██╗
██║  ██║█████╗  ██║   ██║█████╗  ██║   ██║██║     ██║██║   ██║
██║  ██║██╔══╝  ╚██╗ ██╔╝██╔══╝  ██║   ██║██║     ██║██║   ██║
██████╔╝███████╗ ╚████╔╝ ██║     ╚██████╔╝███████╗██║╚██████╔╝
╚═════╝ ╚══════╝  ╚═══╝  ╚═╝      ╚═════╝ ╚══════╝╚═╝ ╚═════╝
`.trim();

// Compact logo - smaller footprint
export const logoCompact = `
╔╦╗┌─┐┬  ┬╔═╗┌─┐┬  ┬┌─┐
 ║║├┤ └┐┌┘╠╣ │ ││  ││ │
═╩╝└─┘ └┘ ╚  └─┘┴─┘┴└─┘
`.trim();

// Minimal logo - single line
export const logoMinimal = '◆ DevFolio';

// Text-only tagline
export const tagline = 'Your AI-Powered Market Intelligence Terminal';

// Version display
export function getVersionString(version: string): string {
  return `v${version}`;
}

// Logo lines as array (for easier Ink rendering)
export const logoLines = logoBlock.split('\n');
export const logoCompactLines = logoCompact.split('\n');

// Logo dimensions
export const logoDimensions = {
  block: {
    width: 66,
    height: 6,
  },
  compact: {
    width: 24,
    height: 3,
  },
};

// Alternative decorative elements
export const decorative = {
  // Simple horizontal rule with accent
  rule: '─'.repeat(60),

  // Fancy divider
  divider: '═══════════════════════════════════════════════════════════',

  // Dotted divider
  dottedDivider: '· · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·',

  // Corner accents
  cornerTopLeft: '╭──',
  cornerTopRight: '──╮',
  cornerBottomLeft: '╰──',
  cornerBottomRight: '──╯',
};
