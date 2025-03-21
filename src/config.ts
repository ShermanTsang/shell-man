import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import prompts from 'prompts';
import type { ShellManConfig } from './types';
import { API_PROVIDERS, PROVIDER_MODELS, DEFAULT_CONFIG } from './types';

/**
 * Get the path to the shell-man config directory
 */
export function getConfigDir(): string {
  const userHomeDir = os.homedir();
  return path.join(userHomeDir, '.shell-man');
}

/**
 * Get the path to the shell-man config file
 */
export function getConfigPath(): string {
  return path.join(getConfigDir(), 'config.json');
}

/**
 * Check if config file exists
 */
export function configExists(): boolean {
  return fs.existsSync(getConfigPath());
}

/**
 * Ensure the config directory exists
 */
export function ensureConfigDir(): void {
  const configDir = getConfigDir();
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
}

/**
 * Read config from file
 */
export function readConfig(): ShellManConfig | null {
  try {
    if (!configExists()) {
      return null;
    }
    
    const configData = fs.readFileSync(getConfigPath(), 'utf8');
    return JSON.parse(configData) as ShellManConfig;
  } catch (error) {
    console.error('Error reading config:', error);
    return null;
  }
}

/**
 * Write config to file
 */
export function writeConfig(config: ShellManConfig): boolean {
  try {
    ensureConfigDir();
    fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing config:', error);
    return false;
  }
}

/**
 * Validate config and return missing required fields
 */
export function validateConfig(config: Partial<ShellManConfig>): string[] {
  const missingFields: string[] = [];
  
  if (!config.API_KEY) missingFields.push('API_KEY');
  if (!config.API_PROVIDER) missingFields.push('API_PROVIDER');
  if (!config.API_MODEL) missingFields.push('API_MODEL');
  if (config.HISTORY_ENABLE === undefined) missingFields.push('HISTORY_ENABLE');
  
  return missingFields;
}

/**
 * Prompt for API key
 */
async function promptForApiKey(): Promise<string> {
  console.log('\n=== Configuration Setup ===');
  console.log('API Key is required for authentication');
  
  try {
    const response = await prompts({
      type: 'password',
      name: 'apiKey',
      message: 'Enter your API key:',
      validate: value => value.length > 0 ? true : 'API key is required',
    });
    
    return response.apiKey || '';
  } catch (error) {
    console.log('API key input was interrupted. Using empty value.');
    return '';
  }
}

/**
 * Prompt for API provider
 */
async function promptForApiProvider(): Promise<string> {
  console.log('\nSelect an API provider from the list:');
  
  try {
    const response = await prompts({
      type: 'select',
      name: 'provider',
      message: 'Select your API provider:',
      choices: API_PROVIDERS.map(provider => ({
        title: provider,
        value: provider,
      })),
    });
    
    if (!response.provider) {
      console.log('Provider selection was interrupted. Using default: openai');
      return 'openai';
    }
    
    return response.provider;
  } catch (error) {
    console.log('Provider selection was interrupted. Using default: openai');
    return 'openai';
  }
}

/**
 * Prompt for API model based on selected provider
 */
async function promptForApiModel(provider: string): Promise<string> {
  const models = PROVIDER_MODELS[provider] || [];
  console.log(`\nSelect a model for ${provider}:`);
  
  const defaultModel = models[0] || '';
  
  try {
    const response = await prompts({
      type: 'select',
      name: 'model',
      message: 'Select your API model:',
      choices: models.map(model => ({
        title: model,
        value: model,
      })),
    });
    
    if (!response.model) {
      console.log(`Model selection was interrupted. Using default: ${defaultModel}`);
      return defaultModel;
    }
    
    return response.model;
  } catch (error) {
    console.log(`Model selection was interrupted. Using default: ${defaultModel}`);
    return defaultModel;
  }
}

/**
 * Prompt for custom endpoint (optional)
 */
async function promptForCustomEndpoint(): Promise<string | undefined> {
  console.log('\nCustom API endpoint (optional):');
  
  try {
    const response = await prompts({
      type: 'text',
      name: 'endpoint',
      message: 'Enter custom API endpoint (leave empty to skip):',
    });
    
    return response.endpoint || undefined;
  } catch (error) {
    console.log('Custom endpoint input was interrupted.');
    return undefined;
  }
}

