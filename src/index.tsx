import { run } from './app.js';
import { config } from 'dotenv';
import { closeDb } from './db/index.js';

// Load environment variables
config();

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
