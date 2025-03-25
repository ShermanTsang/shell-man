import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import prompts from 'prompts'
import { logger } from '@shermant/logger'
import type { ShellManConfig } from './types'
import { API_PROVIDERS, DEFAULT_CONFIG, PROVIDER_MODELS } from './types'

/**
 * Get the path to the shell-man config directory
 */
export function getConfigDir(): string {
  const userHomeDir = os.homedir()
  return path.join(userHomeDir, '.shell-man')
}

/**
 * Get the path to the shell-man config file
 */
export function getConfigPath(): string {
  return path.join(getConfigDir(), 'config.json')
}

/**
 * Check if config file exists
 */
export function configExists(): boolean {
  return fs.existsSync(getConfigPath())
}

/**
 * Ensure the config directory exists
 */
export function ensureConfigDir(): void {
  const configDir = getConfigDir()
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true })
  }
}

/**
 * Read config from file
 */
export function readConfig(): ShellManConfig | null {
  const configPath = getConfigPath()
  try {
    const configData = fs.readFileSync(configPath, 'utf-8')
    return JSON.parse(configData) as ShellManConfig
  }
  catch (error) {
    logger.error.tag('Config Read').data(error).message('Error reading configuration file').appendDivider().print()
    return null
  }
}

/**
 * Write config to file
 */
export function writeConfig(config: ShellManConfig): boolean {
  ensureConfigDir()
  const configPath = getConfigPath()
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
    return true
  }
  catch (error) {
    logger.error.tag('Config Write').data(error).message('Error writing configuration file').appendDivider().print()
    return false
  }
}

/**
 * Validate config and return missing required fields
 */
export function validateConfig(config: Partial<ShellManConfig>): string[] {
  const missingFields: string[] = []

  if (!config.API_KEY)
    missingFields.push('API_KEY')
  if (!config.API_PROVIDER)
    missingFields.push('API_PROVIDER')
  if (!config.API_MODEL)
    missingFields.push('API_MODEL')
  if (config.HISTORY_ENABLE === undefined)
    missingFields.push('HISTORY_ENABLE')

  return missingFields
}

/**
 * Prompt for API key
 */
async function promptForApiKey(): Promise<string> {
  logger.info.tag('Config Setup').data('').message('Configuration setup has started').appendDivider().print()
  logger.info.tag('API Key').data('').message('API Key is required for authentication').appendDivider().print()

  try {
    const response = await prompts({
      type: 'password',
      name: 'apiKey',
      message: 'Enter your API key:',
      validate: value => (value.length > 0 ? true : 'API key is required'),
    })

    return response.apiKey || ''
  }
  catch (error) {
    logger.info.tag('API Key').data('').message('API key input was interrupted. Using empty value.').appendDivider().print()
    return ''
  }
}

/**
 * Prompt for API provider
 */
async function promptForApiProvider(): Promise<string> {
  logger.info.tag('API Provider').data('').message('Select an API provider from the list').appendDivider().print()

  try {
    const response = await prompts({
      type: 'select',
      name: 'provider',
      message: 'Select your API provider:',
      choices: API_PROVIDERS.map(provider => ({
        title: provider,
        value: provider,
      })),
    })

    if (!response.provider) {
      logger.info.tag('API Provider').data('Using default: openai').message('Provider selection was interrupted').appendDivider().print()
      return 'openai'
    }

    return response.provider
  }
  catch (error) {
    logger.info.tag('API Provider').data('Using default: openai').message('Provider selection was interrupted').appendDivider().print()
    return 'openai'
  }
}

/**
 * Prompt for API model based on selected provider
 */
async function promptForApiModel(provider: string): Promise<string> {
  const models = PROVIDER_MODELS[provider] || []
  logger.info.tag('API Model').data(models).message(`Select a model for ${provider}`).appendDivider().print()

  const defaultModel = models[0] || ''

  try {
    const response = await prompts({
      type: 'select',
      name: 'model',
      message: 'Select your API model:',
      choices: models.map(model => ({
        title: model,
        value: model,
      })),
    })

    if (!response.model) {
      logger.info.tag('API Model').data(`Using default: ${defaultModel}`).message('Model selection was interrupted').appendDivider().print()
      return defaultModel
    }

    return response.model
  }
  catch (error) {
    logger.info.tag('API Model').data(`Using default: ${defaultModel}`).message('Model selection was interrupted').appendDivider().print()
    return defaultModel
  }
}

/**
 * Prompt for custom endpoint (optional)
 */
async function promptForCustomEndpoint(): Promise<string | undefined> {
  logger.info.tag('API Endpoint').data('').message('Custom API endpoint (optional)').appendDivider().print()

  try {
    const response = await prompts({
      type: 'text',
      name: 'endpoint',
      message: 'Enter custom API endpoint (leave empty to skip):',
    })

    return response.endpoint || undefined
  }
  catch (error) {
    logger.info.tag('API Endpoint').data('').message('Custom endpoint input was interrupted').appendDivider().print()
    return undefined
  }
}

/**
 * Prompt for history enable
 */
async function promptForHistoryEnable(): Promise<boolean> {
  logger.info.tag('History').data('').message('Enable command history?').appendDivider().print()

  try {
    const response = await prompts({
      type: 'confirm',
      name: 'historyEnable',
      message: 'Enable command history? (recommended)',
      initial: true,
    })

    if (response.historyEnable === undefined) {
      logger.info.tag('History').data('Using default: true').message('History enable selection was interrupted').appendDivider().print()
      return true
    }

    return response.historyEnable
  }
  catch (error) {
    logger.info.tag('History').data('Using default: true').message('History enable selection was interrupted').appendDivider().print()
    return true
  }
}

