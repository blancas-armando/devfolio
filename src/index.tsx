import { render } from 'ink';
import { App } from './app.js';
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

// Render the app
const { waitUntilExit } = render(<App />);

// Cleanup on exit
waitUntilExit().then(() => {
  closeDb();
  process.exit(0);
});
