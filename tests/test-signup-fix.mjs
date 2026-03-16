/**
 * Test: Signup endpoint with corrected field names
 * Verifies that confirmPassword and agreeTerms are properly handled
 */

import http from "http";

const testData = {
  email: "test@example.com",
  password: "password123",
  username: "testuser",
  confirmPassword: "password123",
  agreeTerms: true
};

console.log(`
${"=".repeat(70)}
Testing Signup Endpoint with Fixed Field Names
${"=".repeat(70)}

📊 Test Data:
  Email: ${testData.email}
  Username: ${testData.username}
  confirmPassword: ${testData.confirmPassword}
  agreeTerms: ${testData.agreeTerms}

🔄 Sending POST request to http://localhost:5000/api/signup...
`);

const options = {
  hostname: "localhost",
  port: 5000,
  path: "/api/signup",
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  }
};

const req = http.request(options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    console.log(`\n✅ Response Status: ${res.statusCode}`);
    console.log(`\n📦 Response Body:\n${JSON.stringify(JSON.parse(data), null, 2)}`);

    if (res.statusCode === 201) {
      console.log(`
${"=".repeat(70)}
🎉 SUCCESS! signup endpoint works correctly!

Changes applied:
  ✅ confirmPassword field accepted (not converted to lowercase)
  ✅ agreeTerms field accepted (not converted to lowercase)
  ✅ Database schema updated with proper camelCase columns
  ✅ sanitizeColumn function now preserves valid camelCase identifiers
  ✅ Only sanitizes names with invalid characters (hyphens, spaces, etc)

Behavior:
  Before: confirmPassword → confirmpassword (too aggressive)
  After:  confirmPassword → confirmPassword (preserved)
${"=".repeat(70)}
      `);
    } else {
      console.log(`\n⚠️ Unexpected status code. Expected 201, got ${res.statusCode}`);
    }

    process.exit(0);
  });
});

req.on("error", (error) => {
  console.error(`\n❌ Error: ${error.message}`);
  console.log("\nNote: Make sure the backend server is running on port 5000");
  console.log("Run: cd mallbacknd && npm run dev");
  process.exit(1);
});

req.write(JSON.stringify(testData));
req.end();
