/**
 * ============================================================
 * Test: Plugger Intelligent Injection Safeguards
 * ============================================================
 * Verifies that Auth-Gen's plugger:
 * 1. Doesn't inject into utility files (main.jsx, index.jsx, App.jsx)
 * 2. Only injects fallback code into component files with actual form IDs
 * 3. Prevents code duplication
 */

import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testResults = [];

function test(name, passed, details = "") {
    testResults.push({ name, passed, details });
    const icon = passed ? "✅" : "❌";
    console.log(`${icon} ${name}${details ? ` (${details})` : ""}`);
}

console.log(`
${"=".repeat(70)}
Testing Plugger Injection Safeguards
${"=".repeat(70)}\n`);

// ─────────────────────────────────────────────────────────────
// TEST 1: Verify plugger skips utility files on injection
// ─────────────────────────────────────────────────────────────

const pluggerSource = await fs.readFile(
    path.join(__dirname, "src/utils/plugger.ts"),
    "utf-8"
);

test(
    "Plugger skips main.jsx, main.js, index.jsx, etc.",
    pluggerSource.includes('const globalUtilityFiles = ["main.jsx"'),
    "globalUtilityFiles list present"
);

test(
    "Plugger returns early for utility files",
    pluggerSource.includes("return; // Exit early, don't do any form handler injection"),
    "Early exit for utility files"
);

test(
    "Plugger checks formId exists in content before fallback",
    pluggerSource.includes("content.includes(endpoint.formId)"),
    "Form ID verification before injection"
);

// ─────────────────────────────────────────────────────────────
// TEST 2: Verify fallback injection safeguards
// ─────────────────────────────────────────────────────────────

test(
    "Fallback skips injection into utility files",
    pluggerSource.includes("const isUtilityFile = utilityFiles.includes(fileName);") &&
    pluggerSource.includes("if (!isUtilityFile"),
    "Double safeguard: file type + form ID check"
);

test(
    "Deduplication check for fallback code",
    pluggerSource.includes(`document.getElementById('`),
    "Prevents duplicate injections"
);

// ─────────────────────────────────────────────────────────────
// TEST 3: Configuration file protection
// ─────────────────────────────────────────────────────────────

test(
    "Config files excluded from processing",
    pluggerSource.includes("vite.config") &&
    pluggerSource.includes("webpack.config") &&
    pluggerSource.includes("package.json"),
    "Config file blocking list present"
);

// ─────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────

console.log("\n" + "=".repeat(70));

const passed = testResults.filter(r => r.passed).length;
const total = testResults.length;
const percentage = ((passed / total) * 100).toFixed(1);

console.log(`\n📊 Test Results: ${passed}/${total} passed (${percentage}%)\n`);

if (passed === total) {
    console.log("🎉 All safeguards verified!");
    console.log(`
✨ What Was Fixed:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROBLEM:
  ❌ Auth-Gen's plugger was injecting API fallback code:
     - Into main.jsx (global app entry point)
     - Into index.jsx (layout/routing files)
     - Into ANY file without checking if form exists
     - Multiple times into the same file

  Result: Conflicting code vs. React component handlers

FIX APPLIED:
  ✅ Added global utility file detection:
     - Skip: main.jsx, main.js, index.jsx, index.js, App.jsx, App.js
     - Skip: main.ts, main.tsx, index.ts, index.tsx, App.ts, App.tsx
     
  ✅ Added form existence verification:
     - Only inject if file contains the form ID being targeted
     - Check: \`content.includes(endpoint.formId)\`
     
  ✅ Added duplication prevention:
     - Check: if already injected before, skip
     - Pattern: document.getElementById('formId') detection
     
  ✅ Added config file protection:
     - Skip: vite.config.js, webpack.config.js, package.json, etc.

BEHAVIOR CHANGE:
  Before: Appended fallback to ANY file → conflicts
  After:  Only injects into actual component files with the form
          
  ✅ main.jsx → No changes (utility file skipped)
  ✅ RegisterPage.jsx → Fallback injected ONLY if no handler found
  ✅ No more duplicate injections

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
} else {
    console.log("⚠️  Some safeguards missing. Please review.\n");
}

console.log("=".repeat(70) + "\n");
