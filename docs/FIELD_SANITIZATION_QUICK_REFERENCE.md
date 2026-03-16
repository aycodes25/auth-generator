# Field Sanitization Quick Reference

## Quick Start

No configuration needed! The sanitization happens automatically when generating backends.

## What Gets Sanitized

Invalid SQL column names are automatically fixed:

| Invalid Name | Becomes | Reason |
|---|---|---|
| `form-control` | `form_control` | Hyphens not allowed |
| `search input` | `search_input` | Spaces not allowed |
| `first@name` | `first_name` | Special chars not allowed |
| `user.email` | `user_email` | Dots not allowed |
| `123field` | `_123field` | Names can't start with digits |
| `__name__` | `name` | Excessive underscores cleaned up |

## How to Test

### Unit Tests (Sanitization Logic)
```bash
npm run build
node test-sanitization.mjs
```

**Expected Output:**
```
✨ All tests passed!
12 passed, 0 failed out of 12
```

### Integration Tests (Full Workflow)
```bash
npm run build
node test-integration-sanitization.mjs
```

**Expected Output:**
```
🎉 Integration test completed successfully!
✅ All SQL valid identifiers: YES
```

## Real-World Example

### Frontend Form
```html
<form id="signupForm">
  <input name="form-control" placeholder="Username">
  <input name="first@name" type="email">
  <input name="phone#" type="tel">
</form>
```

### What Happens Behind the Scenes

1. **Scanner detects:**
   ```
   Fields: form-control, first@name, phone#
   ```

2. **Tailor sanitizes:**
   ```
   ⚙️ Field name normalized:
     form-control → form_control
     first@name → first_name
     phone# → phone
   ```

3. **Database schema uses sanitized names:**
   ```sql
   CREATE TABLE users (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     email TEXT UNIQUE NOT NULL,
     password TEXT NOT NULL,
     form_control TEXT,
     first_name TEXT,
     phone TEXT,
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
   )
   ```

4. **API request handling:**
   ```javascript
   // Request from frontend
   POST /api/signup
   {
     "form-control": "john_doe",
     "first@name": "john@example.com",
     "phone#": "555-1234"
   }
   
   // Mapped to database
   INSERT INTO users (form_control, first_name, phone)
   VALUES (?, ?, ?)
   ```

## Error Handling

If SQLite encounters invalid syntax during initialization:

**Before:**
```
❌ Error creating users table: near "-": syntax error
```

**After:**
```
⚠️ Invalid column names detected. Retrying with sanitized names...
✅ Auto-fix applied successfully
```

## Used In Generated Projects

When you generate a backend with Auth-Gen, the following files have sanitization support:

1. **`utils/db.ts`** - Error handling and auto-retry
2. **`controllers/authController.ts`** - Field mapping helper
3. **`routes/auth.ts`** - Request handling

## Sanitization Rules

All column names follow the SQL standard pattern: `[a-z0-9_]+`

```
Step 1: Lowercase all characters
  "Form-Control" → "form-control"

Step 2: Replace special characters with underscores
  "form-control" → "form_control"

Step 3: Collapse multiple underscores
  "name__field" → "name_field"

Step 4: Remove leading/trailing underscores
  "_name_" → "name"

Step 5: Prefix if starts with digit
  "123name" → "_123name"
```

## For Development

### Adding Sanitization to Custom Code

```typescript
import { 
  sanitizeColumn, 
  createFieldMapping, 
  logFieldNormalization 
} from './utils/sanitizeColumn';

// Single field
const dbName = sanitizeColumn("user-name");
console.log(dbName); // → "user_name"

// Multiple fields
const mapping = createFieldMapping(
  ["form-control", "search-input", "email"]
);
// → { 
//   "form-control": "form_control",
//   "search-input": "search_input", 
//   "email": "email"
// }

// Show changes to user
logFieldNormalization(mapping);
```

## Troubleshooting

### Fields not appearing in database?
- Check the sanitization: `"form-control"` becomes `"form_control"`
- Use the sanitized name in SELECT queries
- Verify mapping in `tailor.ts` output

### API returning wrong field names?
- Frontend sends original names: `"form-control": "value"`
- API should use sanitized names: `form_control: "value"`
- Check the field mapping export in `db.ts`

### Build errors after changes?
```bash
npm run build
npm run dev  # Test in development mode
```

## Supported Databases

Currently implemented for:
- ✅ SQLite (Express.js)
- 🔄 NestJS (under review)
- 📋 PostgreSQL (planned)
- 📋 MySQL (planned)

## Performance

No performance impact:
- Sanitization happens once during generation
- Runtime database operations are unaffected
- Regex patterns are simple and fast
- No database migrations needed

## Backward Compatibility

✅ Existing projects unaffected
✅ Valid field names remain unchanged
✅ `email`, `password`, `name` work as before
✅ No breaking changes to API

## Contact & Support

For issues or questions about field sanitization:
- Check [SANITIZATION_IMPLEMENTATION.md](./SANITIZATION_IMPLEMENTATION.md)
- Review test files for examples
- Check generated project comments