/**
 * Prompt for missing configuration options
 */
export async function promptForMissingConfig(
  partialConfig: Partial<ShellManConfig> = {},
): Promise<ShellManConfig> {
  logger.info.tag('Config').data('').message('Setting up shell-man configuration').appendDivider().print()
  logger.info.tag('Config').data('').message('Please provide the following information').appendDivider().print()

  const config = { ...DEFAULT_CONFIG, ...partialConfig }

  try {
    // Skip API key if already provided
    if (!config.API_KEY) {
      // Prompt for API key
      config.API_KEY = await promptForApiKey()
    }

    // Skip provider if already provided
    if (!config.API_PROVIDER) {
      // Prompt for API provider
      config.API_PROVIDER = await promptForApiProvider()
    }

    // Skip model if already provided for the current provider
    const availableModels = PROVIDER_MODELS[config.API_PROVIDER] || []
    if (
      !config.API_MODEL
      || !availableModels.includes(config.API_MODEL)
    ) {
      // Prompt for model based on provider
      config.API_MODEL = await promptForApiModel(config.API_PROVIDER)
    }

    // Prompt for custom endpoint if needed
    config.API_CUSTOM_ENDPOINT = await promptForCustomEndpoint()

    // Prompt for history enable
    config.HISTORY_ENABLE = await promptForHistoryEnable()

    logger.info.tag('Config').data('').message('Configuration complete!').appendDivider().print()
    return config as ShellManConfig
  }
  catch (error) {
    logger.error.tag('Config Error').data(error).message('An error occurred during configuration setup').appendDivider().print()
    logger.info.tag('Config').data('').message('Using default values for remaining fields').appendDivider().print()
    return config as ShellManConfig
  }
}

/**
 * Initialize config
 * - Checks if config exists
 * - If not, creates it with defaults in non-interactive mode or prompts in interactive mode
 * - Returns the config
 */
export async function initConfig(
  nonInteractive = false,
): Promise<ShellManConfig> {
  try {
    // Ensure config directory exists
    ensureConfigDir()

    // Check if config exists
    if (!configExists()) {
      // No config exists, create a new one
      let config: ShellManConfig

      if (nonInteractive) {
        // In non-interactive mode, use default config values
        config = { ...DEFAULT_CONFIG, source: 'defaults' }
        const success = writeConfig(config)
        if (success) {
          logger.info.tag('Config').data(config).message(`Default configuration saved to ${getConfigPath()}`).appendDivider().print()
        }
        else {
          logger.error.tag('Config Error').data('').message(`Failed to write configuration to ${getConfigPath()}`).appendDivider().print()
        }
      }
      else {
        // In interactive mode, prompt for config values
        try {
          config = await promptForMissingConfig()
          config.source = 'user input'
          const success = writeConfig(config)
          if (success) {
            logger.info.tag('Config').data(config).message(`Configuration saved to ${getConfigPath()}`).appendDivider().print()
          }
          else {
            logger.error.tag('Config Error').data('').message(`Failed to write configuration to ${getConfigPath()}`).appendDivider().print()
          }
        }
        catch (error) {
          logger.error.tag('Config Error').data(error).message('Error during prompting').appendDivider().print()
          // Fall back to defaults if prompting fails
          config = { ...DEFAULT_CONFIG, source: 'defaults (fallback)' }
          writeConfig(config)
        }
      }

      return config
    }
    else {
      // Config exists, read it
      const existingConfig = readConfig()
      let config: ShellManConfig

      if (existingConfig) {
        // Check if config is valid and has all required fields
        const missingFields = validateConfig(existingConfig)

        if (nonInteractive && missingFields.length > 0) {
          // In non-interactive mode with missing fields, fill in defaults
          config = { ...existingConfig, source: 'existing with default additions' }
          for (const field of missingFields) {
            (config as any)[field] = (DEFAULT_CONFIG as any)[field]
          }
          const success = writeConfig(config)
          if (success) {
            logger.info.tag('Config').data({ path: getConfigPath(), missingFields }).message(`Configuration updated with defaults`).appendDivider().print()
          }
        }
        else {
          // In interactive mode with missing fields, prompt for missing values
          if (missingFields.length > 0 && !nonInteractive) {
            try {
              logger.info.tag('Config').data(missingFields).message('Some required configuration options are missing').appendDivider().print()
              config = await promptForMissingConfig(existingConfig)
              config.source = 'existing with user updates'
              const success = writeConfig(config)
              if (success) {
                logger.info.tag('Config').data({ path: getConfigPath(), config }).message(`Configuration updated`).appendDivider().print()
              }
            }
            catch (error) {
              logger.error.tag('Config Error').data(error).message('Error during prompting').appendDivider().print()
              // Fall back to defaults for missing fields
              config = { ...existingConfig, source: 'existing with default additions (fallback)' }
              for (const field of missingFields) {
                (config as any)[field] = (DEFAULT_CONFIG as any)[field]
              }
            }
          }
          else {
            // Config is valid, use it
            config = { ...existingConfig, source: 'existing (valid)' }
          }
        }
      }
      else {
        // Failed to read config, create a new one with defaults
        config = { ...DEFAULT_CONFIG, source: 'defaults (read error)' }
        writeConfig(config)
      }

      return config
    }
  }
  catch (error) {
    logger.error.tag('Config Error').data(error).message('Error initializing configuration').appendDivider().print()
    // Return default config as a fallback
    return { ...DEFAULT_CONFIG, source: 'defaults (error fallback)' }
  }
}
