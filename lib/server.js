const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const FileManager = require('./file-manager');
const Translator = require('./translator');

class TranslationServer {
    constructor(config) {
        const localesPath = config.localesPath || path.join(process.cwd(), 'public/locales');
        
        // Auto-discover languages and translation files from locales directory
        const { languages, translationFiles } = FileManager.scanLocalesDirectory(localesPath);
        
        this.config = {
            port: config.port || 3001,
            host: config.host || 'localhost',
            localesPath: localesPath,
            staticPath: config.staticPath || path.join(process.cwd(), 'public'),
            languages: languages,
            translationFiles: translationFiles,
            autoOpenBrowser: config.autoOpenBrowser !== false,
            translation: {
                apiUrl: config.translation?.apiUrl || process.env.TRANSLATE_API_URL,
                apiKey: config.translation?.apiKey || process.env.TRANSLATE_API_AUTHORIZATION,
                prompt: config.translation?.prompt || process.env.TRANSLATE_PROMPT,
                model: config.translation?.model || 'qwen-plus',
                languageMap: config.translation?.languageMap,
            },
        };

        this.app = express();
        this.fileManager = new FileManager(this.config);
        this.translator = new Translator(this.config.translation);

        this.setupMiddleware();
        this.setupRoutes();
    }

    /**
     * Setup Express middleware
     */
    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        
        // Serve static files if path exists
        if (fs.existsSync(this.config.staticPath)) {
            this.app.use(express.static(this.config.staticPath));
        }
        
        // Serve the translation manager HTML from templates
        const templatesPath = path.join(__dirname, '../templates');
        if (fs.existsSync(templatesPath)) {
            this.app.use('/templates', express.static(templatesPath));
        }
        
        // Serve translation-manager.html at root for convenience
        this.app.get('/translation-manager.html', (req, res) => {
            const templatePath = path.join(__dirname, '../templates/translation-manager.html');
            if (fs.existsSync(templatePath)) {
                res.sendFile(templatePath);
            } else {
                res.status(404).send('Translation manager not found');
            }
        });
        
