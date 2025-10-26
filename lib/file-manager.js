const fs = require('fs');
const path = require('path');

class FileManager {
    /**
     * Scan locales directory to auto-discover languages and translation files
     * @param {string} localesPath - Path to locales directory
     * @returns {{languages: string[], translationFiles: string[]}}
     */
    static scanLocalesDirectory(localesPath) {
        const languages = [];
        const translationFilesSet = new Set();

        try {
            // Check if locales path exists
            if (!fs.existsSync(localesPath)) {
                console.warn(`⚠️  Locales path does not exist: ${localesPath}`);
                return { languages: [], translationFiles: [] };
            }

            // Read all directories in locales path (each directory is a language)
            const entries = fs.readdirSync(localesPath, { withFileTypes: true });
            
            entries.forEach(entry => {
                if (entry.isDirectory()) {
                    const langCode = entry.name;
                    const langPath = path.join(localesPath, langCode);
                    
                    // Read all JSON files in this language directory
                    try {
                        const files = fs.readdirSync(langPath);
                        const jsonFiles = files.filter(file => file.endsWith('.json'));
                        
                        if (jsonFiles.length > 0) {
                            languages.push(langCode);
                            
                            // Add file names (without .json extension) to the set
                            jsonFiles.forEach(file => {
                                const fileName = file.replace('.json', '');
                                translationFilesSet.add(fileName);
                            });
                        }
                    } catch (error) {
                        console.warn(`⚠️  Error reading language directory ${langPath}:`, error.message);
                    }
                }
            });

            const translationFiles = Array.from(translationFilesSet).sort();
            
            console.log(`📁 Auto-discovered from ${localesPath}:`);
            console.log(`   Languages: ${languages.join(', ')}`);
            console.log(`   Files: ${translationFiles.join(', ')}`);
            
            return { languages, translationFiles };
        } catch (error) {
            console.error(`❌ Error scanning locales directory:`, error.message);
            return { languages: [], translationFiles: [] };
        }
    }
    constructor(config) {
        this.localesPath = config.localesPath;
        this.languages = config.languages;
        this.translationFiles = config.translationFiles;
        this.translationCache = new Map();
        this.allTranslationsCache = null;
        this.cacheLastUpdated = null;
    }

    /**
     * Preload all translation files to memory
     */
    preloadTranslations() {
        console.log('📚 Loading translation files to memory...');
        const startTime = Date.now();
        let loadedFiles = 0;

        this.translationCache.clear();

        this.languages.forEach((language) => {
            this.translationFiles.forEach((fileName) => {
                const cacheKey = `${language}:${fileName}`;
                const filePath = path.join(
                    this.localesPath,
                    language,
                    `${fileName}.json`
                );

                try {
                    if (fs.existsSync(filePath)) {
                        const content = fs.readFileSync(filePath, 'utf8');
                        const data = JSON.parse(content);
                        this.translationCache.set(cacheKey, data);
                        loadedFiles++;
                    } else {
                        this.translationCache.set(cacheKey, {});
                    }
                } catch (error) {
                    console.error(`Failed to load ${filePath}:`, error.message);
                    this.translationCache.set(cacheKey, {});
                }
            });
        });

        this.cacheLastUpdated = Date.now();
        const loadTime = Date.now() - startTime;
        console.log(
            `✅ Loaded ${loadedFiles} files in ${loadTime}ms`
        );
    }

    /**
     * Read translation file from cache
     */
    readTranslationFile(language, fileName) {
        const cacheKey = `${language}:${fileName}`;

        if (this.translationCache.has(cacheKey)) {
            return this.translationCache.get(cacheKey);
        }

        // If not in cache, try to read from file system and update cache
        const filePath = path.join(this.localesPath, language, `${fileName}.json`);
        try {
            if (!fs.existsSync(filePath)) {
                this.translationCache.set(cacheKey, {});
                return {};
            }
            const content = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(content);
            this.translationCache.set(cacheKey, data);
            return data;
        } catch (error) {
            console.error(`Failed to read ${filePath}:`, error.message);
            this.translationCache.set(cacheKey, {});
            return {};
        }
    }

