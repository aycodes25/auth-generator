# Auth-Gen Project Structure

## 📁 Clean & Organized Folder Layout

```
Auth-Gen/
├── src/                           # Source code
│   ├── index.ts                   # CLI entry point
│   └── utils/                     # Utility modules
│       ├── scanner.ts             # Frontend scanner
│       ├── copyTemplate.ts        # Template copying
│       ├── generateEnv.ts         # Environment setup
│       ├── injectDb.ts            # Database injection
│       ├── installDependencies.ts # NPM installer
│       ├── plugger.ts             # API code injection
│       ├── tailor.ts              # Backend customization
│       ├── sanitizeColumn.ts      # Field name sanitization
│       └── stripTypeScript.ts     # TypeScript removal
│
├── templates/                     # Backend templates
│   ├── express/
│   │   └── sqlite/                # Express + SQLite template
│   │       ├── server.ts
│   │       ├── controllers/
│   │       ├── middleware/
│   │       ├── routes/
│   │       ├── utils/
│   │       └── types/
│   ├── nestjs/
│   └── nextjs/
│
├── tests/                         # Test suite
│   ├── fixtures/                  # Test data & fixtures
│   │   ├── test-fallback.html
│   │   ├── test-fallback.js
│   │   └── test-fallback-scan.ts
│   ├── debug-scan.mjs             # Debug scanner output
│   ├── run-complete-test-report.mjs
│   ├── test-cli.mjs
│   ├── test-integration-sanitization.mjs
│   ├── test-new-generation-safety.mjs
│   ├── test-plugger-safeguards.mjs
│   ├── test-sanitization.mjs
│   ├── test-signup-fix.mjs
│   ├── test-tailor-modifications.mjs
│   ├── test-typescript-stripping.mjs
│   └── unit-test-utilities.mjs
│
├── docs/                          # Documentation
│   ├── AUTO_FIX_FEATURES.md       # Auto-fix system overview
│   ├── CHANGE_LOG.md              # Change history
│   ├── FIELD_SANITIZATION_FIX.md  # Field name fix guide
│   ├── FIELD_SANITIZATION_QUICK_REFERENCE.md
│   ├── IMPLEMENTATION_SUMMARY.md
│   ├── README_SANITIZATION.md
│   ├── SANITIZATION_IMPLEMENTATION.md
│   └── TYPESCRIPT_STRIPPING.md
│
├── dist/                          # Compiled JavaScript (generated)
├── mallbacknd/                    # Example generated backend
├── node_modules/                  # Dependencies
├── package.json                   # Project metadata
├── package-lock.json
├── tsconfig.json
└── README.md                      # Main project README
```

---

## 📂 Folder Purposes

### `/src` - Source Code
- **index.ts**: CLI entry point and main generator logic
- **utils/**: Reusable utility functions
  - `scanner.ts`: Scans frontend for form fields and API endpoints
  - `copyTemplate.ts`: Copies template files to destination
  - `generateEnv.ts`: Creates .env configuration files
  - `injectDb.ts`: Database initialization logic
  - `installDependencies.ts`: Manages NPM package installation
  - `plugger.ts`: Injects API code into frontend files
  - `tailor.ts`: Customizes backend based on frontend requirements
  - `sanitizeColumn.ts`: **Smart field name sanitization** (preserves camelCase)
  - `stripTypeScript.ts`: **Removes TypeScript syntax from JSX files**

### `/templates` - Backend Templates
Pre-configured backend starters:
- **express/sqlite/**: Express.js + SQLite (default)
  - Controllers, middleware, routes, database utilities
- **nestjs/**: NestJS framework template
- **nextjs/**: Next.js full-stack template
- **php/**: PHP backend option

### `/tests` - Test Suite
Comprehensive testing infrastructure:
- **Unit tests**: Individual function tests
- **Integration tests**: End-to-end workflow tests
- **Fixtures**: Sample HTML, JS, TS files for testing
- **Verification tests}: Validates code generation quality

Run all tests:
```bash
npm run test
# or individual tests:
node tests/test-sanitization.mjs
node tests/test-plugger-safeguards.mjs
node tests/test-new-generation-safety.mjs
```

### `/docs` - Documentation
Complete reference documentation:
- **AUTO_FIX_FEATURES.md**: Overview of automatic fixes
- **SANITIZATION_IMPLEMENTATION.md**: Technical details
- **TYPESCRIPT_STRIPPING.md**: TS removal feature guide
- **FIELD_SANITIZATION_FIX.md**: Field name bug fix explanation
- **CHANGE_LOG.md**: Detailed change history

---

## 🚀 Quick Start

### Generate a New Backend
```bash
npm run dev

? Select backend framework: Express
? Select database: SQLite
? Project name: my-backend
? Frontend path: ./path/to/frontend
```

### Run Tests
```bash
# All tests
node tests/run-complete-test-report.mjs

# Specific test suites
node tests/test-sanitization.mjs          # Field name sanitization
node tests/test-typescript-stripping.mjs   # TS syntax removal
node tests/test-plugger-safeguards.mjs     # Injection safety
node tests/test-new-generation-safety.mjs  # Generation validation
```

### Building
```bash
npm run build          # Compile TypeScript
```

---

## 🎯 Key Features

### ✅ Automatic Field Name Sanitization
- **Preserves** valid camelCase identifiers
- **Sanitizes** invalid characters (hyphens, spaces, etc.)
- **Smart detection** prevents over-sanitization
- Located: `src/utils/sanitizeColumn.ts`

### ✅ Automatic TypeScript Stripping
- Removes `as Type` assertions from JSX files
- Removes type annotations for Babel compatibility
- Prevents parsing errors in generated code
- Located: `src/utils/stripTypeScript.ts`

### ✅ Intelligent Code Injection
- Detects form IDs and function handlers
- Prevents duplicate injections
- Skips utility files (main.jsx, App.jsx, etc.)
- Only injects into actual component files
- Located: `src/utils/plugger.ts`

---

## 📊 File Organization Benefits

| Before | After |
|--------|-------|
| 30+ files in root | Clean 8 top-level items |
| Tests scattered | All in `/tests` |
| Docs mixed with code | All in `/docs` |
| Hard to navigate | Clear structure |

---

## 🔍 Documentation Map

| Question | File |
|----------|------|
| "What auto-fixes exist?" | `docs/AUTO_FIX_FEATURES.md` |
| "How does sanitization work?" | `docs/SANITIZATION_IMPLEMENTATION.md` |
| "TypeScript stripping details?" | `docs/TYPESCRIPT_STRIPPING.md` |
| "What was fixed recently?" | `docs/CHANGE_LOG.md` |
| "Quick reference?" | `docs/FIELD_SANITIZATION_QUICK_REFERENCE.md` |

---

## ✨ Maintained By

Auth-Gen CLI Tool v1.0.0+
- Smart field sanitization
- Automatic TypeScript stripping
- Intelligent code injection
- Production-ready templates

Last updated: February 16, 2026