        // Redirect root to translation manager
        this.app.get('/', (req, res) => {
            res.redirect('/translation-manager.html');
        });
    }

    /**
     * Setup API routes
     */
    setupRoutes() {
        // Get all translations
        this.app.get('/api/translations', (req, res) => {
            try {
                let translations = this.fileManager.getAllTranslations();
                const { q, file, key } = req.query;

                // Search filter
                if (q) {
                    const searchTerm = q.toLowerCase();
                    translations = translations.filter(
                        (item) =>
                            item.key.toLowerCase().includes(searchTerm) ||
                            Object.values(item.translations).some((trans) =>
                                trans.toLowerCase().includes(searchTerm)
                            )
                    );
                }

                // File filter
                if (file) {
                    translations = translations.filter((item) => item.file === file);
                }

                // Key filter
                if (key) {
                    translations = translations.filter((item) => item.key === key);
                }

                res.json(translations);
            } catch (error) {
                res.status(500).json({ error: 'Failed to get translations: ' + error.message });
            }
        });

        // Get single translation
        this.app.get('/api/translations/:id', (req, res) => {
            try {
                const translations = this.fileManager.getAllTranslations();
                const id = parseInt(req.params.id);
                const translation = translations.find((t) => t.id === id);

                if (!translation) {
                    return res.status(404).json({ error: 'Translation not found' });
                }

                res.json(translation);
            } catch (error) {
                res.status(500).json({ error: 'Failed to get translation: ' + error.message });
            }
        });

        // Add translation
        this.app.post('/api/translations', (req, res) => {
            try {
                const { key, file, translations } = req.body;

                if (!key || !file || !translations) {
                    return res.status(400).json({ error: 'Missing required fields' });
                }

                // Check if key already exists
                const existingData = this.fileManager.readTranslationFile('zh', file);
                if (existingData[key] !== undefined) {
                    return res.status(409).json({ error: 'Translation key already exists' });
                }

                if (this.fileManager.updateTranslation(key, file, translations)) {
                    res.status(201).json({
                        key,
                        file,
                        translations,
                        message: 'Translation added successfully',
                    });
                } else {
                    res.status(500).json({ error: 'Failed to save translation' });
                }
            } catch (error) {
                res.status(500).json({ error: 'Failed to add translation: ' + error.message });
            }
        });

        // Update translation
        this.app.put('/api/translations/:id', (req, res) => {
            try {
                const translations = this.fileManager.getAllTranslations();
                const id = parseInt(req.params.id);
                const translation = translations.find((t) => t.id === id);

                if (!translation) {
                    return res.status(404).json({ error: 'Translation not found' });
                }

                const { key, file, translations: newTranslations } = req.body;

                // If key or file changed, delete old one
                if (key !== translation.key || file !== translation.file) {
                    this.fileManager.deleteTranslation(translation.key, translation.file);
                }

                const finalKey = key || translation.key;
                const finalFile = file || translation.file;
                const finalTranslations = newTranslations || translation.translations;

                if (this.fileManager.updateTranslation(finalKey, finalFile, finalTranslations)) {
                    res.json({
                        key: finalKey,
                        file: finalFile,
                        translations: finalTranslations,
                        message: 'Translation updated successfully',
                    });
                } else {
                    res.status(500).json({ error: 'Failed to update translation' });
                }
            } catch (error) {
                res.status(500).json({ error: 'Failed to update translation: ' + error.message });
            }
        });

        // Delete translation
        this.app.delete('/api/translations/:id', (req, res) => {
            try {
                const translations = this.fileManager.getAllTranslations();
                const id = parseInt(req.params.id);
                const translation = translations.find((t) => t.id === id);

                if (!translation) {
                    return res.status(404).json({ error: 'Translation not found' });
                }

                if (this.fileManager.deleteTranslation(translation.key, translation.file)) {
                    res.json({ message: 'Translation deleted successfully' });
                } else {
                    res.status(500).json({ error: 'Failed to delete translation' });
                }
            } catch (error) {
                res.status(500).json({ error: 'Failed to delete translation: ' + error.message });
            }
        });

        // Get languages list
        this.app.get('/api/languages', (req, res) => {
            res.json(this.config.languages);
        });

        // Get files list
        this.app.get('/api/files', (req, res) => {
            res.json(this.config.translationFiles);
        });

        // Auto-translate
        this.app.post('/api/auto-translate/:id', async (req, res) => {
            try {
                const translations = this.fileManager.getAllTranslations();
                const id = parseInt(req.params.id);
                const translation = translations.find((t) => t.id === id);

                if (!translation) {
                    return res.status(404).json({ error: 'Translation not found' });
                }

                const { sourceLanguage = 'zh', targetLanguages } = req.body;
                const sourceText = translation.translations[sourceLanguage];

                if (!sourceText) {
                    return res
                        .status(400)
                        .json({ error: `Source language ${sourceLanguage} translation not found` });
                }

                const languagesToTranslate =
                    targetLanguages ||
                    this.config.languages.filter((lang) => lang !== sourceLanguage);

                const { results, errors } = await this.translator.translateMultiple(
                    sourceText,
                    sourceLanguage,
                    languagesToTranslate
                );

                // Update translation files
                const updatedTranslations = { ...translation.translations, ...results };
                if (
                    this.fileManager.updateTranslation(
                        translation.key,
                        translation.file,
                        updatedTranslations
                    )
                ) {
                    res.json({
                        success: true,
                        message: 'Auto-translation completed',
                        results,
                        errors: errors.length > 0 ? errors : undefined,
                    });
                } else {
                    res.status(500).json({ error: 'Failed to save translations' });
                }
            } catch (error) {
                console.error('Auto-translation failed:', error);
                res.status(500).json({
                    error: 'Auto-translation failed: ' + error.message,
                });
            }
        });

        // Translate only (without saving)
        this.app.post('/api/translate-only', async (req, res) => {
            try {
                const { text, sourceLanguage = 'zh', targetLanguages } = req.body;

                if (!text) {
                    return res.status(400).json({ error: 'Please provide text to translate' });
                }

                const languagesToTranslate =
                    targetLanguages ||
                    this.config.languages.filter((lang) => lang !== sourceLanguage);

                const { results, errors } = await this.translator.translateMultiple(
                    text,
                    sourceLanguage,
                    languagesToTranslate
                );

                res.json({
                    success: true,
                    message: 'Translation completed',
                    results,
                    errors: errors.length > 0 ? errors : undefined,
                });
            } catch (error) {
                console.error('Translation failed:', error);
                res.status(500).json({
                    error: 'Translation failed: ' + error.message,
                });
            }
        });

        // Batch translate
        this.app.post('/api/batch-translate', async (req, res) => {
            try {
                const { ids, sourceLanguage = 'zh', targetLanguages } = req.body;

                if (!ids || !Array.isArray(ids) || ids.length === 0) {
                    return res.status(400).json({ error: 'Please provide IDs to translate' });
                }

                const allTranslations = this.fileManager.getAllTranslations();
                const results = [];
                const errors = [];

                for (const id of ids) {
                    const translation = allTranslations.find(
                        (t) => t.id === parseInt(id)
                    );
                    if (!translation) {
                        errors.push(`Translation with ID ${id} not found`);
                        continue;
                    }

                    const sourceText = translation.translations[sourceLanguage];
                    if (!sourceText) {
                        errors.push(`Source language ${sourceLanguage} for ID ${id} not found`);
                        continue;
                    }

                    const languagesToTranslate =
                        targetLanguages ||
                        this.config.languages.filter((lang) => lang !== sourceLanguage);

                    const { results: translationResults, errors: translationErrors } =
                        await this.translator.translateMultiple(
                            sourceText,
                            sourceLanguage,
                            languagesToTranslate
                        );

                    errors.push(...translationErrors);

                    // Update translation files
                    const updatedTranslations = {
                        ...translation.translations,
                        ...translationResults,
                    };
                    if (
                        this.fileManager.updateTranslation(
                            translation.key,
                            translation.file,
                            updatedTranslations
                        )
                    ) {
                        results.push({
                            id,
                            key: translation.key,
                            results: translationResults,
                        });
                    } else {
                        errors.push(`Failed to save translation for ID ${id}`);
                    }
                }

                res.json({
                    success: true,
                    message: `Batch translation completed, processed ${results.length} entries`,
                    results,
                    errors: errors.length > 0 ? errors : undefined,
                });
            } catch (error) {
                console.error('Batch translation failed:', error);
                res.status(500).json({
                    error: 'Batch translation failed: ' + error.message,
                });
            }
        });

        // Create new file
        this.app.post('/api/create-file', async (req, res) => {
            try {
                const { fileName } = req.body;

                if (!fileName) {
                    return res.status(400).json({ error: 'Please provide file name' });
                }

                const { createdCount, errors } = this.fileManager.createNewFile(fileName);

                if (createdCount > 0) {
                    res.json({
                        success: true,
                        message: `Successfully created file ${fileName}.json`,
                        fileName,
                        createdCount,
                        totalLanguages: this.config.languages.length,
                        errors: errors.length > 0 ? errors : undefined,
                    });
                } else {
                    res.status(500).json({
                        error: 'Failed to create file',
                        errors,
                    });
                }
            } catch (error) {
                console.error('Failed to create file:', error);
                res.status(500).json({
                    error: 'Failed to create file: ' + error.message,
                });
            }
        });

        // Refresh cache
        this.app.post('/api/refresh-cache', (req, res) => {
            try {
                const cacheInfo = this.fileManager.refreshCache();
                console.log('Cache refreshed');
                res.json({
                    success: true,
                    message: 'Cache refreshed successfully',
                    ...cacheInfo,
                });
            } catch (error) {
                console.error('Failed to refresh cache:', error);
                res.status(500).json({ error: 'Failed to refresh cache: ' + error.message });
            }
        });

        // Export data
        this.app.get('/api/export-data', (req, res) => {
            try {
                const localesPath = this.config.localesPath;

                // Check if locales folder exists
                if (!fs.existsSync(localesPath)) {
                    return res.status(404).json({ error: 'Locales folder not found' });
                }

                // Set response headers
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const filename = `locales-export-${timestamp}.zip`;

                res.setHeader('Content-Type', 'application/zip');
                res.setHeader(
                    'Content-Disposition',
                    `attachment; filename="${filename}"`
                );

                // Create archiver instance
                const archive = archiver('zip', {
                    zlib: { level: 9 }, // Maximum compression
                });

                // Listen for errors
                archive.on('error', (err) => {
                    console.error('Error creating archive:', err);
                    if (!res.headersSent) {
                        res.status(500).json({
                            error: 'Failed to create archive: ' + err.message,
                        });
                    }
                });

                // Listen for end event
                archive.on('end', () => {
                    console.log(
                        `Export completed: ${filename}, size: ${archive.pointer()} bytes`
                    );
                });

                // Pipe archive to response
                archive.pipe(res);

                // Add entire locales folder to archive
                archive.directory(localesPath, 'locales');

                // Finalize archive
                archive.finalize();
            } catch (error) {
                console.error('Export failed:', error);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Export failed: ' + error.message });
                }
            }
        });
    }

    /**
     * Start the server
     */
    start() {
        return new Promise((resolve) => {
            // Preload translations
            this.fileManager.preloadTranslations();

            this.server = this.app.listen(this.config.port, this.config.host, () => {
                console.log('🚀 Translation Server Started!\n');
                console.log('🌐 Server URLs:');
                console.log(`   API Server: http://${this.config.host}:${this.config.port}`);
                console.log(`   Web UI:     http://${this.config.host}:${this.config.port}/translation-manager.html`);
                console.log('\n📖 Available API Endpoints:');
                console.log('   GET    /api/translations     - Get all translations');
                console.log('   POST   /api/translations     - Add new translation');
                console.log('   PUT    /api/translations/:id - Update translation');
                console.log('   DELETE /api/translations/:id - Delete translation');
                console.log('   GET    /api/languages        - Get languages list');
                console.log('   GET    /api/files           - Get files list');
                console.log('   POST   /api/create-file      - Create new translation file');
                console.log('   POST   /api/auto-translate/:id - Auto-translate');
                console.log('   POST   /api/translate-only   - Translate only (no save)');
                console.log('   POST   /api/batch-translate  - Batch translate');
                console.log('   POST   /api/refresh-cache    - Refresh cache');
                console.log('   GET    /api/export-data      - Export data');
                console.log('\n✨ Features: Memory cache + Direct JSON manipulation, high performance without database');
                console.log('\n💡 Tip: Open the Web UI in your browser to manage translations with a visual interface');
                console.log('\nPress Ctrl+C to stop the server');

                resolve(this.server);
            });
        });
    }

    /**
     * Stop the server
     */
    stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    console.log('\n🛑 Server stopped');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = TranslationServer;