    /**
     * Write single translation file and update cache
     */
    writeTranslationFile(language, fileName, data) {
        const langDir = path.join(this.localesPath, language);
        const filePath = path.join(langDir, `${fileName}.json`);

        try {
            // Ensure directory exists
            if (!fs.existsSync(langDir)) {
                fs.mkdirSync(langDir, { recursive: true });
            }

            fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');

            // Update cache
            const cacheKey = `${language}:${fileName}`;
            this.translationCache.set(cacheKey, data);

            // Clear aggregated cache to force regeneration
            this.allTranslationsCache = null;

            return true;
        } catch (error) {
            console.error(`Failed to write ${filePath}:`, error.message);
            return false;
        }
    }

    /**
     * Get all translations (with caching)
     */
    getAllTranslations() {
        // If cache exists and is up-to-date, return it
        if (this.allTranslationsCache && this.cacheLastUpdated) {
            return this.allTranslationsCache;
        }

        console.log('🔄 Regenerating translation data cache...');
        const startTime = Date.now();
        const translations = [];
        let id = 1;

        // Iterate through all files
        this.translationFiles.forEach((fileName) => {
            // Collect all keys from all languages for this file
            const allKeys = new Set();

            this.languages.forEach((lang) => {
                const data = this.readTranslationFile(lang, fileName);
                Object.keys(data).forEach((key) => allKeys.add(key));
            });

            // Create translation entry for each key
            allKeys.forEach((key) => {
                const translationData = {};

                this.languages.forEach((lang) => {
                    const data = this.readTranslationFile(lang, fileName);
                    translationData[lang] = data[key] || '';
                });

                translations.push({
                    id: id++,
                    key,
                    file: fileName,
                    translations: translationData,
                });
            });
        });

        // Cache result
        this.allTranslationsCache = translations;
        const generateTime = Date.now() - startTime;
        console.log(
            `✅ Translation cache generated! ${translations.length} entries in ${generateTime}ms`
        );

        return translations;
    }

    /**
     * Update translation
     */
    updateTranslation(key, fileName, translations) {
        let success = true;

        Object.entries(translations).forEach(([lang, value]) => {
            if (this.languages.includes(lang)) {
                const data = this.readTranslationFile(lang, fileName);
                data[key] = value;

                if (!this.writeTranslationFile(lang, fileName, data)) {
                    success = false;
                }
            }
        });

        return success;
    }

    /**
     * Delete translation
     */
    deleteTranslation(key, fileName) {
        let success = true;

        this.languages.forEach((lang) => {
            const data = this.readTranslationFile(lang, fileName);
            if (data[key] !== undefined) {
                delete data[key];
                if (!this.writeTranslationFile(lang, fileName, data)) {
                    success = false;
                }
            }
        });

        return success;
    }

    /**
     * Create new translation file
     */
    createNewFile(fileName) {
        // Validate file name format
        if (!/^[a-zA-Z0-9_-]+$/.test(fileName)) {
            throw new Error('File name can only contain letters, numbers, hyphens, and underscores');
        }

        // Check if file already exists
        if (this.translationFiles.includes(fileName)) {
            throw new Error('File name already exists');
        }

        let createdCount = 0;
        const errors = [];

        // Create new file in all language folders
        for (const language of this.languages) {
            const langDir = path.join(this.localesPath, language);
            const filePath = path.join(langDir, `${fileName}.json`);

            try {
                // Ensure directory exists
                if (!fs.existsSync(langDir)) {
                    fs.mkdirSync(langDir, { recursive: true });
                }

                // Check if file already exists
                if (fs.existsSync(filePath)) {
                    console.log(`File already exists: ${filePath}`);
                    continue;
                }

                // Create empty JSON file
                fs.writeFileSync(filePath, JSON.stringify({}, null, 4), 'utf8');

                // Update cache
                const cacheKey = `${language}:${fileName}`;
                this.translationCache.set(cacheKey, {});

                createdCount++;
                console.log(`Created file: ${filePath}`);
            } catch (error) {
                console.error(`Failed to create ${filePath}:`, error.message);
                errors.push(`${language}: ${error.message}`);
            }
        }

        // Add new file to file list
        this.translationFiles.push(fileName);

        // Clear aggregated cache to force regeneration
        this.allTranslationsCache = null;

        return { createdCount, errors };
    }

    /**
     * Refresh cache
     */
    refreshCache() {
        this.preloadTranslations();
        this.allTranslationsCache = null;
        return {
            cacheSize: this.translationCache.size,
            lastUpdated: new Date(this.cacheLastUpdated).toLocaleString(),
        };
    }
}

module.exports = FileManager;
