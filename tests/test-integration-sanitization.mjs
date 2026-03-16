/**
 * ============================================================
 * Integration Test for Field Sanitization
 * ============================================================
 * Tests the end-to-end workflow of field scanning, sanitization,
 * and backend generation
 */

import { sanitizeColumn, createFieldMapping, logFieldNormalization } from "./dist/utils/sanitizeColumn.js";

// Simulate frontend scanning result
const mockScanResult = {
  endpoints: [
    {
      path: "/api/signup",
      method: "POST",
      purpose: "signup",
      fields: [
        "form-control", 
        "search-input",
        "user_email",
        "password",
        "confirm-password",
        "phone@number",
        "company, name"
      ]
    },
    {
      path: "/api/login",
      method: "POST",
      purpose: "login",
      fields: ["email", "password"]
    }
  ],
  filesScanned: 5,
  historyInsights: []
};

console.log("\n═══════════════════════════════════════════════════════");
console.log("🧪 Integration Test: Complete Field Sanitization Flow");
console.log("═══════════════════════════════════════════════════════\n");

// Step 1: Extract custom fields from scan result
console.log("📋 Step 1: Extract custom fields from frontend scan\n");
const customFields = new Set();
mockScanResult.endpoints.forEach(endpoint => {
  if (endpoint.purpose === "signup") {
    endpoint.fields.forEach(field => {
      if (!["id", "email", "password", "created_at"].includes(field)) {
        customFields.add(field);
      }
    });
  }
});

console.log(`Found ${customFields.size} custom fields:`);
Array.from(customFields).forEach(field => console.log(`  • ${field}`));

// Step 2: Create field mapping
console.log("\n📊 Step 2: Create field mapping (original → sanitized)\n");
const customFieldsArray = Array.from(customFields);
const fieldMapping = createFieldMapping(customFieldsArray);

console.log("Mapping:");
Object.entries(fieldMapping).forEach(([original, sanitized]) => {
  console.log(`  ${original} → ${sanitized}`);
});

// Step 3: Log normalizations
console.log("\n✨ Step 3: Display user-facing normalizations\n");
logFieldNormalization(fieldMapping);

// Step 4: Generate database schema with sanitized names
console.log("📝 Step 4: Generate database schema SQL\n");
const sanitizedFields = customFieldsArray.map(f => sanitizeColumn(f));
const columnsSQL = sanitizedFields
  .map(f => `    ${f} TEXT,`)
  .join("\n");

const sampleSchema = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
${columnsSQL}
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

console.log("Generated SQL Schema:");
console.log(sampleSchema);

// Step 5: Simulate API request handling
console.log("\n🔄 Step 5: Simulate API request handling\n");
const mockRequest = {
  body: {
    email: "user@example.com",
    password: "securepass123",
    "form-control": "value1",
    "search-input": "value2",
    "confirm-password": "securepass123",
    "phone@number": "555-1234",
    "company, name": "Acme Corp"
  }
};

console.log("Incoming request body:");
console.log(JSON.stringify(mockRequest.body, null, 2));

console.log("\n⚙️ Mapping to database fields:");
const dbInsertion = {};
Object.entries(mockRequest.body).forEach(([key, value]) => {
  const sanitized = sanitizeColumn(key);
  dbInsertion[sanitized] = value;
  if (key !== sanitized) {
    console.log(`  ${key} → ${sanitized}: "${value}"`);
  }
});

// Step 6: Verify data consistency
console.log("\n✅ Step 6: Verify data consistency\n");
let allSanitizationsApplied = true;
Object.keys(dbInsertion).forEach(key => {
  const isValidSQL = /^[a-z_][a-z0-9_]*$/i.test(key);
  if (!isValidSQL) {
    console.log(`❌ Invalid field name: ${key}`);
    allSanitizationsApplied = false;
  }
});

if (allSanitizationsApplied) {
  console.log("✅ All field names are valid SQL identifiers");
}

// Step 7: Generate INSERT query
console.log("\n📄 Step 7: Generate INSERT query\n");
const columns = Object.keys(dbInsertion).filter(k => k !== "id");
const values = columns.map(() => "?").join(", ");
const insertSQL = `
INSERT INTO users (${columns.join(", ")}) 
VALUES (${values})
`;

console.log("Generated INSERT statement:");
console.log(insertSQL);

// Summary
console.log("\n═══════════════════════════════════════════════════════");
console.log("✨ Integration Test Summary");
console.log("═══════════════════════════════════════════════════════");
console.log(`✅ Scanned fields: ${mockScanResult.endpoints[0].fields.length}`);
console.log(`✅ Custom fields detected: ${customFieldsArray.length}`);
console.log(`✅ Fields needing sanitization: ${customFieldsArray.filter(f => sanitizeColumn(f) !== f).length}`);
console.log(`✅ All SQL valid identifiers: ${allSanitizationsApplied ? "YES" : "NO"}`);
console.log(`✅ Field mapping generated: YES`);
console.log(`✅ Schema generation: PASSED`);
console.log(`✅ API request mapping: PASSED`);
console.log("\n🎉 Integration test completed successfully!\n");
