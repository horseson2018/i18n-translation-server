# i18n Translation Server

A powerful, production-ready i18n translation management server with automatic translation, RESTful API, and memory caching.

## Features

- 🚀 **High Performance** - In-memory caching with direct JSON file manipulation
- 🌍 **Multi-language Support** - Manage translations for unlimited languages
- 🤖 **Auto Translation** - AI-powered automatic translation using configurable APIs
- 📦 **Batch Operations** - Translate multiple entries at once
- 🔄 **Real-time Sync** - Changes are immediately reflected in JSON files
- 📊 **RESTful API** - Full CRUD operations for translations
- 💾 **Export/Import** - Download all translations as a ZIP archive
- ⚡ **Zero Database** - No database required, works with JSON files
- 🎨 **Customizable** - Flexible configuration options
- 🖥️ **Web UI** - Beautiful web interface for managing translations (included!)

## Installation

### Global Installation

```bash
npm install -g i18n-translation-server
```

### Local Installation

```bash
npm install i18n-translation-server
# or
yarn add i18n-translation-server
# or
pnpm add i18n-translation-server
```

## Quick Start

### 1. Initialize a New Project

```bash
i18n-server init
```

This creates:
- `i18n.config.js` - Configuration file with API credentials
- `public/locales/` - Translation files directory

### 2. Configure

Edit `i18n.config.js` to add your API credentials and customize settings:

```javascript
const path = require('path');

module.exports = {
    port: 3001,
    host: 'localhost',
    localesPath: path.join(__dirname, 'public/locales'),
    staticPath: path.join(__dirname, 'public'),
    
    // Languages and translation files are auto-discovered from localesPath
    // The server will automatically scan and detect all languages and files
    
    autoOpenBrowser: true,
    translation: {
        apiUrl: 'https://your-api-url.com/v1/chat/completions',
        apiKey: 'Bearer your_api_key_here',
        prompt: 'You are a professional translator...',
        model: 'qwen-plus',
    },
};
```

### 3. Start the Server

```bash
# Auto-detect i18n.config.js in current directory
i18n-server start

# Or specify a config file explicitly
i18n-server start -c i18n.config.js

# Or use inline options
i18n-server start -p 3001 -l public/locales
```

**Note:** The server automatically looks for `i18n.config.js` in the current directory if no config file is specified.

### 4. Open the Web UI

The server automatically opens your browser to the management interface. Or manually visit:

```
http://localhost:3001/translation-manager.html
```

**Web UI Features:**
- 🔍 Search and filter translations
- ✏️ Add, edit, and delete translations
- 🤖 One-click auto-translation
- 📦 Batch translate multiple entries
- 📁 Create new translation files
- 📥 Export all translations as ZIP
- 🌐 Support for all configured languages

## API Reference

### Get All Translations

```http
GET /api/translations
```

Query parameters:
- `q` - Search term (searches keys and values)
- `file` - Filter by file name
- `key` - Filter by key

### Get Single Translation

```http
GET /api/translations/:id
```

### Add Translation

```http
POST /api/translations
Content-Type: application/json

{
  "key": "welcome_message",
  "file": "common",
  "translations": {
    "zh": "欢迎",
    "en": "Welcome"
  }
}
```

### Update Translation

```http
PUT /api/translations/:id
Content-Type: application/json

{
  "key": "welcome_message",
  "file": "common",
  "translations": {
    "zh": "欢迎",
    "en": "Welcome",
    "es": "Bienvenido"
  }
}
```

### Delete Translation

```http
DELETE /api/translations/:id
```

### Auto-translate

```http
POST /api/auto-translate/:id
Content-Type: application/json

{
  "sourceLanguage": "zh",
  "targetLanguages": ["en", "es", "fr"]
}
```

### Translate Only (without saving)

```http
POST /api/translate-only
Content-Type: application/json

{
  "text": "Hello World",
  "sourceLanguage": "en",
  "targetLanguages": ["zh", "es", "fr"]
}
```

### Batch Translate

```http
POST /api/batch-translate
Content-Type: application/json

{
  "ids": [1, 2, 3],
  "sourceLanguage": "zh",
  "targetLanguages": ["en", "es"]
}
```

