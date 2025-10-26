# Integration Guide

This guide shows how to integrate the i18n-translation-server into your existing project.

## Method 1: Using the CLI (Recommended)

### Step 1: Install the package

```bash
# Global installation
pnpm add -g i18n-translation-server

# Or local installation
pnpm add -D i18n-translation-server
```

### Step 2: Initialize configuration

```bash
# In your project root
i18n-server init
```

This creates:
- `i18n.config.js` - Server configuration with API credentials
- `public/locales/` - Translation files directory

### Step 3: Configure your settings

Edit `i18n.config.js`:

```javascript
const path = require('path');

module.exports = {
    port: 3001,
    host: 'localhost',
    localesPath: path.join(__dirname, 'public/locales'),
    languages: ['zh', 'en', 'es', 'fr'],
    translationFiles: ['common', 'home', 'about'],
    translation: {
        apiUrl: 'https://your-api-url.com/v1/chat/completions',
        apiKey: 'Bearer your_api_key_here',
        prompt: 'You are a professional translator...',
    },
};
```

### Step 4: Start the server

```bash
i18n-server start -c i18n.config.js
```

Or add to `package.json`:

```json
{
  "scripts": {
    "translate": "i18n-server start -c i18n.config.js"
  }
}
```

Then run:

```bash
pnpm translate
```

## Method 2: Programmatic Integration

### Step 1: Install

```bash
pnpm add i18n-translation-server
```

### Step 2: Create a server script

Create `scripts/translation-server.js`:

```javascript
const TranslationServer = require('i18n-translation-server');
const path = require('path');
require('dotenv').config();

const config = {
    port: 3001,
    localesPath: path.join(__dirname, '../public/locales'),
    staticPath: path.join(__dirname, '../public'),
    languages: ['zh', 'en', 'es'],
    translationFiles: ['common', 'home'],
    translation: {
        apiUrl: 'https://your-api-url.com/v1/chat/completions',
        apiKey: 'Bearer your_api_key_here',
        prompt: 'You are a professional translator...',
    },
};

const server = new TranslationServer(config);
server.start();
```

### Step 3: Add npm script

In `package.json`:

```json
{
  "scripts": {
    "translate": "node scripts/translation-server.js"
  }
}
```

### Step 4: Run

```bash
pnpm translate
```

## Integration with Existing IMINI Project

For your current project at `/Users/luojianxiang/Desktop/dangbei/IMINI`:

### Step 1: Install locally

```bash
cd /Users/luojianxiang/Desktop/dangbei/IMINI
pnpm add -D i18n-translation-server
```

### Step 2: Create config

Create `i18n.config.js` in project root:

```javascript
const path = require('path');

module.exports = {
    port: 3001,
    host: 'localhost',
    localesPath: path.join(__dirname, 'public/locales'),
    staticPath: path.join(__dirname, 'public'),
    languages: [
        'zh', 'en', 'zh-TW', 'de', 'es', 'fr',
        'id', 'ja', 'ko', 'ms', 'pt', 'ru', 'th', 'vi'
    ],
    translationFiles: [
        'common', 'contact', 'credits', 'faq', 'footer',
        'home', 'manual', 'nano', 'pricing', 'settings',
        'subscriptionModal', 'tool', 'upload', 'sora',
        'google-veo3.1', 'halloween'
    ],
    autoOpenBrowser: true,
    translation: {
        apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        apiKey: 'Bearer your_api_key_here',
        prompt: 'You are a professional translator...',
        model: 'qwen-plus',
    },
};
```

### Step 3: Update package.json

Add script to `package.json`:

```json
{
  "scripts": {
    "translate-server": "i18n-server start -c i18n.config.js"
  }
}
```

### Step 4: Replace old script

You can now replace the old `scripts/translate-server/direct-translation-server.js` with this new package.

Remove the old files:
- `scripts/translate-server/direct-translation-server.js`
- `scripts/translate-server/json-server.config.js`
- `scripts/translate-server/routes.json`

### Step 5: Run

```bash
pnpm translate-server
```

## Using with Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .

EXPOSE 3001

CMD ["i18n-server", "start", "-c", "i18n.config.js"]
```

Run:

```bash
docker build -t translation-server .
docker run -p 3001:3001 -v $(pwd)/public/locales:/app/public/locales translation-server
```

## API Usage Examples

### Create a new translation

```bash
curl -X POST http://localhost:3001/api/translations \
  -H "Content-Type: application/json" \
  -d '{
    "key": "new_feature_title",
    "file": "home",
    "translations": {
      "zh": "新功能标题",
      "en": "New Feature Title"
    }
  }'
```

### Auto-translate

```bash
curl -X POST http://localhost:3001/api/auto-translate/1 \
  -H "Content-Type: application/json" \
  -d '{
    "sourceLanguage": "zh",
    "targetLanguages": ["en", "es", "fr"]
  }'
```

### Search translations

```bash
curl "http://localhost:3001/api/translations?q=welcome&file=home"
```

### Export all translations

```bash
curl -O http://localhost:3001/api/export-data
```

## Best Practices

1. **Keep translation server separate from main app** - Run it on a different port
2. **Use environment variables** - Never commit API keys to Git
3. **Regular backups** - Use the export API to backup translations
4. **Git workflow** - Commit translation changes separately
5. **Review auto-translations** - Always review AI-generated translations before production

## Troubleshooting

### Port conflict

If port 3001 is already in use:

```bash
i18n-server start -c i18n.config.js -p 3002
```

### Cannot find locales folder

Make sure `localesPath` in config points to the correct directory:

```javascript
localesPath: path.join(__dirname, 'public/locales')
```

### Translation API not working

Check your `i18n.config.js` file:

```javascript
translation: {
    apiUrl: 'https://your-api.com/v1/chat/completions',
    apiKey: 'Bearer your_api_key',
    prompt: 'Your translation prompt here',
}
```
