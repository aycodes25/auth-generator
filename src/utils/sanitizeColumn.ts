/**
 * ============================================================
 * Column Name Sanitization Utility
 * ============================================================
 * Sanitizes database column names to comply with SQL standards
 * Removes/replaces invalid characters (hyphens, spaces, symbols)
 * Ensures all generated column names follow [a-z0-9_]+ pattern
 */

/**
 * Sanitize a database column name
 * Only converts names with invalid characters. Preserves valid camelCase.
 * @param name - Original field name
 * @returns Sanitized field name safe for SQL
 * 
 * Examples:
 *   "username" → "username" (already valid)
 *   "confirmPassword" → "confirmPassword" (valid camelCase)
 *   "form-control" → "form_control" (invalid chars)
 *   "user name" → "user_name" (spaces)
 *   "123field" → "_123field" (leading digit)
 */
export function sanitizeColumn(name: string): string {
  // Check if already valid: starts with letter/underscore, contains only alphanumeric + underscore
  const isAlreadyValid = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
  if (isAlreadyValid) {
    return name; // Keep as-is (preserves camelCase)
  }

  // Apply sanitization only if name has invalid characters
  return name
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, "_") // Replace invalid chars with underscores
    .replace(/_+/g, "_") // Collapse multiple underscores
    .replace(/^_+|_+$/g, "") // Remove leading/trailing underscores
    .replace(/^(\d)/, "_$1"); // Prefix with underscore if starts with digit
}

/**
 * Create a mapping between original and sanitized field names
 * @param fields - Array of original field names
 * @returns Object mapping original names to sanitized names
 */
export function createFieldMapping(
  fields: string[]
): Record<string, string> {
  const mapping: Record<string, string> = {};
  fields.forEach((field) => {
    mapping[field] = sanitizeColumn(field);
  });
  return mapping;
}

/**
 * Log field name normalization with visual formatting
 * @param mapping - Original to sanitized field mapping
 */
export function logFieldNormalization(
  mapping: Record<string, string>
): void {
  const hasChanges = Object.entries(mapping).some(
    ([original, sanitized]) => original !== sanitized
  );

  if (!hasChanges) return;

  console.log(
    "\n⚙️  Field name normalization:\n"
  );
  Object.entries(mapping).forEach(([original, sanitized]) => {
    if (original !== sanitized) {
      console.log(`  ${original} → ${sanitized}`);
    }
  });
  console.log();
}
