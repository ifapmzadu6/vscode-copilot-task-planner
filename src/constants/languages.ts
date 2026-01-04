/**
 * Supported languages for plan translation.
 */

export interface LanguageOption {
    /** The language value used for translation API */
    value: string;
    /** The display label shown in the UI */
    label: string;
}

/**
 * List of supported languages for plan translation.
 * The first entry (English) represents the original language.
 */
export const SUPPORTED_LANGUAGES: readonly LanguageOption[] = [
    { value: 'English', label: 'English (Original)' },
    { value: 'Japanese', label: '日本語' },
    { value: 'Chinese Simplified', label: '简体中文' },
    { value: 'Chinese Traditional', label: '繁體中文' },
    { value: 'Korean', label: '한국어' },
    { value: 'French', label: 'Français' },
    { value: 'German', label: 'Deutsch' },
    { value: 'Italian', label: 'Italiano' },
    { value: 'Spanish', label: 'Español' },
    { value: 'Russian', label: 'Русский' },
    { value: 'Portuguese Brazilian', label: 'Português (Brasil)' },
    { value: 'Polish', label: 'Polski' },
    { value: 'Turkish', label: 'Türkçe' },
    { value: 'Czech', label: 'Čeština' },
] as const;
