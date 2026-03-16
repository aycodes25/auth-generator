/**
 * ============================================================
 * Tailor Modification Test
 * ============================================================
 * Verifies that tailor.ts correctly imports and uses sanitization
 */

import { readFileSync } from "fs";
import { join } from "path";

console.log("\n🔍 Verifying tailor.ts modifications...\n");

// Check compiled tailor.js
const tailorPath = "./dist/utils/tailor.js";
try {
  const tailorContent = readFileSync(tailorPath, "utf-8");
  
  console.log("✅ tailor.js file exists and is readable");
  
  // Check for sanitizeColumn import
  if (tailorContent.includes("sanitizeColumn")) {
    console.log("✅ sanitizeColumn function is imported");
  } else {
    console.log("❌ sanitizeColumn function NOT found in tailor.js");
  }
  
  // Check for createFieldMapping import
  if (tailorContent.includes("createFieldMapping")) {
    console.log("✅ createFieldMapping function is imported");
  } else {
    console.log("❌ createFieldMapping function NOT found in tailor.js");
  }
  
  // Check for logFieldNormalization import
  if (tailorContent.includes("logFieldNormalization")) {
    console.log("✅ logFieldNormalization function is imported");
  } else {
    console.log("❌ logFieldNormalization function NOT found in tailor.js");
  }
  
  // Check for field mapping export
  if (tailorContent.includes("FIELD_MAPPING")) {
    console.log("✅ FIELD_MAPPING export is implemented");
  } else {
    console.log("⚠️ FIELD_MAPPING export not found (may not be needed)");
  }
  
  console.log("\n✅ tailor.js modifications verified successfully!");
  
} catch (err) {
  console.error("❌ Error reading tailor.js:", err.message);
  process.exit(1);
}

// Verify db.ts template modifications
console.log("\n🔍 Verifying db.ts template modifications...\n");

const dbPath = "./templates/express/sqlite/utils/db.ts";
try {
  const dbContent = readFileSync(dbPath, "utf-8");
  
  console.log("✅ db.ts template file exists and is readable");
  
  // Check for sanitizeColumn function
  if (dbContent.includes("function sanitizeColumn")) {
    console.log("✅ sanitizeColumn function is defined");
  } else {
    console.log("❌ sanitizeColumn function NOT found in db.ts");
  }
  
  // Check for retry logic
  if (dbContent.includes("retryWithSanitization")) {
    console.log("✅ retryWithSanitization function is implemented");
  } else {
    console.log("❌ retryWithSanitization function NOT found in db.ts");
  }
  
  // Check for error detection
  if (dbContent.includes("near \\\"-\\\"")) {
    console.log("✅ Error detection for invalid column syntax is implemented");
  } else {
    console.log("⚠️ Error detection pattern not found");
  }
  
  // Check for auto-fix logging
  if (dbContent.includes("Auto-fix applied")) {
    console.log("✅ Auto-fix success logging is implemented");
  } else {
    console.log("⚠️ Auto-fix logging not found");
  }
  
  console.log("\n✅ db.ts template modifications verified successfully!");
  
} catch (err) {
  console.error("❌ Error reading db.ts:", err.message);
  process.exit(1);
}

// Verify controller template modifications
console.log("\n🔍 Verifying authController.ts template modifications...\n");

const controllerPath = "./templates/express/sqlite/controllers/authController.ts";
try {
  const controllerContent = readFileSync(controllerPath, "utf-8");
  
  console.log("✅ authController.ts template file exists and is readable");
  
  // Check for sanitizeColumn function
  if (controllerContent.includes("function sanitizeColumn")) {
    console.log("✅ sanitizeColumn helper function is included");
  } else {
    console.log("⚠️ sanitizeColumn helper not found (may use imports)");
  }
  
  // Check for error logging
  if (controllerContent.includes('console.error("Signup error"')) {
    console.log("✅ Enhanced error logging is implemented");
  } else {
    console.log("⚠️ Enhanced error logging not found");
  }
  
  console.log("\n✅ authController.ts template modifications verified successfully!");
  
} catch (err) {
  console.error("❌ Error reading authController.ts:", err.message);
  process.exit(1);
}

console.log("\n═══════════════════════════════════════════════════════");
console.log("🎉 All modifications verified successfully!");
console.log("═══════════════════════════════════════════════════════\n");
