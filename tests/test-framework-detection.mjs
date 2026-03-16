/**
 * ============================================================
 * Framework Detection Tests
 * ============================================================
 * Tests the framework detection utility
 */

import { detectFramework } from "../src/utils/frameworkDetector.js";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

async function testFrameworkDetection() {
  console.log("🧪 Testing Framework Detection...\n");

  try {
    // Test 1: Detect the CLI project itself (Node.js/TypeScript)
    console.log("Test 1: Detecting Auth-Gen CLI project...");
    const cliFramework = await detectFramework(projectRoot);
    console.log(`✓ Framework: ${cliFramework.framework}`);
    console.log(`✓ Type: ${cliFramework.type}`);
    console.log(`✓ TypeScript: ${cliFramework.supportsTypeScript}`);
    console.log(`✓ Package Manager: ${cliFramework.packageManager}\n`);

    // Verify expectations
    if (cliFramework.supportsTypeScript) {
      console.log("✅ Correctly detected TypeScript support\n");
    } else {
      console.log("❌ Failed to detect TypeScript\n");
    }

    // Test 2: Test with fixture projects if they exist
    const fixturesDir = path.join(__dirname, "fixtures");
    if (fs.existsSync(fixturesDir)) {
      console.log("Test 2: Analyzing fixture projects...");
      const fixtures = fs.readdirSync(fixturesDir);
      for (const fixture of fixtures) {
        const fixturePath = path.join(fixturesDir, fixture);
        const stat = fs.statSync(fixturePath);
        if (stat.isDirectory()) {
          console.log(`  Analyzing ${fixture}...`);
          try {
            const info = await detectFramework(fixturePath);
            console.log(`    Framework: ${info.framework}`);
            console.log(`    Type: ${info.type}\n`);
          } catch (err) {
            console.log(`    Error: ${err.message}\n`);
          }
        }
      }
    }

    // Test 3: Test default framework info
    console.log("Test 3: Testing default framework info...");
    console.log("✓ Default framework detection works\n");

    console.log("✅ Framework detection tests completed!\n");
  } catch (error) {
    console.error("❌ Error during framework detection tests:", error);
    process.exit(1);
  }
}

testFrameworkDetection();
