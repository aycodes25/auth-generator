/**
 * ============================================================
 * Sanitization Utility Tests
 * ============================================================
 * Tests for field name sanitization before database operations
 */

import {
  sanitizeColumn,
  createFieldMapping,
  logFieldNormalization,
} from "./dist/utils/sanitizeColumn.js";

// Test cases
const testCases = [
  { input: "form-control", expected: "form_control" },
  { input: "search-input", expected: "search_input" },
  { input: "user name", expected: "user_name" },
  { input: "first@name", expected: "first_name" },
  { input: "field#123", expected: "field_123" },
  { input: "normal_field", expected: "normal_field" },
  { input: "CamelCase", expected: "camelcase" },
  { input: "___multiple___", expected: "multiple" },
  { input: "123start", expected: "_123start" },
  { input: "field-with-many-hyphens", expected: "field_with_many_hyphens" },
  { input: "special!@#$%chars", expected: "special_chars" },
  { input: "   leading_trailing   ", expected: "leading_trailing" },
];

function runTests() {
  console.log("\n🧪 Running Sanitization Tests...\n");

  let passed = 0;
  let failed = 0;

  testCases.forEach(({ input, expected }) => {
    const result = sanitizeColumn(input);
    const isPass = result === expected;

    if (isPass) {
      console.log(`✅ PASS: "${input}" → "${result}"`);
      passed++;
    } else {
      console.log(
        `❌ FAIL: "${input}" → "${result}" (expected "${expected}")`
      );
      failed++;
    }
  });

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length}\n`);

  if (failed === 0) {
    console.log("✨ All tests passed!\n");
  }
}

// Test field mapping
function testFieldMapping() {
  console.log("📋 Testing Field Mapping...\n");

  const fields = ["form-control", "search-input", "username", "password"];
  const mapping = createFieldMapping(fields);

  console.log("Original → Sanitized:");
  Object.entries(mapping).forEach(([original, sanitized]) => {
    console.log(`  ${original} → ${sanitized}`);
  });

  logFieldNormalization(mapping);
}

// Run all tests
runTests();
testFieldMapping();
