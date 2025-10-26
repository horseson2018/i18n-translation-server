#!/usr/bin/env node

const { Command } = require("commander")
const path = require("path")
const fs = require("fs")
const { exec } = require("child_process")
const TranslationServer = require("../lib/server")

// Load environment variables
require("dotenv").config()

const program = new Command()

program
    .name("i18n-server")
    .description("A powerful i18n translation management server")
    .version("1.0.0")

program
    .command("start")
    .description("Start the translation server")
    .option("-c, --config <path>", "Path to config file")
    .option("-p, --port <number>", "Server port", "3001")
    .option("-h, --host <string>", "Server host", "localhost")
    .option("-l, --locales <path>", "Path to locales folder", "public/locales")
    .option("--no-browser", "Do not auto-open browser")
    .action(async (options) => {
        let config = {}

        // Determine config file path
        let configPath
        if (options.config) {
            // Use specified config file
            configPath = path.resolve(process.cwd(), options.config)
        } else {
            // Auto-detect config file in current directory
            const defaultConfigPath = path.join(process.cwd(), "i18n.config.js")
            if (fs.existsSync(defaultConfigPath)) {
                configPath = defaultConfigPath
            }
        }

        // Load config file
        if (configPath) {
            if (fs.existsSync(configPath)) {
                console.log(`📄 Loading config from: ${configPath}`)
                config = require(configPath)
            } else {
                console.error(`❌ Config file not found: ${configPath}`)
                console.log(
                    '\n💡 Tip: Run "i18n-server init" to create a config file'
                )
                process.exit(1)
            }
        } else {
            console.log("⚠️  No config file found, using default settings")
            console.log(
                '💡 Tip: Run "i18n-server init" to create i18n.config.js'
            )
        }

        // Override with command line options
        config = {
            ...config,
            port: parseInt(options.port) || config.port,
            host: options.host || config.host,
            localesPath: options.locales
                ? path.resolve(process.cwd(), options.locales)
                : config.localesPath,
            autoOpenBrowser:
                options.browser !== false && config.autoOpenBrowser !== false,
        }

        // Ensure locales path exists
        if (!fs.existsSync(config.localesPath)) {
            console.error(`❌ Locales folder not found: ${config.localesPath}`)
            console.log("Creating locales folder...")
            fs.mkdirSync(config.localesPath, { recursive: true })
        }

        // Create and start server
        const server = new TranslationServer(config)

        try {
            await server.start()

            // Auto-open browser if enabled
            if (config.autoOpenBrowser) {
                const url = `http://${config.host}:${config.port}`
                setTimeout(() => {
                    openBrowser(url)
                }, 1000)
            }

            // Handle shutdown
            process.on("SIGINT", async () => {
                console.log("\n🛑 Shutting down server...")
                await server.stop()
                process.exit(0)
            })

            process.on("SIGTERM", async () => {
                console.log("\n🛑 Shutting down server...")
                await server.stop()
                process.exit(0)
            })
        } catch (error) {
            console.error("❌ Failed to start server:", error.message)
            process.exit(1)
        }
    })

program
    .command("init")
    .description("Initialize a new translation project")
    .option("-d, --dir <path>", "Project directory", ".")
    .action((options) => {
        const projectDir = path.resolve(process.cwd(), options.dir)
        console.log(`📦 Initializing translation project in: ${projectDir}`)

        // Create config file
        const configPath = path.join(projectDir, "i18n.config.js")
        if (!fs.existsSync(configPath)) {
            const configTemplate = `
const path = require('path');

module.exports = {
    port: 3001,
    host: 'localhost',
    localesPath: path.join(__dirname, 'public/locales'),
    staticPath: path.join(__dirname, 'public'),
    autoOpenBrowser: true,
    translation: {
        // Replace with your actual API credentials
        apiUrl: process.env.TRANSLATION_API_URL,
        apiKey: process.env.TRANSLATION_API_KEY,
        prompt: process.env.TRANSLATION_PROMPT,
        model: process.env.TRANSLATION_MODEL,
    },
};
`
            fs.writeFileSync(configPath, configTemplate, "utf8")
            console.log(`✅ Created config file: ${configPath}`)
        } else {
            console.log(`⚠️  Config file already exists: ${configPath}`)
        }

        // Create locales directory structure
        const localesDir = path.join(projectDir, "public/locales")
        const languages = ["zh", "en"]
        const files = ["common"]

        languages.forEach((lang) => {
            const langDir = path.join(localesDir, lang)
            if (!fs.existsSync(langDir)) {
                fs.mkdirSync(langDir, { recursive: true })
                files.forEach((file) => {
                    const filePath = path.join(langDir, `${file}.json`)
                    fs.writeFileSync(
                        filePath,
                        JSON.stringify({}, null, 4),
                        "utf8"
                    )
                })
                console.log(`✅ Created language folder: ${langDir}`)
            }
        })

        // Create .env file
        const envPath = path.join(projectDir, ".env")
        if (!fs.existsSync(envPath)) {
            const envTemplate = `# Translation API Configuration
TRANSLATION_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
TRANSLATION_API_KEY=Bearer your_api_key_here
TRANSLATION_PROMPT=You are a professional translator. I will provide you with a JSON string containing "language" and "content" fields. Please translate the content to the specified language accurately while maintaining the original meaning, tone, and context. Return the result as a JSON string with the same structure.
TRANSLATION_MODEL=qwen-plus
`
            fs.writeFileSync(envPath, envTemplate, "utf8")
            console.log(`✅ Created .env file: ${envPath}`)
        } else {
            console.log(`⚠️  .env file already exists: ${envPath}`)
        }

        console.log("\n🎉 Initialization complete!")
        console.log("\nNext steps:")
        console.log("  1. Edit .env file with your translation API credentials")
        console.log("  2. Run: i18n-server start -c i18n.config.js")
    })

program.parse()

/**
 * Open browser
 */
function openBrowser(url) {
    const start =
        process.platform === "darwin"
            ? "open"
            : process.platform === "win32"
            ? "start"
            : "xdg-open"

    exec(`${start} ${url}`, (error) => {
        if (error) {
            console.log(`⚠️  Unable to auto-open browser: ${error.message}`)
            console.log(`Please visit manually: ${url}`)
        } else {
            console.log(`🌐 Browser opened: ${url}`)
        }
    })
}
