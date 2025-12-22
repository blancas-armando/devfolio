/**
 * Setup Wizard Component
 *
 * Interactive multi-step wizard for configuring DevFolio
 */

import React, { useState, useEffect } from 'react';
import { Box as InkBox, Text, useInput, useApp } from 'ink';
import { borders } from '../design/borders.js';
import { palette } from '../design/tokens.js';
import { PROVIDERS, testProviderConnection, validateKeyFormat } from './providers.js';
import { setEnvKey, getEnvPath } from './envWriter.js';

type WizardStep = 'welcome' | 'provider' | 'apikey' | 'testing' | 'complete' | 'error';

interface SetupWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function SetupWizard({ onComplete, onSkip }: SetupWizardProps): React.ReactElement {
  const { exit } = useApp();
  const [step, setStep] = useState<WizardStep>('welcome');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const width = 60;
  const line = borders.horizontal.repeat(width - 2);

  useInput((input, key) => {
    if (step === 'welcome') {
      if (key.return) {
        setStep('provider');
      } else if (input === 'q' || key.escape) {
        exit();
      } else if (input === 's') {
        onSkip();
      }
    } else if (step === 'provider') {
      if (key.upArrow) {
        setSelectedIndex(i => Math.max(0, i - 1));
      } else if (key.downArrow) {
        setSelectedIndex(i => Math.min(PROVIDERS.length - 1, i + 1));
      } else if (key.return) {
        const provider = PROVIDERS[selectedIndex];
        setSelectedProvider(provider.id);
        if (provider.id === 'ollama') {
          setApiKey('http://localhost:11434');
        }
        setStep('apikey');
      } else if (key.escape) {
        setStep('welcome');
      }
    } else if (step === 'apikey') {
      if (key.return && apiKey.length > 0) {
        handleTestConnection();
      } else if (key.escape) {
        setApiKey('');
        setStep('provider');
      } else if (key.backspace || key.delete) {
        setApiKey(k => k.slice(0, -1));
      } else if (input && !key.ctrl && !key.meta) {
        setApiKey(k => k + input);
      }
    } else if (step === 'complete') {
      if (key.return) {
        onComplete();
      }
    } else if (step === 'error') {
      if (key.return) {
        setError(null);
        setStep('apikey');
      } else if (key.escape) {
        setError(null);
        setStep('provider');
      }
    }
  });

  async function handleTestConnection() {
    if (!selectedProvider) return;

    // Validate format first
    if (!validateKeyFormat(selectedProvider, apiKey)) {
      const provider = PROVIDERS.find(p => p.id === selectedProvider);
      setError(`Invalid key format. ${provider?.keyHint || ''}`);
      setStep('error');
      return;
    }

    setStep('testing');
    setTesting(true);

    const result = await testProviderConnection(selectedProvider, apiKey);

    if (result.success) {
      // Save the key
      const provider = PROVIDERS.find(p => p.id === selectedProvider);
      if (provider) {
        setEnvKey(provider.envKey, apiKey);
      }
      setStep('complete');
    } else {
      setError(result.error || 'Connection failed');
      setStep('error');
    }

    setTesting(false);
  }

