/**
 * ============================================================
 * TypeScript Stripping Test
 * ============================================================
 * Verifies automatic removal of TypeScript syntax from JSX files
 */

import { stripTypeScriptSyntax, hasTypeScriptSyntax } from "./dist/utils/stripTypeScript.js";

console.log("\n🧪 Testing TypeScript Syntax Stripping\n");

const testCases = [
  {
    name: "Type assertion in FormData",
    input: `const formData = new FormData(e.target as HTMLFormElement);`,
    expected: `const formData = new FormData(e.target);`,
  },
  {
    name: "Type annotations in variable",
    input: `const data: Record<string, any> = { username: "test" };`,
    expected: `const data = { username: "test" };`,
  },
  {
    name: "Multiple type assertions",
    input: `const el = document.getElementById("form") as HTMLFormElement;
    const data = formData.get("username") as string;`,
    expected: `const el = document.getElementById("form");
    const data = formData.get("username");`,
  },
  {
    name: "Function parameters with types",
    input: `const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      const formData = new FormData(e.currentTarget);
    };`,
    expected: `const handleSubmit = async (e) => {
      const formData = new FormData(e.currentTarget);
    };`,
  },
];

let passed = 0;
let failed = 0;

testCases.forEach(({ name, input, expected }) => {
  const result = stripTypeScriptSyntax(input);
  const cleanResult = result.trim();
  const cleanExpected = expected.trim();

  // Normalize whitespace for comparison
  const matches = cleanResult.replace(/\s+/g, " ") === cleanExpected.replace(/\s+/g, " ");

  if (matches) {
    console.log(`✅ PASS: ${name}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${name}`);
    console.log(`  Input:    ${input.split("\n")[0]}`);
    console.log(`  Expected: ${cleanExpected}`);
    console.log(`  Got:      ${cleanResult}`);
    failed++;
  }
});

console.log("\n🔍 Testing TypeScript Detection\n");

const detectionTests = [
  {
    code: `const x = e.target as HTMLFormElement;`,
    shouldHave: true,
  },
  {
    code: `const name: string = "test";`,
    shouldHave: true,
  },
  {
    code: `const name = "test";`,
    shouldHave: false,
  },
  {
    code: `const data = { username: "test" };`,
    shouldHave: false,
  },
];

let detectionPassed = 0;
let detectionFailed = 0;

detectionTests.forEach(({ code, shouldHave }) => {
  const hasTS = hasTypeScriptSyntax(code);
  const passed = hasTS === shouldHave;

  if (passed) {
    console.log(`✅ Correctly ${shouldHave ? "detected" : "skipped"}: ${code.substring(0, 40)}...`);
    detectionPassed++;
  } else {
    console.log(`❌ Failed: ${code}`);
    detectionFailed++;
  }
});

console.log("\n📊 Test Results\n");
console.log(`Stripping Tests:    ${passed}/${testCases.length} passed`);
console.log(`Detection Tests:    ${detectionPassed}/${detectionTests.length} passed`);
console.log(`Total:              ${passed + detectionPassed}/${testCases.length + detectionTests.length} passed\n`);

if (failed === 0 && detectionFailed === 0) {
  console.log("✨ All tests passed! TypeScript stripping is working correctly.\n");
} else {
  console.log(`⚠️ ${failed + detectionFailed} tests failed.\n`);
}
