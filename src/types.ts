// Shell-man Type Definitions

// Environment Information Types
export interface EnvironmentInfo {
  osType: string
  osVersion: string
  architecture: string
  shellPath: string
  shellName: string
}

export interface ShellInfo {
  path: string
  name: string
}

// Configuration Types
export interface ShellManConfig {
  API_KEY: string
  API_PROVIDER: string
  API_MODEL: string
  API_CUSTOM_ENDPOINT?: string
  HISTORY_ENABLE: boolean
  source?: string
}

// API Provider Constants
export const API_PROVIDERS = [
  'openai',
  'anthropic',
  'google',
  'cohere',
  'mistral',
  'ollama',
  'azure',
]

// Model mapping for providers
export const PROVIDER_MODELS: Record<string, string[]> = {
  openai: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o'],
  anthropic: [
    'claude-instant-1',
    'claude-2',
    'claude-3-opus',
    'claude-3-sonnet',
    'claude-3-haiku',
  ],
  google: ['gemini-pro', 'gemini-pro-vision', 'gemini-ultra'],
  cohere: ['command', 'command-light', 'command-r', 'command-r-plus'],
  mistral: ['mistral-tiny', 'mistral-small', 'mistral-medium', 'mistral-large'],
  ollama: ['llama2', 'mistral', 'gemma', 'phi'],
  azure: ['gpt-35-turbo', 'gpt-4', 'gpt-4-turbo'],
}

// Default config
export const DEFAULT_CONFIG: ShellManConfig = {
  API_KEY: '',
  API_PROVIDER: 'openai',
  API_MODEL: 'gpt-3.5-turbo',
  HISTORY_ENABLE: true,
  source: undefined,
}