/**
 * Prompt for history enable
 */
async function promptForHistoryEnable(): Promise<boolean> {
  console.log('\nEnable command history?');
  
  try {
    const response = await prompts({
      type: 'confirm',
      name: 'historyEnable',
      message: 'Enable command history?',
      initial: true,
    });
    
    if (response.historyEnable === undefined) {
      console.log('History enable selection was interrupted. Using default: true');
      return true;
    }
    
    return response.historyEnable;
  } catch (error) {
    console.log('History enable selection was interrupted. Using default: true');
    return true;
  }
}

/**
 * Prompt for all missing config options
 */
export async function promptForMissingConfig(partialConfig: Partial<ShellManConfig> = {}): Promise<ShellManConfig> {
  console.log('\nSetting up shell-man configuration...');
  console.log('Please provide the following information:');
  
  const config = { ...DEFAULT_CONFIG, ...partialConfig };
  
  try {
    // Always prompt for API key if it's missing
    if (!config.API_KEY) {
      config.API_KEY = await promptForApiKey();
    }
    
    // Prompt for API provider if it's missing
    if (!config.API_PROVIDER) {
      config.API_PROVIDER = await promptForApiProvider();
    }
    
    // Prompt for API model based on provider
    config.API_MODEL = await promptForApiModel(config.API_PROVIDER);
    
    // Prompt for custom endpoint (optional)
    const customEndpoint = await promptForCustomEndpoint();
    if (customEndpoint) {
      config.API_CUSTOM_ENDPOINT = customEndpoint;
    }
    
    // Prompt for history enable
    config.HISTORY_ENABLE = await promptForHistoryEnable();
    
    console.log('\nConfiguration complete!');
    return config as ShellManConfig;
  } catch (error) {
    console.error('\nAn error occurred during configuration setup:', error);
    console.log('Using default values for remaining fields...');
    return config as ShellManConfig;
  }
}

/**
 * Initialize config
 * - Checks if config exists
 * - If not, creates it with defaults in non-interactive mode or prompts in interactive mode
 * - Returns the config
 */
export async function initConfig(nonInteractive = false): Promise<ShellManConfig> {
  try {
    // First check if config directory exists
    ensureConfigDir();
    
    // Then check if config file exists
    let config = readConfig();
    
    if (!config) {
      if (nonInteractive) {
        // In non-interactive mode, use defaults
        config = { ...DEFAULT_CONFIG };
        const success = writeConfig(config);
        if (success) {
          console.log(`Default configuration saved to ${getConfigPath()}`);
        } else {
          console.error(`Failed to write configuration to ${getConfigPath()}`);
        }
      } else {
        // In interactive mode, prompt for config
        try {
          config = await promptForMissingConfig();
          const success = writeConfig(config);
          if (success) {
            console.log(`Configuration saved to ${getConfigPath()}`);
          } else {
            console.error(`Failed to write configuration to ${getConfigPath()}`);
          }
        } catch (error) {
          console.error('Error during prompting:', error);
          // Fall back to defaults if prompting fails
          config = { ...DEFAULT_CONFIG };
          writeConfig(config);
        }
      }
    } else {
      // Check for missing required fields
      const missingFields = validateConfig(config);
      
      if (missingFields.length > 0) {
        if (nonInteractive) {
          // Fill missing fields with defaults
          for (const field of missingFields) {
            (config as any)[field] = (DEFAULT_CONFIG as any)[field];
          }
          const success = writeConfig(config);
          if (success) {
            console.log(`Configuration updated with defaults in ${getConfigPath()}`);
          }
        } else {
          // In interactive mode, prompt for missing fields
          try {
            console.log('Some required configuration options are missing.');
            config = await promptForMissingConfig(config);
            const success = writeConfig(config);
            if (success) {
              console.log(`Configuration updated in ${getConfigPath()}`);
            }
          } catch (error) {
            console.error('Error during prompting:', error);
            // Fall back to defaults for missing fields
            for (const field of missingFields) {
              (config as any)[field] = (DEFAULT_CONFIG as any)[field];
            }
            writeConfig(config);
          }
        }
      }
    }
    
    return config;
  } catch (error) {
    console.error('Error initializing configuration:', error);
    // Return default config as a fallback
    return { ...DEFAULT_CONFIG };
  }
}
