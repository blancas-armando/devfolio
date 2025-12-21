/**
 * DevFolio - Ink TUI Entry Point
 *
 * New React/Ink-based terminal user interface.
 */

import React from 'react';
import { render } from 'ink';
import { config } from 'dotenv';
import { closeDb } from './db/index.js';
import { App } from './app/App.js';

// Load environment variables
config();

// Check for interactive terminal
if (!process.stdin.isTTY) {
  console.error('DevFolio requires an interactive terminal.');
  console.error('Please run this command in a terminal that supports TTY mode.');
  process.exit(1);
}

// Check for API key
if (!process.env.GROQ_API_KEY) {
  console.error('Error: GROQ_API_KEY environment variable is required');
  console.error('Get your API key at https://console.groq.com');
  console.error('Then set it: export GROQ_API_KEY=your_key_here');
  process.exit(1);
}

// Handle cleanup
process.on('exit', () => {
  closeDb();
});

process.on('SIGINT', () => {
  closeDb();
  process.exit(0);
});

// Render the Ink app
const { waitUntilExit } = render(<App />);

// Wait for exit
waitUntilExit().then(() => {
  closeDb();
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  closeDb();
  process.exit(1);
});
