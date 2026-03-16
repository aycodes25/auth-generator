/**
 * Test script for Auth-Gen CLI
 * Simulates user input to generate a project non-interactively
 */

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("🧪 Testing Auth-Gen CLI...\n");

const cli = spawn("tsx", ["src/index.ts"], {
    cwd: path.join(__dirname, ".."),
    stdio: ["pipe", "inherit", "inherit"],
});

// Simulate user input
setTimeout(() => cli.stdin.write("\n"), 1000); // Select Express
setTimeout(() => cli.stdin.write("\n"), 1500); // Select SQLite
setTimeout(() => cli.stdin.write("test-generated\n"), 2000); // Project name
setTimeout(() => cli.stdin.write("n\n"), 2500); // Skip auto-install for faster testing

cli.on("close", (code) => {
    console.log(`\n✅ CLI exited with code ${code}`);
    process.exit(code || 0);
});
