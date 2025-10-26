const TranslationServer = require('../lib/server');
const path = require('path');

// Example: Basic usage of the translation server
const config = {
    port: 3001,
    host: 'localhost',
    
    // The server will automatically scan localesPath to discover:
    // - languages: All subdirectories (e.g., zh, en, es, fr, de)
    // - translationFiles: All .json files found (e.g., common, home, about)
    localesPath: path.join(__dirname, 'public/locales'),
    staticPath: path.join(__dirname, 'public'),
    
    autoOpenBrowser: false,
    translation: {
        // You can set these via environment variables or directly here
        apiUrl: process.env.TRANSLATE_API_URL,
        apiKey: process.env.TRANSLATE_API_AUTHORIZATION,
        prompt: process.env.TRANSLATE_PROMPT,
        model: 'qwen-plus',
    },
};

// Create server instance
const server = new TranslationServer(config);

// Start the server
server.start().then(() => {
    console.log('✅ Translation server is running!');
    console.log('📝 You can now make API requests to http://localhost:3001');
    
    // Example: Stop the server after 60 seconds (for demonstration)
    // setTimeout(async () => {
    //     console.log('⏰ Stopping server after 60 seconds...');
    //     await server.stop();
    // }, 60000);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n👋 Shutting down gracefully...');
    await server.stop();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n👋 Shutting down gracefully...');
    await server.stop();
    process.exit(0);
});
