import fs from "fs-extra";
import path from "path";
import { scanFrontend } from "./src/utils/scanner.js";
import { tailorBackend } from "./src/utils/tailor.js";
import { plugFrontend } from "./src/utils/plugger.js";

async function runTests() {
    console.log("🧪 Running Advanced Alignment & Injection Tests...\n");

    const mockRoot = path.resolve("./mock-test-advanced");
    const mockFrontend = path.join(mockRoot, "frontend");
    const mockBackend = path.join(mockRoot, "backend");

    // Clean up
    if (await fs.pathExists(mockRoot)) await fs.remove(mockRoot);
    await fs.ensureDir(mockFrontend);
    await fs.ensureDir(path.join(mockBackend, "src/controllers"));
    await fs.ensureDir(path.join(mockBackend, "src/utils"));
    await fs.ensureDir(path.join(mockBackend, "src/routes"));

    // 1. Create Mock Frontend (HTML + JS Placeholder)
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <body>
            <form id="registerForm">
                <input name="firstName" type="text" />
                <input name="lastName" type="text" />
                <input name="email" type="email" />
                <input name="password" type="password" />
                <button type="submit">Register</button>
            </form>
            <script src="script.js"></script>
        </body>
        </html>
    `;
    const jsContent = `
        function handleRegisterSubmit(e) {
            e.preventDefault();
            console.log('Register form submitted');
        }
    `;

    await fs.writeFile(path.join(mockFrontend, "index.html"), htmlContent);
    await fs.writeFile(path.join(mockFrontend, "script.js"), jsContent);

    // 2. Create Mock Backend Template
    const dbTs = `
        export const initDb = async () => {
            db.run(\`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    name TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            \`);
        };
    `;
    const controllerTs = `
        export const signup = async (req: Request, res: Response) => {
            const { email, password, name } = req.body;
            db.run(
                "INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
                [email, hashedPassword, name || null],
                function (err) {
                    res.status(201).json({ user: { id: this.lastID, email, name } });
                }
            );
        };
    `;
    const routesTs = `
        router.post('/signup', signup);
        router.post('/login', login);
    `;

    await fs.writeFile(path.join(mockBackend, "src/utils/db.ts"), dbTs);
    await fs.writeFile(path.join(mockBackend, "src/controllers/authController.ts"), controllerTs);
    await fs.writeFile(path.join(mockBackend, "src/routes/auth.ts"), routesTs);

    // 3. Scan
    console.log("Stage 1: Scanning HTML Form...");
    const scanResult = await scanFrontend(mockFrontend);
    console.log("Scan Result:", JSON.stringify(scanResult, null, 2));

    const signupEndpoint = scanResult.endpoints.find(e => e.purpose === "signup");
    if (!signupEndpoint || !signupEndpoint.fields.includes("firstName")) {
        throw new Error("Scanner failed to detect HTML form fields or purpose");
    }

    // 4. Tailor
    console.log("\nStage 2: Tailoring Backend...");
    const tailorResult = await tailorBackend(mockBackend, scanResult);
    console.log("Tailor Result:", JSON.stringify(tailorResult, null, 2));

    const updatedDbTs = await fs.readFile(path.join(mockBackend, "src/utils/db.ts"), "utf-8");
    if (!updatedDbTs.includes("firstName TEXT,") || !updatedDbTs.includes("lastName TEXT,")) {
        throw new Error("Tailor failed to update database schema");
    }

    const updatedControllerTs = await fs.readFile(path.join(mockBackend, "src/controllers/authController.ts"), "utf-8");
    if (!updatedControllerTs.includes("const { firstName, lastName, email, password } = req.body")) {
        throw new Error("Tailor failed to update controller destructuring");
    }

    // 5. Plug (Injection)
    console.log("\nStage 3: Injecting Code into Frontend...");
    const plugResult = await plugFrontend(mockFrontend, "http://localhost:5000/api", scanResult);
    console.log("Plug Result:", JSON.stringify(plugResult, null, 2));

    const updatedJsContent = await fs.readFile(path.join(mockFrontend, "script.js"), "utf-8");
    if (!updatedJsContent.includes("fetch('http://localhost:5000/api/signup'") || !updatedJsContent.includes("firstName: formData.get('firstName')")) {
        throw new Error("Plugger failed to inject fetch logic into script.js");
    }

    console.log("\n✅ All tests passed! Advanced alignment and injection logic verified.");
}

runTests().catch(err => {
    console.error("\n❌ Test failed:", err);
    process.exit(1);
});
