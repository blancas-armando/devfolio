/**
 * Interactive Tutorial
 * Guided first-run experience for new users
 */

import * as readline from 'readline';
import chalk from 'chalk';
import { drawBox } from './ui.js';
import { markTutorialComplete, markTutorialSkipped } from '../db/config.js';

// ═══════════════════════════════════════════════════════════════════════════
// Tutorial Step Definitions
// ═══════════════════════════════════════════════════════════════════════════

interface TutorialStep {
  title: string;
  description: string[];
  command: string | null;
  hint: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Welcome to DevFolio!',
    description: [
      'DevFolio is an AI-powered financial terminal for',
      'developers. Track stocks, options, and crypto - get',
      'AI insights - all from the command line.',
      '',
      'This quick tour will show you the essentials.',
    ],
    command: null,
    hint: 'Press Enter to continue, or type "skip" to skip',
  },
  {
    title: 'Step 1: Your Watchlist',
    description: [
      'Your watchlist tracks stocks you\'re interested in.',
      'It shows real-time prices, changes, and upcoming',
      'events like earnings dates and dividends.',
      '',
      'Let\'s take a look at your watchlist now.',
    ],
    command: 'w',
    hint: 'Type "w" and press Enter',
  },
  {
    title: 'Step 2: Stock Profiles',
    description: [
      'Use the "s" command with a ticker symbol to see',
      'company info, metrics, charts, and an AI quick take.',
      '',
      'Try different timeframes: s AAPL 1y, s AAPL 6m',
    ],
    command: 's AAPL',
    hint: 'Type "s AAPL" and press Enter',
  },
  {
    title: 'Step 3: Options Data',
    description: [
      'DevFolio includes full options chain support with',
      'Greeks (delta, gamma, theta, vega) calculated using',
      'Black-Scholes. See unusual activity and IV analysis.',
      '',
      'Let\'s check the options overview for a stock.',
    ],
    command: 'options AAPL',
    hint: 'Type "options AAPL" and press Enter',
  },
  {
    title: 'Step 4: Cryptocurrency',
    description: [
      'Track the top 50 cryptocurrencies with real-time',
      'prices from CoinGecko (free, no API key needed).',
      '',
      'Use "crypto" for the market overview, or "c BTC"',
      'for a specific coin profile.',
    ],
    command: 'crypto',
    hint: 'Type "crypto" and press Enter',
  },
  {
    title: 'Step 5: AI Chat',
    description: [
      'DevFolio understands natural language. Just type',
      'your question and the AI will help - with full',
      'context of your watchlist and portfolio.',
      '',
      'The AI remembers your conversation history!',
    ],
    command: 'what do you think about the market today?',
    hint: 'Type a question and press Enter',
  },
  {
    title: 'Step 6: Alerts',
    description: [
      'Set up proactive alerts for price drops, spikes,',
      'and upcoming earnings. DevFolio monitors in the',
      'background and notifies you of important events.',
      '',
      'Use "alerts" to view pending alerts.',
    ],
    command: 'alerts',
    hint: 'Type "alerts" and press Enter',
  },
  {
    title: 'You\'re Ready!',
    description: [
      'Here are more commands to explore:',
      '',
      '  b             AI market brief with analysis',
      '  r AAPL        AI research report',
      '  cs AAPL MSFT  Compare stocks with AI verdict',
      '  fin AAPL      Financial statements',
      '  live          10-second quote refresh mode',
      '  cost          View AI usage this session',
      '  help          See all commands',
      '',
      'Happy investing!',
    ],
    command: null,
    hint: 'Press Enter to start using DevFolio',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// Tutorial Display Helpers
// ═══════════════════════════════════════════════════════════════════════════

function displayTutorialStep(step: TutorialStep, stepNum: number, total: number): void {
  console.log('');

  // Progress indicator
  const progress = `Step ${stepNum} of ${total}`;
  const progressLine = chalk.dim(`[${progress}]`);
  console.log(progressLine);
  console.log('');

  // Step title
  console.log(chalk.bold.cyan(`  ${step.title}`));
  console.log('');

  // Description
  for (const line of step.description) {
    console.log(chalk.white(`  ${line}`));
  }
  console.log('');

  // Command hint
  if (step.command) {
    console.log(chalk.yellow(`  Try it: ${chalk.bold(step.command)}`));
  }
  console.log(chalk.dim(`  ${step.hint}`));
  console.log('');
}

function displayWelcomeArt(): void {
  console.log('');
  console.log(chalk.cyan('  ╔══════════════════════════════════════════════╗'));
  console.log(chalk.cyan('  ║') + chalk.bold.white('           Welcome to DevFolio!            ') + chalk.cyan('║'));
  console.log(chalk.cyan('  ║') + chalk.dim('       Your AI-Powered Financial Terminal     ') + chalk.cyan('║'));
  console.log(chalk.cyan('  ╚══════════════════════════════════════════════╝'));
  console.log('');
}

function displayTutorialComplete(): void {
  console.log('');
  console.log(chalk.green('  ✓ Tutorial complete!'));
  console.log(chalk.dim('    Type "help" anytime to see all commands.'));
  console.log(chalk.dim('    Type "tutorial" to run this again.'));
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Tutorial Function
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Prompt user if they want to run the tutorial
 * @returns true if user wants the tutorial
 */
export function promptForTutorial(): Promise<boolean> {
  return new Promise((resolve) => {
    displayWelcomeArt();

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(
      chalk.yellow('  Would you like a quick tour? ') + chalk.dim('(y/n) '),
      (answer) => {
        rl.close();
        const normalized = answer.toLowerCase().trim();
        resolve(normalized === 'y' || normalized === 'yes');
      }
    );
  });
}

/**
 * Run the interactive tutorial
 * @param executeCommand - Function to execute CLI commands
 */
export async function runTutorial(
  executeCommand: (cmd: string) => Promise<void>
): Promise<void> {
  // Show welcome art
  displayWelcomeArt();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let currentStep = 0;
  let skipped = false;

  const runStep = async (): Promise<void> => {
    if (currentStep >= TUTORIAL_STEPS.length) {
      rl.close();
      markTutorialComplete();
      displayTutorialComplete();
      return;
    }

    const step = TUTORIAL_STEPS[currentStep];
    displayTutorialStep(step, currentStep + 1, TUTORIAL_STEPS.length);

    return new Promise((resolve) => {
      rl.question(chalk.magenta('tutorial> '), async (input) => {
        const trimmed = input.trim().toLowerCase();

        // Handle skip
        if (trimmed === 'skip' || trimmed === 'q' || trimmed === 'quit') {
          rl.close();
          markTutorialSkipped();
          console.log('');
          console.log(chalk.dim('  Tutorial skipped. Type "tutorial" anytime to restart.'));
          console.log('');
          skipped = true;
          resolve();
          return;
        }

        // If step has a command, execute it
        if (step.command) {
          // Accept the expected command or enter to auto-run
          const shouldExecute = trimmed === '' ||
            trimmed === step.command.toLowerCase() ||
            trimmed === step.command.split(' ')[0].toLowerCase();

          if (shouldExecute) {
            try {
              await executeCommand(step.command);
            } catch {
              // Ignore errors during tutorial
            }
          }
        }

        currentStep++;
        resolve();
      });
    });
  };

  // Run all steps
  while (currentStep < TUTORIAL_STEPS.length && !skipped) {
    await runStep();
  }

  if (!skipped) {
    rl.close();
  }
}
