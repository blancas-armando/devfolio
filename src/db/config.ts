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

// ═══════════════════════════════════════════════════════════════════════════
// Tutorial Configuration Types
// ═══════════════════════════════════════════════════════════════════════════

export interface TutorialConfig {
  completed: boolean;            // Has the user completed the tutorial?
  skipped: boolean;              // Did the user skip the tutorial?
}

// ═══════════════════════════════════════════════════════════════════════════
// Indicator Configuration Types
// ═══════════════════════════════════════════════════════════════════════════

export interface IndicatorConfig {
  showMA20: boolean;             // Show 20-day moving average
  showMA50: boolean;             // Show 50-day moving average
  showMA200: boolean;            // Show 200-day moving average
  showRSI: boolean;              // Show RSI indicator
  rsiPeriod: number;             // RSI period (default: 14)
  showMACD: boolean;             // Show MACD indicator
  showBollingerBands: boolean;   // Show Bollinger Bands
  bbPeriod: number;              // Bollinger Bands period (default: 20)
  bbStdDev: number;              // Bollinger Bands std dev (default: 2)
  showVolume: boolean;           // Show volume analysis
}

// ═══════════════════════════════════════════════════════════════════════════
// Display Configuration Types
// ═══════════════════════════════════════════════════════════════════════════

export type ChartTimeframe = '1d' | '5d' | '1m' | '3m' | '6m' | '1y' | '5y';

export interface DisplayConfig {
  defaultChartTimeframe: ChartTimeframe;  // Default chart timeframe
  showDetailedProfile: boolean;           // Show full profile by default
  hintsEnabled: boolean;                  // Show contextual hints
  hintUsageCount: number;                 // Track hint usage for fading
}

export interface AppConfig {
  pulse: PulseConfig;
  tutorial: TutorialConfig;
  indicators: IndicatorConfig;
  display: DisplayConfig;
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

const DEFAULT_TUTORIAL_CONFIG: TutorialConfig = {
  completed: false,
  skipped: false,
};

const DEFAULT_INDICATOR_CONFIG: IndicatorConfig = {
  showMA20: true,
  showMA50: true,
  showMA200: false,
  showRSI: true,
  rsiPeriod: 14,
  showMACD: false,
  showBollingerBands: false,
  bbPeriod: 20,
  bbStdDev: 2,
  showVolume: true,
};

const DEFAULT_DISPLAY_CONFIG: DisplayConfig = {
  defaultChartTimeframe: '3m',
  showDetailedProfile: false,
  hintsEnabled: true,
  hintUsageCount: 0,
};

const DEFAULT_CONFIG: AppConfig = {
  pulse: DEFAULT_PULSE_CONFIG,
  tutorial: DEFAULT_TUTORIAL_CONFIG,
  indicators: DEFAULT_INDICATOR_CONFIG,
  display: DEFAULT_DISPLAY_CONFIG,
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
      tutorial: { ...DEFAULT_TUTORIAL_CONFIG, ...loaded.tutorial },
      indicators: { ...DEFAULT_INDICATOR_CONFIG, ...loaded.indicators },
      display: { ...DEFAULT_DISPLAY_CONFIG, ...loaded.display },
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

// ═══════════════════════════════════════════════════════════════════════════
// Tutorial Config Functions
// ═══════════════════════════════════════════════════════════════════════════

export function getTutorialConfig(): TutorialConfig {
  return getConfig().tutorial;
}

export function markTutorialComplete(): void {
  const config = getConfig();
  config.tutorial = { completed: true, skipped: false };
  saveConfig(config);
}

export function markTutorialSkipped(): void {
  const config = getConfig();
  config.tutorial = { completed: false, skipped: true };
  saveConfig(config);
}

export function resetTutorial(): void {
  const config = getConfig();
  config.tutorial = { ...DEFAULT_TUTORIAL_CONFIG };
  saveConfig(config);
}

// ═══════════════════════════════════════════════════════════════════════════
// Indicator Config Functions
// ═══════════════════════════════════════════════════════════════════════════

export function getIndicatorConfig(): IndicatorConfig {
  return getConfig().indicators;
}

export function updateIndicatorConfig(updates: Partial<IndicatorConfig>): IndicatorConfig {
  const config = getConfig();
  config.indicators = { ...config.indicators, ...updates };
  saveConfig(config);
  return config.indicators;
}

export function resetIndicatorConfig(): IndicatorConfig {
  const config = getConfig();
  config.indicators = { ...DEFAULT_INDICATOR_CONFIG };
  saveConfig(config);
  return config.indicators;
}

// ═══════════════════════════════════════════════════════════════════════════
// Display Config Functions
// ═══════════════════════════════════════════════════════════════════════════

export function getDisplayConfig(): DisplayConfig {
  return getConfig().display;
}

export function updateDisplayConfig(updates: Partial<DisplayConfig>): DisplayConfig {
  const config = getConfig();
  config.display = { ...config.display, ...updates };
  saveConfig(config);
  return config.display;
}

export function incrementHintUsage(): number {
  const config = getConfig();
  config.display.hintUsageCount += 1;
  saveConfig(config);
  return config.display.hintUsageCount;
}

export function resetDisplayConfig(): DisplayConfig {
  const config = getConfig();
  config.display = { ...DEFAULT_DISPLAY_CONFIG };
  saveConfig(config);
  return config.display;
}

// ═══════════════════════════════════════════════════════════════════════════
// First Run Detection
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if this is the first time running DevFolio
 * Returns true if no API keys are configured
 */
export function isFirstRun(): boolean {
  // Check if any API key environment variable is set
  return !(
    process.env.GROQ_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY
  );
}

/**
 * Check if setup has been completed (wizard run at least once)
 */
export function isSetupComplete(): boolean {
  const envPath = join(homedir(), '.devfolio', '.env');
  return existsSync(envPath);
}
