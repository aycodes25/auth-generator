/**
 * ============================================================
 * File Analysis Tests
 * ============================================================
 * Tests the file analyzer utility
 */

import { analyzeFiles } from "../src/utils/fileAnalyzer.js";
import { detectFramework } from "../src/utils/frameworkDetector.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

async function testFileAnalysis() {
  console.log("🧪 Testing File Analysis...\n");

  try {
    // Detect framework first
    console.log("Step 1: Detecting framework...");
    const frameworkInfo = await detectFramework(projectRoot);
    console.log(`✓ Detected: ${frameworkInfo.framework}\n`);

    // Analyze files
    console.log("Step 2: Analyzing files...");
    const analysis = await analyzeFiles(projectRoot, frameworkInfo);
    console.log(`✓ Analysis complete\n`);

    // Report results
    console.log("📊 Analysis Results:\n");
    console.log(`Login Components: ${analysis.loginComponents.length}`);
    console.log(`Signup Components: ${analysis.signupComponents.length}`);
    console.log(`API Hooks: ${analysis.apiHooks.length}`);
    console.log(`API Services: ${analysis.apiServices.length}`);
    console.log(`Form Components: ${analysis.formComponents.length}`);
    console.log(`Other Files: ${analysis.otherFiles.length}\n`);

    // Show file type distribution
    console.log("📁 File Type Distribution:");
    if (analysis.loginComponents.length > 0) {
      console.log("\nLogin Components:");
      analysis.loginComponents.slice(0, 3).forEach((comp) => {
        console.log(`  • ${comp.relativePath}`);
        console.log(`    Type: ${comp.fileType}`);
        console.log(`    Injection: ${comp.suggestedInjection}`);
      });
    }

    if (analysis.signupComponents.length > 0) {
      console.log("\nSignup Components:");
      analysis.signupComponents.slice(0, 3).forEach((comp) => {
        console.log(`  • ${comp.relativePath}`);
        console.log(`    Type: ${comp.fileType}`);
        console.log(`    Injection: ${comp.suggestedInjection}`);
      });
    }

    if (analysis.apiServices.length > 0) {
      console.log("\nAPI Services:");
      analysis.apiServices.slice(0, 3).forEach((svc) => {
        console.log(`  • ${svc.relativePath}`);
        console.log(`    Type: ${svc.fileType}`);
      });
    }

    console.log("\n✅ File analysis tests completed!\n");
  } catch (error) {
    console.error("❌ Error during file analysis:", error);
    process.exit(1);
  }
}

testFileAnalysis();
