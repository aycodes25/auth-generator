import { scanFrontend } from "./src/utils/scanner.js";
import path from "path";

async function run() {
    const result = await scanFrontend("perf");
    console.log(JSON.stringify(result, null, 2));
}

run();
