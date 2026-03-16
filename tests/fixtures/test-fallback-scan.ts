
import { scanFrontend } from "./src/utils/scanner.js";
import { plugFrontend } from "./src/utils/plugger.js";
import path from "path";

async function test() {
    const htmlPath = path.resolve("test-fallback.html");
    console.log("Scanning...");
    const scanResult = await scanFrontend(htmlPath);
    console.log("Scan Result Endpoints:", JSON.stringify(scanResult.endpoints, null, 2));

    console.log("Plugging...");
    const result = await plugFrontend(path.resolve("test-fallback.js"), "http://localhost:5000", scanResult);
    console.log("Plug Result:", result);
}

test();