### Create New File

```http
POST /api/create-file
Content-Type: application/json

{
  "fileName": "new-page"
}
```

### Refresh Cache

```http
POST /api/refresh-cache
```

### Export Data

```http
GET /api/export-data
```

Downloads a ZIP file containing all translation files.

### Get Languages

```http
GET /api/languages
```

### Get Files

```http
GET /api/files
```

## Programmatic Usage

You can also use this package programmatically in your Node.js application:

```javascript
const TranslationServer = require('i18n-translation-server');

const config = {
    port: 3001,
    host: 'localhost',
    localesPath: './public/locales', // Auto-discovers languages and files
    translation: {
        apiUrl: 'your_api_url',
        apiKey: 'your_api_key',
        prompt: 'your_prompt',
    },
};

const server = new TranslationServer(config);

// Start server
server.start().then(() => {
    console.log('Server started!');
});

// Stop server
// server.stop();
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `port` | number | `3001` | Server port |
| `host` | string | `'localhost'` | Server host |
| `localesPath` | string | `'public/locales'` | Path to locales folder |
| `staticPath` | string | `'public'` | Path to static files |
| `languages` | array | `['zh', 'en']` | Supported languages |
| `translationFiles` | array | `['common']` | Translation file names |
| `autoOpenBrowser` | boolean | `true` | Auto-open browser on start |
| `translation.apiUrl` | string | - | Translation API URL |
| `translation.apiKey` | string | - | Translation API key |
| `translation.prompt` | string | - | Translation prompt |
| `translation.model` | string | `'qwen-plus'` | Translation model |

## File Structure

Your translation files should be organized as follows:

```
public/
└── locales/
    ├── zh/
    │   ├── common.json
    │   ├── home.json
    │   └── about.json
    ├── en/
    │   ├── common.json
    │   ├── home.json
    │   └── about.json
    └── es/
        ├── common.json
        ├── home.json
        └── about.json
```

Each JSON file contains key-value pairs:

```json
{
  "welcome": "Welcome",
  "goodbye": "Goodbye",
  "hello_world": "Hello World"
}
```

## CLI Commands

### `i18n-server start`

Start the translation server.

Options:
- `-c, --config <path>` - Path to config file
- `-p, --port <number>` - Server port (default: 3001)
- `-h, --host <string>` - Server host (default: localhost)
- `-l, --locales <path>` - Path to locales folder (default: public/locales)
- `--no-browser` - Do not auto-open browser

### `i18n-server init`

Initialize a new translation project.

Options:
- `-d, --dir <path>` - Project directory (default: .)

## Best Practices

1. **Version Control** - Keep your translation files in Git
2. **Backup** - Regularly export your translations using the export API
3. **Organization** - Use separate files for different pages/features
4. **Naming** - Use clear, descriptive keys (e.g., `homepage_hero_title`)
5. **Source Language** - Maintain one source language (usually `zh` or `en`)
6. **Auto-translate** - Review auto-translated content before deploying

## Translation API Setup

This package supports any translation API that accepts the following format:

```javascript
{
  model: 'model-name',
  messages: [
    {
      role: 'system',
      content: 'your-prompt'
    },
    {
      role: 'user',
      content: JSON.stringify({
        language: 'target-language',
        content: ['text-to-translate']
      })
    }
  ]
}
```

The API should return:

```javascript
{
  choices: [
    {
      message: {
        content: JSON.stringify({
          content: ['translated-text']
        })
      }
    }
  ]
}
```

## Troubleshooting

### Port Already in Use

If port 3001 is already in use, specify a different port:

```bash
i18n-server start -p 3002
```

### Locales Folder Not Found

Make sure your `localesPath` configuration points to the correct directory. Use absolute paths if needed:

```javascript
localesPath: path.join(__dirname, 'public/locales')
```

### Translation API Errors

Check your `i18n.config.js` file and ensure:
- `translation.apiUrl` is correct
- `translation.apiKey` contains a valid API key
- `translation.prompt` is properly formatted

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
