const path = require('path');

module.exports = {
    // Server configuration
    port: 3001,
    host: 'localhost',

    // Path configuration
    localesPath: path.join(__dirname, 'public/locales'),
    staticPath: path.join(__dirname, 'public'),

    // Language configuration
    languages: [
        'zh',      // Chinese (Simplified)
        'en',      // English
        'zh-TW',   // Chinese (Traditional)
        'de',      // German
        'es',      // Spanish
        'fr',      // French
        'id',      // Indonesian
        'ja',      // Japanese
        'ko',      // Korean
        'ms',      // Malay
        'pt',      // Portuguese
        'ru',      // Russian
        'th',      // Thai
        'vi',      // Vietnamese
    ],

    // Translation file names (without .json extension)
    translationFiles: [
        'common',
        'home',
        'about',
        'contact',
        'footer',
        'header',
    ],

    // Auto-open browser on server start
    autoOpenBrowser: true,

    // Translation API configuration
    translation: {
        // API URL - Replace with your actual API endpoint
        apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',

        // API Key/Authorization - Replace with your actual API key
        apiKey: 'Bearer your_api_key_here',

        // Translation prompt - Customize as needed
        prompt: 'You are a professional translator. I will provide you with a JSON string containing "language" and "content" fields. Please translate the content to the specified language accurately while maintaining the original meaning, tone, and context. Return the result as a JSON string with the same structure.',

        // AI Model to use
        model: 'qwen-plus',

        // Custom language mapping (optional)
        languageMap: {
            de: 'German',
            en: 'English',
            es: 'Spanish',
            fr: 'French',
            id: 'Indonesian',
            ja: 'Japanese',
            ko: 'Korean',
            ms: 'Malay',
            pt: 'Portuguese',
            ru: 'Russian',
            th: 'Thai',
            vi: 'Vietnamese',
            zh: 'Chinese',
            'zh-TW': 'Chinese (Traditional)',
        },
    },
};
