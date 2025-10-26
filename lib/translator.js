const axios = require('axios');

class Translator {
    constructor(config) {
        this.apiUrl = config.apiUrl;
        this.apiKey = config.apiKey;
        this.prompt = config.prompt;
        this.model = config.model || 'qwen-plus';
        this.languageMap = config.languageMap || {
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
        };
    }

    /**
     * Translate content to target language
     */
    async translate(language, content) {
        if (!this.apiUrl || !this.apiKey) {
            throw new Error('Translation API URL and API Key must be configured');
        }

        const queryContent = {
            language,
            content: typeof content === 'string' ? [content] : content,
        };

        const config = {
            method: 'post',
            url: this.apiUrl,
            headers: {
                Authorization: this.apiKey,
                'Content-Type': 'application/json',
            },
            data: JSON.stringify({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: this.prompt,
                    },
                    {
                        role: 'user',
                        content: JSON.stringify(queryContent),
                    },
                ],
            }),
        };

        try {
            const response = await axios(config);
            const translation = JSON.parse(
                response.data.choices[0].message.content
            ).content;
            return translation;
        } catch (error) {
            console.error('Error translating content:', error.message);
            throw error;
        }
    }

    /**
     * Translate to multiple languages
     */
    async translateMultiple(sourceText, sourceLanguage, targetLanguages, delay = 1000) {
        const results = {};
        const errors = [];

        for (const targetLang of targetLanguages) {
            const targetLanguageName = this.languageMap[targetLang];
            if (!targetLanguageName) {
                errors.push(`Unknown language code: ${targetLang}`);
                continue;
            }

            try {
                console.log(`Translating to ${targetLanguageName} (${targetLang})...`);
                const translatedTexts = await this.translate(
                    targetLanguageName,
                    [sourceText]
                );

                if (translatedTexts && translatedTexts.length > 0) {
                    results[targetLang] = translatedTexts[0];
                } else {
                    errors.push(`Failed to translate to ${targetLanguageName}`);
                }

                // Add delay to avoid API rate limiting
                if (delay > 0) {
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            } catch (error) {
                console.error(
                    `Failed to translate to ${targetLanguageName}:`,
                    error.message
                );
                errors.push(
                    `Failed to translate to ${targetLanguageName}: ${error.message}`
                );
            }
        }

        return { results, errors };
    }

    /**
     * Get language name from code
     */
    getLanguageName(code) {
        return this.languageMap[code] || code;
    }
}

module.exports = Translator;
