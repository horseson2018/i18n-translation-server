const axios = require("axios")

class Translator {
    constructor(config) {
        this.apiUrl = config.apiUrl
        this.apiKey = config.apiKey
        this.prompt = `You are a multilingual translation assistant.

I will send you a JSON string that contains two fields: languages and content.

Your task is to translate the text in content into the language specified by language.

Requirements:
	•	Return only a JSON string, with no extra text or explanations.
    •   Target Languages and Output Keys:
    1. zh (Simplified Chinese)
    2. zh-TW (Traditional Chinese)
    3. de (German)
    4. es (Spanish)
    5. fr (French)
    6. pt (Portuguese)
    7. ja (Japanese)
    8. ko (Korean)
    8. en (English)

	•	The output JSON format must be:
{"result":{"<language>": "<translated text>"}}
	•	Example:
Input: {"languages":["en","zh"],"content":"你好"}
Output: {"result":{en: "Hello", zh: "你好"}}
	•	If language is Chinese (Traditional), translate the content using Hong Kong / Taiwan traditional characters and common phrasing.

Do not include any additional fields or information in the response.`
        this.model = config.model || "qwen-plus"
        this.languageMap = config.languageMap || {
            de: "German",
            en: "English",
            es: "Spanish",
            fr: "French",
            id: "Indonesian",
            ja: "Japanese",
            ko: "Korean",
            ms: "Malay",
            pt: "Portuguese",
            ru: "Russian",
            th: "Thai",
            vi: "Vietnamese",
            zh: "Chinese",
            "zh-TW": "Chinese (Traditional)",
        }
    }

    /**
     * Translate content to target language
     */
    async translate(languages, content) {
        if (!this.apiUrl || !this.apiKey) {
            throw new Error(
                "Translation API URL and API Key must be configured",
            )
        }

        const queryContent = {
            languages,
            content: typeof content === "string" ? [content] : content,
        }

        const config = {
            method: "post",
            url: this.apiUrl,
            headers: {
                Authorization: this.apiKey,
                "Content-Type": "application/json",
            },
            data: JSON.stringify({
                model: this.model,
                messages: [
                    {
                        role: "system",
                        content: this.prompt,
                    },
                    {
                        role: "user",
                        content: JSON.stringify(queryContent),
                    },
                ],
            }),
        }

        try {
            console.log("config", JSON.stringify(config))
            const response = await axios(config)
            const translation = JSON.parse(
                response.data.choices[0].message.content,
            ).result
            console.log("response", JSON.stringify(response.data))
            return translation
        } catch (error) {
            console.error("Error translating content:", error.message)
            throw error
        }
    }

    /**
     * Translate to multiple languages
     */
    async translateMultiple(
        sourceText,
        sourceLanguage,
        targetLanguages,
        delay = 1000,
    ) {
        let results = {}
        const errors = []
        const langs = []
        for (const targetLang of targetLanguages) {
            const targetLanguageName = this.languageMap[targetLang]
            if (!targetLanguageName) {
                errors.push(`Unknown language code: ${targetLang}`)
                continue
            }
            langs.push(targetLanguageName)
        }
        try {
            const translatedTexts = await this.translate(langs, [sourceText])

            console.log("translatedTexts", translatedTexts)

            if (translatedTexts) {
                results = translatedTexts
            } else {
                errors.push(`Failed to translate to ${translatedTexts}`)
            }

            // Add delay to avoid API rate limiting
            if (delay > 0) {
                await new Promise((resolve) => setTimeout(resolve, delay))
            }
        } catch (error) {
            console.error(
                `Failed to translate to ${targetLanguages}:`,
                error.message,
            )
            errors.push(
                `Failed to translate to ${targetLanguages}: ${error.message}`,
            )
        }

        return { results, errors }
    }

    /**
     * Get language name from code
     */
    getLanguageName(code) {
        return this.languageMap[code] || code
    }
}

module.exports = Translator
