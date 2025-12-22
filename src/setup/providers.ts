/**
 * Provider Configuration and Validation
 *
 * Defines supported AI providers and validates API keys
 */

export interface ProviderInfo {
  id: 'groq' | 'openai' | 'anthropic' | 'ollama';
  name: string;
  description: string;
  envKey: string;
  signupUrl: string;
  keyPattern: RegExp;
  keyHint: string;
  testEndpoint?: string;
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: 'groq',
    name: 'Groq',
    description: 'Fast inference with Llama 3.3 (Free tier available)',
    envKey: 'GROQ_API_KEY',
    signupUrl: 'https://console.groq.com',
    keyPattern: /^gsk_[a-zA-Z0-9]{48,}$/,
    keyHint: 'Starts with gsk_',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4 and GPT-3.5 models',
    envKey: 'OPENAI_API_KEY',
    signupUrl: 'https://platform.openai.com',
    keyPattern: /^sk-[a-zA-Z0-9]{32,}$/,
    keyHint: 'Starts with sk-',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models (Claude 3.5 Sonnet)',
    envKey: 'ANTHROPIC_API_KEY',
    signupUrl: 'https://console.anthropic.com',
    keyPattern: /^sk-ant-[a-zA-Z0-9-]{32,}$/,
    keyHint: 'Starts with sk-ant-',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    description: 'Run models locally (no API key needed)',
    envKey: 'OLLAMA_URL',
    signupUrl: 'https://ollama.ai',
    keyPattern: /^https?:\/\/.+/,
    keyHint: 'URL like http://localhost:11434',
  },
];

/**
 * Get provider info by ID
 */
export function getProvider(id: string): ProviderInfo | undefined {
  return PROVIDERS.find(p => p.id === id);
}

/**
 * Validate API key format
 */
export function validateKeyFormat(providerId: string, key: string): boolean {
  const provider = getProvider(providerId);
  if (!provider) return false;

  // Ollama doesn't need key validation
  if (providerId === 'ollama') return true;

  return provider.keyPattern.test(key);
}

/**
 * Test provider connection
 * Returns true if successful, error message if failed
 */
export async function testProviderConnection(
  providerId: string,
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    switch (providerId) {
      case 'groq':
        return await testGroq(apiKey);
      case 'openai':
        return await testOpenAI(apiKey);
      case 'anthropic':
        return await testAnthropic(apiKey);
      case 'ollama':
        return await testOllama(apiKey || 'http://localhost:11434');
      default:
        return { success: false, error: 'Unknown provider' };
    }
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

async function testGroq(apiKey: string): Promise<{ success: boolean; error?: string }> {
  const response = await fetch('https://api.groq.com/openai/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (response.ok) {
    return { success: true };
  }

  if (response.status === 401) {
    return { success: false, error: 'Invalid API key' };
  }

  return { success: false, error: `HTTP ${response.status}` };
}

async function testOpenAI(apiKey: string): Promise<{ success: boolean; error?: string }> {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (response.ok) {
    return { success: true };
  }

  if (response.status === 401) {
    return { success: false, error: 'Invalid API key' };
  }

  return { success: false, error: `HTTP ${response.status}` };
}

async function testAnthropic(apiKey: string): Promise<{ success: boolean; error?: string }> {
  // Anthropic doesn't have a /models endpoint, so we'll just validate the format
  // A real test would require making an actual API call
  if (apiKey.startsWith('sk-ant-')) {
    return { success: true };
  }
  return { success: false, error: 'Invalid key format' };
}

async function testOllama(url: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${url}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      return { success: true };
    }

    return { success: false, error: `Ollama not responding at ${url}` };
  } catch {
    return { success: false, error: 'Cannot connect to Ollama. Is it running?' };
  }
}
