/**
 * DevFolio - Ink TUI Entry Point
 *
 * React/Ink-based terminal user interface with setup wizard.
 */

import React, { useState, useCallback } from 'react';
import { render } from 'ink';
import { config } from 'dotenv';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';
import { closeDb } from './db/index.js';
import { App } from './app/App.js';
import { SetupWizard } from './setup/SetupWizard.js';

// Load environment variables from system and user config
function loadEnv(): void {
  // Load from ~/.devfolio/.env first (user config)
  const userEnvPath = join(homedir(), '.devfolio', '.env');
  if (existsSync(userEnvPath)) {
    config({ path: userEnvPath });
  }
  // Then load from current directory .env (overrides)
  config();
}

// Check if any AI provider is configured
function hasAnyApiKey(): boolean {
  return !!(
    process.env.GROQ_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY
  );
}

// Load initial environment
loadEnv();

// Check for interactive terminal
if (!process.stdin.isTTY) {
  console.error('DevFolio requires an interactive terminal.');
  console.error('Please run this command in a terminal that supports TTY mode.');
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

/**
 * Entry component that handles setup flow
 */
function EntryPoint(): React.ReactElement {
  const [showWizard, setShowWizard] = useState(!hasAnyApiKey());
  const [key, setKey] = useState(0);

  const handleComplete = useCallback(() => {
    // Reload environment after setup
    loadEnv();
    // Force re-render by changing key
    setKey(k => k + 1);
    setShowWizard(false);
  }, []);

  const handleSkip = useCallback(() => {
    console.log('\nNo API key configured. Some features will be unavailable.');
    console.log('Run "setup" command later to configure an AI provider.\n');
    setShowWizard(false);
  }, []);

  if (showWizard) {
    return <SetupWizard onComplete={handleComplete} onSkip={handleSkip} />;
  }

  return <App key={key} />;
}

// Render the Ink app
const { waitUntilExit } = render(<EntryPoint />);

// Wait for exit
waitUntilExit().then(() => {
  closeDb();
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  closeDb();
  process.exit(1);
});
