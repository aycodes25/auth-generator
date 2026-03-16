# Auto-Fix Features in Auth-Gen

## Overview

Auth-Gen now includes **TWO powerful auto-fix systems** that make the backend generator production-safe and developer-friendly:

1. **Field Sanitization** - Fixes invalid database column names
2. **TypeScript Stripping** - Fixes Babel parsing errors in frontend code

Both features work **automatically with zero configuration**.

---

## Feature 1: Field Sanitization 🛡️

**What it fixes:** Invalid SQLite column names

### Problem
```javascript
// Frontend form with hyphens
<input name="form-control" />
<input name="search-input" />

// ==> Error: SQLITE_ERROR: near "-": syntax error
```

### Solution
- Automatically detects invalid field names (hyphens, spaces, symbols)
- Converts them to SQL-safe names before building schema
- Shows transparent mapping to users
- Auto-retries on error with sanitized names

### Example
```
Input:  form-control, search-input
Output: form_control, search_input
✅ Database created successfully
```

**Documentation:** [SANITIZATION_IMPLEMENTATION.md](./SANITIZATION_IMPLEMENTATION.md)

---

## Feature 2: TypeScript Stripping ✨

**What it fixes:** TypeScript syntax in JSX files

### Problem
```javascript
// Generated code has TypeScript in .jsx files
const formData = new FormData(e.target as HTMLFormElement);
                                        ^^^^^^^^^^^^^^^^
                                   Babel can't parse this!

// Error: Unexpected token, expected ","
```

### Solution
- Automatically detects TypeScript syntax
- Strips type assertions, annotations, and generics
- Preserves all JavaScript logic
- Shows what was cleaned up

### Example
```
Before: new FormData(e.target as HTMLFormElement);
After:  new FormData(e.target);
Status: ✨ TypeScript syntax auto-fixed
```

**Documentation:** [TYPESCRIPT_STRIPPING.md](./TYPESCRIPT_STRIPPING.md)

---

## How They Work Together

### Auto-Generation Flow

```
User runs: npx auth-gen
    ↓
┌─ FIELD SANITIZATION ─┐
│ 1. Scan frontend    
│ 2. Find field names
│ 3. Check for hyphens/symbols
│ 4. Generate safe schema
└─────────────────────┘
    ↓
┌─ TYPESCRIPT STRIPPING ─┐
│ 1. Write JSX files
│ 2. Detect TS syntax
│ 3. Strip 'as Type'
│ 4. Remove annotations
└────────────────────────┘
    ↓
Generated Project Ready ✅
```

### Real-World Example

**Frontend Input:**
```html
<!-- User's form with various field names -->
<form id="signupForm">
  <input name="form-control" />
  <input name="search-input" />
  <input name="email" />
</form>
```

**Process:**

1. **Scanning**
   ```
   Found fields: form-control, search-input, email
   Sanitized: form_control, search_input, email
   ```

2. **Schema Generation**
   ```sql
   CREATE TABLE users (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     email TEXT,
     form_control TEXT,
     search_input TEXT
   )
   ```

3. **Code Injection (with auto-fix)**
   ```javascript
   // Original would be:
   const formData = new FormData(e.target as HTMLFormElement);
   
   // Auto-stripped to:
   const formData = new FormData(e.target);
   ```

4. **Result**
   ```
   ✅ Field names sanitized
   ✨ TypeScript syntax removed
   🚀 Project ready to run
   ```

---

## Configuration

### Off-by-Default? NO ❌
Both features are **always on** for production safety.

### Customize? 
Not needed - both work fully automatically. Just run:
```bash
npx auth-gen
```

---

## What Gets Fixed Automatically

### Field Sanitization
| Original | Becomes | Reason |
|----------|---------|--------|
| `form-control` | `form_control` | Hyphens removed |
| `search input` | `search_input` | Spaces removed |
| `email@field` | `email_field` | Special chars removed |
| `123field` | `_123field` | Prefixed with underscore |

### TypeScript Stripping
| TypeScript | JavaScript | Removed |
|------------|----------|---------|
| `e.target as HTMLFormElement` | `e.target` | Type assertion |
| `data: string` | `data` | Type annotation |
| `Record<string, any>` | (removed) | Generic type |
| `React.FormEvent<T>` | (cleaned) | Complex type |

---

## Usage in Generated Projects

Once a project is generated, you don't need to do anything special:

### Database Layer
```typescript
// templates/express/sqlite/utils/db.ts
// Already handles:
// - Sanitized column names
// - Error recovery for syntax errors
// - Auto-retry logic
```

### Controller Layer
```typescript
// templates/express/sqlite/controllers/authController.ts
// Already uses:
// - Sanitized field names in queries
// - Proper error handling
// - Consistent naming
```

### Frontend
```javascript
// Your JSX files
// Automatically cleaned of:
// - TS type assertions
// - TS annotations
// - Invalid syntax for Babel
```

---

## Testing

Both features are thoroughly tested:

### Field Sanitization
```bash
npm run build
node test-sanitization.mjs        # 12 unit tests
node test-integration-sanitization.mjs  # 7-step workflow
```

### TypeScript Stripping
```bash
npm run build
node test-typescript-stripping.mjs # Detection + stripping tests
```

---

## Error Messages You Won't See Anymore

### 1. Field Name Errors (FIXED BY SANITIZATION)
```
❌ SQLITE_ERROR: near "-": syntax error
❌ Column name "form-control" is invalid
```

### 2. Babel Parsing Errors (FIXED BY TS STRIPPING)
```
❌ Unexpected token, expected ","
❌ Plugin: vite:react-babel - Unexpected identifier
```

---

## Benefits

### For Developers
✅ **No more TypeScript errors in JSX**  
✅ **No more SQL syntax errors**  
✅ **Zero configuration needed**  
✅ **Transparent logging of changes**  

### For Production
✅ **Self-healing architecture**  
✅ **Automatic error recovery**  
✅ **Safe naming conventions**  
✅ **Babel-compatible output**  

### For Maintenance
✅ **Clear logging of all changes**  
✅ **Consistent across projects**  
✅ **Well-documented code**  
✅ **Comprehensive test coverage**  

---

## Related Documentation

- [Field Sanitization Details](./SANITIZATION_IMPLEMENTATION.md)
- [TypeScript Stripping Details](./TYPESCRIPT_STRIPPING.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- [Complete Change Log](./CHANGE_LOG.md)

---

## Quick Reference

### What Auto-Fixes Are Included?

| Issue | Feature | Status |
|-------|---------|--------|
| Invalid column names | Field Sanitization | ✅ Implemented |
| TypeScript in JSX | TypeScript Stripping | ✅ Implemented |
| SQL syntax errors | Error Handling + Retry | ✅ Implemented |
| Babel parsing errors | Type assertion removal | ✅ Implemented |

### When Do They Run?

| Feature | When | Trigger |
|---------|------|---------|
| Field Sanitization | Backend generation | `scanFrontend()` → `tailorBackend()` |
| TypeScript Stripping | File writing | `plugFrontend()` + `plugFile()` |
| Error Handling | Runtime | `initDb()` execution |

### How Transparent Is It?

✅ **Fully transparent** - Every change is logged to console  
✅ **User-friendly** - Clear messages about what was fixed  
✅ **Non-intrusive** - Only changes generated/injected code  

---

## Status

✅ **Both features fully implemented**  
✅ **Comprehensive test coverage**  
✅ **Production-ready**  
✅ **Zero configuration**  
✅ **Automatic by default**  

---

**These features make Auth-Gen production-safe, error-resistant, and developer-friendly! 🚀**
