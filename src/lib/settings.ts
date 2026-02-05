import { query } from './db';

interface SystemSettingRow {
    settingKey: string;
    settingValue: string | null;
}

// Simple in-memory cache with TTL
let settingsCache: Map<string, string> | null = null;
let cacheExpiry: number = 0;
const CACHE_TTL_MS = 60000; // 1 minute cache

/**
 * Get all system settings from database
 * Results are cached for 1 minute to reduce DB calls
 */
export async function getAllSettings(): Promise<Record<string, string>> {
    const now = Date.now();

    // Return cached settings if still valid
    if (settingsCache && now < cacheExpiry) {
        return Object.fromEntries(settingsCache);
    }

    try {
        const rows = await query<SystemSettingRow>(`
            SELECT settingKey, settingValue FROM SystemSettings
        `);

        const settings = new Map<string, string>();
        for (const row of rows) {
            if (row.settingValue !== null) {
                settings.set(row.settingKey, row.settingValue);
            }
        }

        // Update cache
        settingsCache = settings;
        cacheExpiry = now + CACHE_TTL_MS;

        return Object.fromEntries(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        return {};
    }
}

/**
 * Get a single setting value
 * @param key - Setting key
 * @param defaultValue - Default value if not found
 */
export async function getSetting(key: string, defaultValue: string = ''): Promise<string> {
    const settings = await getAllSettings();
    return settings[key] ?? defaultValue;
}

/**
 * Get a numeric setting value
 * @param key - Setting key
 * @param defaultValue - Default value if not found or invalid
 */
export async function getSettingNumber(key: string, defaultValue: number): Promise<number> {
    const value = await getSetting(key, '');
    if (!value) return defaultValue;

    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Get a boolean setting value
 * @param key - Setting key
 * @param defaultValue - Default value if not found
 */
export async function getSettingBoolean(key: string, defaultValue: boolean): Promise<boolean> {
    const value = await getSetting(key, '');
    if (!value) return defaultValue;

    return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Clear settings cache - call this after updating settings
 */
export function clearSettingsCache(): void {
    settingsCache = null;
    cacheExpiry = 0;
}
