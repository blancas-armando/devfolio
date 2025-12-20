import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

// ═══════════════════════════════════════════════════════════════════════════
// Pulse Configuration Types
// ═══════════════════════════════════════════════════════════════════════════

export interface PulseConfig {
  indexDropThreshold: number;    // Alert when index drops this % (default: 2.0)
  indexRiseThreshold: number;    // Alert when index rises this % (default: 2.0)
  vixThreshold: number;          // Alert when VIX exceeds this (default: 20)
  moverThreshold: number;        // Show stocks moving more than this % (default: 5)
  showSectors: boolean;          // Show sector rotation (default: true)
  showIndicators: boolean;       // Show treasury, gold, oil, btc (default: true)
  topMoversCount: number;        // Number of movers to show (default: 5)
}

export interface AppConfig {
  pulse: PulseConfig;
}

// ═══════════════════════════════════════════════════════════════════════════
// Default Configuration
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_PULSE_CONFIG: PulseConfig = {
  indexDropThreshold: 2.0,
  indexRiseThreshold: 2.0,
  vixThreshold: 20,
  moverThreshold: 5,
  showSectors: true,
  showIndicators: true,
  topMoversCount: 5,
};

const DEFAULT_CONFIG: AppConfig = {
  pulse: DEFAULT_PULSE_CONFIG,
};

// ═══════════════════════════════════════════════════════════════════════════
// Config File Management
// ═══════════════════════════════════════════════════════════════════════════

function getConfigPath(): string {
  const dataDir = join(homedir(), '.devfolio');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  return join(dataDir, 'config.json');
}

export function getConfig(): AppConfig {
  const configPath = getConfigPath();

  if (!existsSync(configPath)) {
    // Create default config file
    saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    const loaded = JSON.parse(content) as Partial<AppConfig>;

    // Merge with defaults to ensure all fields exist
    return {
      pulse: { ...DEFAULT_PULSE_CONFIG, ...loaded.pulse },
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: AppConfig): void {
  const configPath = getConfigPath();
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export function getPulseConfig(): PulseConfig {
  return getConfig().pulse;
}

export function updatePulseConfig(updates: Partial<PulseConfig>): PulseConfig {
  const config = getConfig();
  config.pulse = { ...config.pulse, ...updates };
  saveConfig(config);
  return config.pulse;
}

export function resetPulseConfig(): PulseConfig {
  const config = getConfig();
  config.pulse = { ...DEFAULT_PULSE_CONFIG };
  saveConfig(config);
  return config.pulse;
}
