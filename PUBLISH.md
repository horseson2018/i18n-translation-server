# Publishing Guide

This guide explains how to publish the `i18n-translation-server` package to npm.

## Prerequisites

1. **npm account** - Create one at https://www.npmjs.com/signup
2. **npm CLI** - Should be installed with Node.js
3. **Repository** - Optional but recommended

## Before Publishing

### 1. Update package.json

Make sure these fields are filled:

```json
{
  "name": "i18n-translation-server",
  "version": "1.0.0",
  "description": "A powerful i18n translation management server",
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/i18n-translation-server.git"
  },
  "bugs": {
    "url": "https://github.com/yourusername/i18n-translation-server/issues"
  },
  "homepage": "https://github.com/yourusername/i18n-translation-server#readme"
}
```

### 2. Test the package locally

#### Using npm link:

```bash
# In the package directory
npm link

# In a test project
npm link i18n-translation-server

# Test the CLI
i18n-server init
i18n-server start
```

#### Using local installation:

```bash
# In a test project
npm install /path/to/i18n-translation-server

# Test it
npx i18n-server init
```

### 3. Verify package contents

Check what will be published:

```bash
npm pack --dry-run
```

This shows all files that will be included. Make sure:
- No sensitive files (`.env`, credentials)
- No unnecessary files (node_modules, test files)
- All required files (lib/, bin/, README.md, etc.)

### 4. Update .npmignore (optional)

Create `.npmignore` if you need to exclude files:

```
# .npmignore
examples/
test/
*.test.js
.env*
.DS_Store
```

## Publishing Steps

### Step 1: Login to npm

```bash
npm login
```

Enter your:
- Username
- Password
- Email
- One-time password (if 2FA is enabled)

### Step 2: Run tests (if any)

```bash
npm test
```

### Step 3: Publish

For first-time publishing:

```bash
npm publish
```

For scoped packages (e.g., `@yourname/i18n-translation-server`):

```bash
npm publish --access public
```

### Step 4: Verify publication

Check on npm:

```
https://www.npmjs.com/package/i18n-translation-server
```

Test installation:

```bash
# In a new directory
mkdir test-install && cd test-install
npm install i18n-translation-server
npx i18n-server --version
```

## Publishing Updates

### 1. Update version

Use semantic versioning (semver):

```bash
# Patch release (bug fixes): 1.0.0 -> 1.0.1
npm version patch

# Minor release (new features): 1.0.0 -> 1.1.0
npm version minor

# Major release (breaking changes): 1.0.0 -> 2.0.0
npm version major
```

### 2. Update CHANGELOG.md

Document changes:

```markdown
## [1.0.1] - 2024-01-XX

### Fixed
- Fixed issue with translation caching
- Improved error messages

### Added
- Added support for custom language maps
```

### 3. Commit and tag

```bash
git add .
git commit -m "chore: release v1.0.1"
git push
git push --tags
```

### 4. Publish update

```bash
npm publish
```

## Using GitHub Actions for Automated Publishing

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - run: npm install
      
      - run: npm test
        if: steps.test.outputs.tests != ''
      
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Then:
1. Create an npm access token at https://www.npmjs.com/settings/tokens
2. Add it to GitHub Secrets as `NPM_TOKEN`
3. Create a GitHub release to trigger publishing

## Alternative: Private npm Registry

If you want to keep the package private:

### Option 1: npm private packages

```bash
npm publish --access restricted
```

Requires a paid npm account.

### Option 2: GitHub Packages

Update `package.json`:

```json
{
  "name": "@yourusername/i18n-translation-server",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

Publish:

```bash
npm publish
```

### Option 3: Verdaccio (self-hosted)

Set up your own npm registry:

```bash
npm install -g verdaccio
verdaccio
```

Configure in `.npmrc`:

```
registry=http://localhost:4873/
```

## Post-Publishing Checklist

- [ ] Package appears on npm website
- [ ] README displays correctly
- [ ] Installation works: `npm install i18n-translation-server`
- [ ] CLI works: `npx i18n-server --version`
- [ ] Update project README with installation instructions
- [ ] Announce release (Twitter, blog, etc.)
- [ ] Monitor for issues and bug reports

## Unpublishing (Emergency Only)

⚠️ **Warning:** Unpublishing is not recommended and has restrictions.

```bash
# Unpublish specific version (within 72 hours)
npm unpublish i18n-translation-server@1.0.0

# Unpublish all versions (use with extreme caution!)
npm unpublish i18n-translation-server --force
```

**Better alternative:** Publish a new patch version with fixes.

## Best Practices

1. **Always test locally** before publishing
2. **Use semantic versioning** consistently
3. **Keep CHANGELOG.md** updated
4. **Write comprehensive README**
5. **Include examples** and documentation
6. **Set up CI/CD** for automated testing and publishing
7. **Monitor downloads** and issues
8. **Respond to issues** promptly
9. **Deprecate old versions** when needed
10. **Never publish secrets** or credentials

## Troubleshooting

### Error: Package name already exists

Choose a different name or use a scoped package:

```json
{
  "name": "@yourusername/i18n-translation-server"
}
```

### Error: 403 Forbidden

Make sure you're logged in:

```bash
npm whoami
npm login
```

### Error: Version already exists

Update the version:

```bash
npm version patch
npm publish
```

## Resources

- [npm Documentation](https://docs.npmjs.com/)
- [Semantic Versioning](https://semver.org/)
- [npm Package Best Practices](https://docs.npmjs.com/packages-and-modules)
- [Creating and Publishing Scoped Packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages)
