import { run } from './cli/index.js';
import { config } from 'dotenv';
import { closeDb } from './db/index.js';
import chalk from 'chalk';

// Load environment variables
config();

// Show deprecation notice
console.log('');
console.log(chalk.yellow('  DEPRECATION NOTICE'));
console.log(chalk.yellow('  =================='));
console.log(chalk.dim('  This legacy CLI will be removed in a future version.'));
console.log(chalk.dim('  Please use the primary TUI entry point instead:'));
console.log('');
console.log(chalk.cyan('    npm run dev        ') + chalk.dim('# Development mode'));
console.log(chalk.cyan('    npm start          ') + chalk.dim('# Production mode'));
console.log(chalk.cyan('    npx devfolio       ') + chalk.dim('# If installed globally'));
console.log('');
console.log(chalk.dim('  The new TUI has:'));
console.log(chalk.dim('    - Setup wizard for API keys'));
console.log(chalk.dim('    - Multiple AI provider support (Groq, OpenAI, Anthropic)'));
console.log(chalk.dim('    - Improved UI with React/Ink components'));
console.log(chalk.dim('    - Offline data caching'));
console.log('');
console.log(chalk.dim('  Continuing with legacy CLI in 3 seconds...'));
console.log('');

// Give user time to read the notice
await new Promise(resolve => setTimeout(resolve, 3000));

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

// Run the app
run().catch((error) => {
  console.error('Fatal error:', error);
  closeDb();
  process.exit(1);
});
