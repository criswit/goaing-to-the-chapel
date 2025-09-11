/**
 * Frontend configuration loader
 * Loads configuration from environment variables or config.json
 */

export interface AppConfig {
  apiUrl: string;
  adminApiUrl: string;
  environment: string;
}

let cachedConfig: AppConfig | null = null;

/**
 * Load configuration from environment variables or config.json
 */
export async function loadConfig(): Promise<AppConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  // For local development, use relative URLs to leverage proxy
  if (window.location.hostname === 'localhost') {
    cachedConfig = {
      apiUrl: '/prod',
      adminApiUrl: '/prod',
      environment: 'development',
    };
    console.log('Config loaded for local development with proxy');
    return cachedConfig;
  }

  // First try environment variables
  if (process.env.REACT_APP_API_URL && process.env.REACT_APP_ADMIN_API_URL) {
    cachedConfig = {
      apiUrl: process.env.REACT_APP_API_URL,
      adminApiUrl: process.env.REACT_APP_ADMIN_API_URL,
      environment: process.env.REACT_APP_ENVIRONMENT || 'development',
    };
    console.log('Config loaded from environment variables');
    return cachedConfig;
  }

  // Try to load from config.json
  try {
    const response = await fetch('/config.json');
    if (response.ok) {
      const config = await response.json();
      cachedConfig = config as AppConfig;
      console.log('Config loaded from config.json');
      return cachedConfig;
    }
  } catch (error) {
    console.warn('Failed to load config.json:', error);
  }

  // Fallback to defaults (will likely fail but at least won't crash)
  console.warn('Using fallback configuration - API calls may fail');
  cachedConfig = {
    apiUrl: 'https://api-not-configured',
    adminApiUrl: 'https://admin-api-not-configured',
    environment: 'development',
  };

  return cachedConfig;
}

/**
 * Get the current configuration synchronously
 * Will throw if config hasn't been loaded yet
 */
export function getConfig(): AppConfig {
  if (!cachedConfig) {
    throw new Error('Configuration not loaded. Call loadConfig() first.');
  }
  return cachedConfig;
}
