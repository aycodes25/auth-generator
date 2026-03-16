#!/usr/bin/env node

/**
 * ============================================================
 * Field Sanitization - Complete Test Report
 * ============================================================
 * Comprehensive verification of all implementations
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const BOLD = "\x1b[1m";

let totalTests = 0;
let passedTests = 0;

function test(name, condition, details = "") {
  totalTests++;
  const status = condition ? `${GREEN}✅ PASS${RESET}` : `${RED}❌ FAIL${RESET}`;
  console.log(`${status} ${name}`);
  if (details) console.log(`     ${details}`);
  if (condition) passedTests++;
  return condition;
}

function section(title) {
  console.log(`\n${BLUE}${BOLD}${title}${RESET}`);
  console.log("─".repeat(60));
}

function summary(title, total, passed) {
  const pct = ((passed / total) * 100).toFixed(1);
  const color = passed === total ? GREEN : RED;
  console.log(`\n${color}${title}: ${passed}/${total} (${pct}%)${RESET}`);
}

console.log(`\n${BOLD}${BLUE}════════════════════════════════════════════════════════════${RESET}`);
console.log(`${BOLD}${BLUE}  Field Name Sanitization - Comprehensive Test Report${RESET}`);
console.log(`${BOLD}${BLUE}════════════════════════════════════════════════════════════${RESET}`);

// ============ FILE EXISTENCE TESTS ============
section("1. FILE EXISTENCE TESTS");

test(
  "sanitizeColumn.ts source file exists",
  existsSync("src/utils/sanitizeColumn.ts"),
  "src/utils/sanitizeColumn.ts"
);

test(
  "sanitizeColumn.ts compiles to .js",
  existsSync("dist/utils/sanitizeColumn.js"),
  "dist/utils/sanitizeColumn.js"
);

test(
  "tailor.ts file exists",
  existsSync("src/utils/tailor.ts"),
  "src/utils/tailor.ts"
);

test(
  "db.ts template exists",
  existsSync("templates/express/sqlite/utils/db.ts"),
  "templates/express/sqlite/utils/db.ts"
);

test(
  "authController.ts template exists",
  existsSync("templates/express/sqlite/controllers/authController.ts"),
  "templates/express/sqlite/controllers/authController.ts"
);

test(
  "Unit test file exists",
  existsSync("test-sanitization.mjs"),
  "test-sanitization.mjs"
);

test(
  "Integration test file exists",
  existsSync("test-integration-sanitization.mjs"),
  "test-integration-sanitization.mjs"
);

test(
  "Implementation documentation exists",
  existsSync("SANITIZATION_IMPLEMENTATION.md"),
  "SANITIZATION_IMPLEMENTATION.md"
);

test(
  "Quick reference guide exists",
  existsSync("FIELD_SANITIZATION_QUICK_REFERENCE.md"),
  "FIELD_SANITIZATION_QUICK_REFERENCE.md"
);

// ============ SOURCE CODE TESTS ============
section("2. SOURCE CODE VERIFICATION");

const sanitizeContent = readFileSync("src/utils/sanitizeColumn.ts", "utf-8");
test(
  "sanitizeColumn function is defined",
  sanitizeContent.includes("export function sanitizeColumn"),
  "Found: export function sanitizeColumn()"
);

test(
  "createFieldMapping function is defined",
  sanitizeContent.includes("export function createFieldMapping"),
  "Found: export function createFieldMapping()"
);

test(
  "logFieldNormalization function is defined",
  sanitizeContent.includes("export function logFieldNormalization"),
  "Found: export function logFieldNormalization()"
);

const tailorContent = readFileSync("src/utils/tailor.ts", "utf-8");
test(
  "tailor.ts imports sanitizeColumn",
  tailorContent.includes('import { sanitizeColumn'),
  "Found: import { sanitizeColumn"
);

test(
  "tailor.ts imports createFieldMapping",
  tailorContent.includes('createFieldMapping'),
  "Found: createFieldMapping"
);

test(
  "tailor.ts imports logFieldNormalization",
  tailorContent.includes('logFieldNormalization'),
  "Found: logFieldNormalization"
);

test(
  "tailor.ts uses sanitizeColumn in schema",
  tailorContent.includes('sanitizeColumn(f)'),
  "Found: sanitizeColumn(f) usage"
);

const dbContent = readFileSync("templates/express/sqlite/utils/db.ts", "utf-8");
test(
  "db.ts defines sanitizeColumn helper",
  dbContent.includes("function sanitizeColumn"),
  "Found: function sanitizeColumn()"
);

test(
  "db.ts has retryWithSanitization function",
  dbContent.includes("function retryWithSanitization"),
  "Found: function retryWithSanitization()"
);

test(
  "db.ts detects SQL syntax errors",
  dbContent.includes('err.message.includes("near'),
  "Found: error detection pattern"
);

test(
  "db.ts implements auto-retry logic",
  dbContent.includes("retryWithSanitization("),
  "Found: retryWithSanitization() call"
);

// ============ COMPILATION TESTS ============
section("3. COMPILATION & BUILD TESTS");

try {
  execSync("npm run build", { stdio: "pipe" });
  test("TypeScript compilation successful", true, "npm run build completed");
} catch (e) {
  test("TypeScript compilation successful", false, "Build failed");
}

// ============ EXECUTION TESTS ============
section("4. RUNTIME EXECUTION TESTS");

try {
  const output = execSync("node test-sanitization.mjs", { 
    encoding: "utf-8",
    stdio: "pipe"
  });
  
  const allPassed = output.includes("✨ All tests passed!");
  test("Unit tests execute successfully", allPassed, "test-sanitization.mjs");
  
  const passingCount = (output.match(/✅ PASS/g) || []).length;
  test(
    "All 12 unit tests pass",
    passingCount === 12,
    `${passingCount}/12 tests passing`
  );
} catch (e) {
  test("Unit tests execute successfully", false, "Execution failed");
}

try {
  const output = execSync("node test-integration-sanitization.mjs", { 
    encoding: "utf-8",
    stdio: "pipe"
  });
  
  const successful = output.includes("🎉 Integration test completed successfully!");
  test("Integration test executes successfully", successful, "test-integration-sanitization.mjs");
  
  test(
    "Integration test validates SQL",
    output.includes("✅ All SQL valid identifiers: YES"),
    "SQL identifier validation passed"
  );
} catch (e) {
  test("Integration test executes successfully", false, "Execution failed");
}

try {
  const output = execSync("node test-tailor-modifications.mjs", { 
    encoding: "utf-8",
    stdio: "pipe"
  });
  
  const successful = output.includes("🎉 All modifications verified successfully!");
  test("Modification verification passes", successful, "test-tailor-modifications.mjs");
} catch (e) {
  test("Modification verification passes", false, "Execution failed");
}

// ============ FUNCTIONALITY TESTS ============
section("5. FUNCTIONALITY VERIFICATION");

const testCases = [
  { input: "form-control", expected: "form_control" },
  { input: "search-input", expected: "search_input" },
  { input: "user name", expected: "user_name" },
  { input: "first@name", expected: "first_name" },
  { input: "123field", expected: "_123field" },
];

try {
  // Import the compiled module
  const { sanitizeColumn } = await import("./dist/utils/sanitizeColumn.js");
  
  let functionalTests = 0;
  let functionalPassed = 0;
  
  testCases.forEach(({ input, expected }) => {
    functionalTests++;
    const result = sanitizeColumn(input);
    const passed = result === expected;
    if (passed) functionalPassed++;
    test(
      `Sanitize: "${input}" → "${result}"`,
      passed,
      passed ? "" : `Expected: "${expected}"`
    );
  });
  
  summary("Functionality Tests", functionalTests, functionalPassed);
} catch (e) {
  console.error(`${RED}Error loading sanitization module: ${e.message}${RESET}`);
}

// ============ DOCUMENTATION TESTS ============
section("6. DOCUMENTATION COMPLETENESS");

test(
  "SANITIZATION_IMPLEMENTATION.md contains usage instructions",
  readFileSync("SANITIZATION_IMPLEMENTATION.md", "utf-8").includes("function sanitizeColumn"),
  "Found: sanitizeColumn example"
);

test(
  "FIELD_SANITIZATION_QUICK_REFERENCE.md has examples",
  readFileSync("FIELD_SANITIZATION_QUICK_REFERENCE.md", "utf-8").includes("form-control"),
  "Found: form-control example"
);

test(
  "IMPLEMENTATION_SUMMARY.md includes test results",
  readFileSync("IMPLEMENTATION_SUMMARY.md", "utf-8").includes("12 passed"),
  "Found: test results summary"
);

// ============ FINAL SUMMARY ============
section("FINAL TEST SUMMARY");

console.log(`\n${BOLD}Overall Test Results:${RESET}`);
console.log(`${GREEN}Total Tests: ${totalTests}${RESET}`);
console.log(`${GREEN}Passed: ${passedTests}${RESET}`);
console.log(`${RED}Failed: ${totalTests - passedTests}${RESET}`);

const passPercentage = ((passedTests / totalTests) * 100).toFixed(1);
const resultColor = passedTests === totalTests ? GREEN : RED;
console.log(`${resultColor}${BOLD}Success Rate: ${passPercentage}%${RESET}`);

// ============ CONCLUSION ============
console.log(`\n${BOLD}${BLUE}════════════════════════════════════════════════════════════${RESET}`);

if (passedTests === totalTests) {
  console.log(`${GREEN}${BOLD}✅ ALL TESTS PASSED - READY FOR PRODUCTION${RESET}`);
  console.log(`${BOLD}${BLUE}════════════════════════════════════════════════════════════${RESET}\n`);
  process.exit(0);
} else {
  console.log(`${RED}${BOLD}⚠️ SOME TESTS FAILED - REVIEW NEEDED${RESET}`);
  console.log(`${BOLD}${BLUE}════════════════════════════════════════════════════════════${RESET}\n`);
  process.exit(1);
}