  // Welcome Step
  if (step === 'welcome') {
    return (
      <InkBox flexDirection="column" marginY={1}>
        <Text color={palette.border}>{borders.topLeft}{line}{borders.topRight}</Text>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <Text> </Text>
          <Text bold color={palette.accent}>DevFolio Setup</Text>
        </InkBox>
        <Text color={palette.border}>{borders.leftTee}{line}{borders.rightTee}</Text>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <Text>  Welcome! Let's configure your AI provider.      </Text>
          <Text color={palette.border}>{borders.vertical}</Text>
        </InkBox>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <Text>                                                    </Text>
          <Text color={palette.border}>{borders.vertical}</Text>
        </InkBox>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <Text>  DevFolio uses AI for market analysis, research,  </Text>
          <Text color={palette.border}>{borders.vertical}</Text>
        </InkBox>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <Text>  and natural language queries. You'll need an     </Text>
          <Text color={palette.border}>{borders.vertical}</Text>
        </InkBox>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <Text>  API key from one of the supported providers.     </Text>
          <Text color={palette.border}>{borders.vertical}</Text>
        </InkBox>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <Text>                                                    </Text>
          <Text color={palette.border}>{borders.vertical}</Text>
        </InkBox>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <Text>  </Text>
          <Text color={palette.positive}>Groq offers a free tier</Text>
          <Text> - recommended to start! </Text>
          <Text color={palette.border}>{borders.vertical}</Text>
        </InkBox>
        <Text color={palette.border}>{borders.leftTee}{line}{borders.rightTee}</Text>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <Text>  </Text>
          <Text color={palette.info}>[Enter]</Text>
          <Text> Continue  </Text>
          <Text color={palette.textTertiary}>[s]</Text>
          <Text> Skip  </Text>
          <Text color={palette.textTertiary}>[q]</Text>
          <Text> Quit                </Text>
          <Text color={palette.border}>{borders.vertical}</Text>
        </InkBox>
        <Text color={palette.border}>{borders.bottomLeft}{line}{borders.bottomRight}</Text>
      </InkBox>
    );
  }

  // Provider Selection Step
  if (step === 'provider') {
    return (
      <InkBox flexDirection="column" marginY={1}>
        <Text color={palette.border}>{borders.topLeft}{line}{borders.topRight}</Text>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <Text> </Text>
          <Text bold color={palette.accent}>Select AI Provider</Text>
        </InkBox>
        <Text color={palette.border}>{borders.leftTee}{line}{borders.rightTee}</Text>
        {PROVIDERS.map((provider, i) => (
          <InkBox key={provider.id}>
            <Text color={palette.border}>{borders.vertical}</Text>
            <Text>  </Text>
            <Text color={i === selectedIndex ? palette.accent : palette.text}>
              {i === selectedIndex ? '> ' : '  '}
              {provider.name}
            </Text>
            <Text color={palette.textTertiary}>
              {' '.repeat(Math.max(0, 14 - provider.name.length))}
              {provider.description.substring(0, 35)}
            </Text>
          </InkBox>
        ))}
        <Text color={palette.border}>{borders.leftTee}{line}{borders.rightTee}</Text>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <Text>  </Text>
          <Text color={palette.textTertiary}>Use arrow keys to select, Enter to confirm</Text>
        </InkBox>
        <Text color={palette.border}>{borders.bottomLeft}{line}{borders.bottomRight}</Text>
      </InkBox>
    );
  }

  // API Key Input Step
  if (step === 'apikey') {
    const provider = PROVIDERS.find(p => p.id === selectedProvider);
    const maskedKey = apiKey.length > 8
      ? apiKey.slice(0, 8) + '*'.repeat(apiKey.length - 8)
      : apiKey;

    return (
      <InkBox flexDirection="column" marginY={1}>
        <Text color={palette.border}>{borders.topLeft}{line}{borders.topRight}</Text>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <Text> </Text>
          <Text bold color={palette.accent}>Enter {provider?.name} API Key</Text>
        </InkBox>
        <Text color={palette.border}>{borders.leftTee}{line}{borders.rightTee}</Text>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <Text>  Get your key at: </Text>
          <Text color={palette.info}>{provider?.signupUrl}</Text>
        </InkBox>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <Text>  </Text>
          <Text color={palette.textTertiary}>{provider?.keyHint}</Text>
        </InkBox>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <Text>                                                    </Text>
          <Text color={palette.border}>{borders.vertical}</Text>
        </InkBox>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <Text>  Key: </Text>
          <Text color={palette.text}>{maskedKey || '_'}</Text>
          <Text color={palette.accent} bold>|</Text>
        </InkBox>
        <Text color={palette.border}>{borders.leftTee}{line}{borders.rightTee}</Text>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <Text>  </Text>
          <Text color={palette.info}>[Enter]</Text>
          <Text> Test connection  </Text>
          <Text color={palette.textTertiary}>[Esc]</Text>
          <Text> Back            </Text>
          <Text color={palette.border}>{borders.vertical}</Text>
        </InkBox>
        <Text color={palette.border}>{borders.bottomLeft}{line}{borders.bottomRight}</Text>
      </InkBox>
    );
  }

