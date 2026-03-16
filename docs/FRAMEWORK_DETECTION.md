# Framework Detection and Intelligent Analysis

## Overview

Auth-Gen v2.0 introduces intelligent framework detection and file analysis to provide **precise, professional-grade API integration** into frontend projects.

## Key Features

### 1. **Automatic Framework Detection**
The new `frameworkDetector.ts` utility automatically identifies:
- **Framework Type**: React, Vue, Angular, Svelte, or Plain JS
- **Project Type**: Next.js (App Router/Pages Router), Nuxt, Create React App, Vite, CRA
- **TypeScript Support**: Whether the project uses TypeScript
- **Package Manager**: npm, yarn, pnpm, or bun
- **File Extensions**: Appropriate `.js`, `.ts`, `.jsx`, `.tsx`, or `.vue`
- **ESM Support**: Module system detection
- **Configuration Files**: Detected config files for the framework

### 2. **Intelligent File Analysis**
The `fileAnalyzer.ts` utility categorizes files by purpose:
- **Component Type Classification**: Hooks, services, pages, layouts, utilities
- **Form Detection**: Identifies login, signup, and generic forms
- **API Call Detection**: Finds existing API integrations
- **Event Handler Analysis**: Detects form submission handlers
- **Purposefulness Scoring**: Determines auth-relevance of each file

### 3. **Smart Injection Strategy**
Based on framework and file analysis, Auth-Gen selects the best approach:

| Framework | Strategy | Creates |
|-----------|----------|---------|
| React | Custom Hook (`useAuth`) | `src/hooks/useAuth.ts` |
| Vue | Composable (`useAuth`) | `src/composables/useAuth.ts` |
| Angular | Service (`AuthService`) | `src/services/auth.ts` |
| Svelte | Service (`authService`) | `src/services/auth.ts` |
| Plain JS | API Utility (`api.js`) | `src/api.js` |

## Workflow

### Step 1: Framework Detection
```typescript
const frameworkInfo = await detectFramework(frontendPath);
// Returns: { framework: "react", type: "vite", supportsTypeScript: true, ... }
```

### Step 2: File Analysis
```typescript
const fileAnalysis = await analyzeFiles(frontendPath, frameworkInfo);
// Returns: { loginComponents, signupComponents, apiServices, ... }
```

### Step 3: Integration Planning
```typescript
const plan = generateIntegrationPlan(
  frontendPath,
  frameworkInfo,
  fileAnalysis,
  backendUrl
);
// Returns: { strategy, filesToCreate, injectionPoints, ... }
```

### Step 4: Precise Injection
Auth-Gen creates professional API integration files and injects them only into correct locations:
- Creates framework-specific hooks/services
- Modifies only purposeful files
- Skips utility/layout files
- Prevents duplicate injections

## Benefits Over Legacy System

| Aspect | Legacy | v2.0 |
|--------|--------|------|
| **Accuracy** | Generic injection anywhere | Precise, framework-aware |
| **File Creation** | None | Creates professional hooks/services |
| **Framework Support** | All treated same | Framework-specific solutions |
| **TypeScript** | Basic handling | Full TS/JS support |
| **Duplicates** | Possible | Safeguarded |
| **Code Quality** | Basic | Production-ready |

## Example: React Project

### Input
```
MyReactApp/
├── src/
│   ├── components/
│   │   ├── Login.jsx
│   │   └── Signup.jsx
│   └── App.jsx
└── package.json
```

### Detection Result
```
Framework: react
Type: vite
TypeScript: false
```

### Generated Files
```
src/hooks/useAuth.js (created)
```

### Content of `useAuth.js`
```javascript
import { useState, useCallback } from 'react';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');
      if (data.token) localStorage.setItem('token', data.token);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Signup failed');
      if (data.token) localStorage.setItem('token', data.token);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { login, signup, loading, error };
}
```

### Modifications to Components
```javascript
// Login.jsx - BEFORE
function Login() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // old code
  };
  return <form onSubmit={handleSubmit}>...</form>;
}

// Login.jsx - AFTER
function Login() {
  const { login, loading, error } = useAuth(); // ← INJECTED
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Integration with useAuth hook
  };
  return <form onSubmit={handleSubmit}>...</form>;
}
```

## File Analysis Details

### File Type Classification
- **Component**: UI components (Login, Signup, Form)
- **Hook**: React hooks, Vue composables
- **Service**: API services, utility classes
- **Page**: Route pages
- **Utility**: Helper functions
- **Layout**: Layout components

### Purposefulness Scoring
A file is considered "purposeful" (auth-related) if it:
- Has "login", "signup", "auth" in filename
- Contains both a form AND an event handler
- Is a service/hook with auth-related content
- Is a component with form + API calls

## Configuration

### Detecting Your Framework
Auth-Gen automatically detects frameworks by checking:
1. `package.json` dependencies
2. Project directory structure
3. Configuration files
4. TypeScript support

### Supported Frameworks
- ✅ React (any setup: Vite, CRA, Next.js)
- ✅ Vue (any setup: Vite, Nuxt)
- ✅ Angular
- ✅ Svelte
- ✅ Plain JavaScript

## Migration from Legacy System

If you're upgrading from v1.x to v2.0:

1. **Automatic Detection**: No configuration needed
2. **Backward Compatible**: Legacy scanner still works
3. **Fallback**: If new system has issues, falls back to legacy
4. **Safe**: No files are deleted, only new ones are created

## Troubleshooting

### "Could not detect framework"
- Ensure `package.json` exists
- Check that you're in the project root
- Try specifying the path explicitly

### "No login/signup components found"
- Ensure your forms have "login" or "signup" in filename/content
- Check that forms have input fields
- Verify file extensions are recognized

### "Files not updated"
- Check file permissions
- Ensure files exist before injection
- Verify injection points are correctly identified

## Performance

- **Detection**: < 100ms
- **File Analysis**: Depends on project size (usually < 5s for 100 files)
- **Integration Planning**: < 100ms
- **Injection**: < 1s per file

## Next Steps

See [API_INTEGRATION_STRATEGY.md](./API_INTEGRATION_STRATEGY.md) for details on generated code patterns.