  // Testing Step
  if (step === 'testing') {
    return (
      <InkBox flexDirection="column" marginY={1}>
        <Text color={palette.border}>{borders.topLeft}{line}{borders.topRight}</Text>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <Text> </Text>
          <Text bold color={palette.info}>Testing Connection...</Text>
        </InkBox>
        <Text color={palette.border}>{borders.leftTee}{line}{borders.rightTee}</Text>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <Text>  </Text>
          <Text color={palette.textTertiary}>Verifying API key with provider...</Text>
        </InkBox>
        <Text color={palette.border}>{borders.bottomLeft}{line}{borders.bottomRight}</Text>
      </InkBox>
    );
  }

  // Error Step
  if (step === 'error') {
    return (
      <InkBox flexDirection="column" marginY={1}>
        <Text color={palette.border}>{borders.topLeft}{line}{borders.topRight}</Text>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <Text> </Text>
          <Text bold color={palette.negative}>Connection Failed</Text>
        </InkBox>
        <Text color={palette.border}>{borders.leftTee}{line}{borders.rightTee}</Text>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <Text>  </Text>
          <Text color={palette.negative}>{error}</Text>
        </InkBox>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <Text>                                                    </Text>
          <Text color={palette.border}>{borders.vertical}</Text>
        </InkBox>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <Text>  </Text>
          <Text color={palette.textTertiary}>Please check your API key and try again.</Text>
        </InkBox>
        <Text color={palette.border}>{borders.leftTee}{line}{borders.rightTee}</Text>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <Text>  </Text>
          <Text color={palette.info}>[Enter]</Text>
          <Text> Try again  </Text>
          <Text color={palette.textTertiary}>[Esc]</Text>
          <Text> Change provider       </Text>
          <Text color={palette.border}>{borders.vertical}</Text>
        </InkBox>
        <Text color={palette.border}>{borders.bottomLeft}{line}{borders.bottomRight}</Text>
      </InkBox>
    );
  }

  // Complete Step
  if (step === 'complete') {
    const provider = PROVIDERS.find(p => p.id === selectedProvider);
    return (
      <InkBox flexDirection="column" marginY={1}>
        <Text color={palette.border}>{borders.topLeft}{line}{borders.topRight}</Text>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <Text> </Text>
          <Text bold color={palette.positive}>Setup Complete!</Text>
        </InkBox>
        <Text color={palette.border}>{borders.leftTee}{line}{borders.rightTee}</Text>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <Text>  Provider: </Text>
          <Text color={palette.info}>{provider?.name}</Text>
        </InkBox>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <Text>  Config saved to: </Text>
          <Text color={palette.textTertiary}>{getEnvPath()}</Text>
        </InkBox>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <Text>                                                    </Text>
          <Text color={palette.border}>{borders.vertical}</Text>
        </InkBox>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <Text>  </Text>
          <Text color={palette.positive}>You're all set! Press Enter to start.</Text>
        </InkBox>
        <Text color={palette.border}>{borders.leftTee}{line}{borders.rightTee}</Text>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <Text>  </Text>
          <Text color={palette.info}>[Enter]</Text>
          <Text> Start DevFolio                          </Text>
          <Text color={palette.border}>{borders.vertical}</Text>
        </InkBox>
        <Text color={palette.border}>{borders.bottomLeft}{line}{borders.bottomRight}</Text>
      </InkBox>
    );
  }

  return <Text>Loading...</Text>;
}

export default SetupWizard;
