/**
 * ============================================================
 * Frontend API Plugger Utility (Final - Fixed + Safeguard)
 * ------------------------------------------------------------
 * Modifies frontend to use backend URL.
 * Safely injects code without duplicates.
 * Auto-strips TypeScript syntax from JSX files for Babel compatibility.
 * ============================================================
 */
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { stripTypeScriptSyntax, hasTypeScriptSyntax } from "./stripTypeScript.js";
function joinUrl(base, sub) {
    const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
    const cleanSub = sub.startsWith("/") ? sub : "/" + sub;
    return cleanBase + cleanSub;
}
export async function plugFrontend(targetPath, backendUrl, scanResult) {
    const result = {
        filesUpdated: 0,
        replacementsCount: 0,
        injectionsCount: 0,
    };
    const extensions = [".js", ".ts", ".jsx", ".tsx", ".vue", ".html", ".env", ".env.local"];
    const excludeDirs = ["node_modules", "dist", ".next", "build"];
    async function plugFile(filePath, isRecursive = false) {
        if (!extensions.includes(path.extname(filePath)))
            return;
        // Skip config files - they should not be modified
        const configFiles = ["vite.config", "webpack.config", "next.config", "nuxt.config", "rollup.config", "tsconfig", "package.json", "package-lock.json"];
        const fileName = path.basename(filePath);
        const fileNameWithoutExt = path.parse(fileName).name;
        if (configFiles.some(cfg => fileName === `${cfg}.js` || fileName === `${cfg}.ts` || fileName === `${cfg}.json` || fileNameWithoutExt === cfg)) {
            return;
        }
        // Skip global utility files that shouldn't have form handlers injected
        const globalUtilityFiles = ["main.jsx", "main.js", "main.ts", "main.tsx", "index.jsx", "index.js", "index.ts", "index.tsx", "App.jsx", "App.js", "App.ts", "App.tsx"];
        if (globalUtilityFiles.includes(fileName)) {
            // Only process URL replacements for these files, skip all injections
            let content = await fs.readFile(filePath, "utf-8");
            let updated = false;
            // Only do URL replacements, no injections
            const apiCallRegex = /((?:fetch|axios(?:\.get|\.post|\.put|\.delete)?)\s*\(\s*['"`])(\/[^'"`]+)(['"`])/g;
            content = content.replace(apiCallRegex, (match, prefix, pathVal, suffix) => {
                if (pathVal.startsWith("http"))
                    return match;
                updated = true;
                result.replacementsCount++;
                let finalUrl = joinUrl(backendUrl, pathVal);
                if (backendUrl.includes("/api") && pathVal.startsWith("/api/")) {
                    const baseUrl = backendUrl.split("/api")[0];
                    finalUrl = joinUrl(baseUrl, pathVal);
                }
                return `${prefix}${finalUrl}${suffix}`;
            });
            if (updated) {
                await fs.writeFile(filePath, content, "utf-8");
                result.filesUpdated++;
            }
            return; // Exit early, don't do any form handler injection
        }
        let content = await fs.readFile(filePath, "utf-8");
        let updated = false;
        // 1. Update existing API calls
        const apiCallRegex = /((?:fetch|axios(?:\.get|\.post|\.put|\.delete)?)\s*\(\s*['"`])(\/[^'"`]+)(['"`])/g;
        content = content.replace(apiCallRegex, (match, prefix, pathVal, suffix) => {
            if (pathVal.startsWith("http"))
                return match;
            updated = true;
            result.replacementsCount++;
            let finalUrl = joinUrl(backendUrl, pathVal);
            if (backendUrl.includes("/api") && pathVal.startsWith("/api/")) {
                const baseUrl = backendUrl.split("/api")[0];
                finalUrl = joinUrl(baseUrl, pathVal);
            }
            return `${prefix}${finalUrl}${suffix}`;
        });
        // 2. Perform Intelligent Injection
        if (scanResult && scanResult.endpoints.length > 0) {
            for (const endpoint of scanResult.endpoints) {
                if (endpoint.purpose === "login" || endpoint.purpose === "signup") {
                    const funcNamePattern = endpoint.purpose === "login" ? "handleLoginSubmit|onLogin|login" : "handleRegisterSubmit|onSignup|onRegister|signup";
                    let functionFound = false;
                    const funcRegex = new RegExp(`((?:function\\s+(?:${funcNamePattern})\\s*\\([^)]*\\)|(?:const|let|var)\\s+(?:${funcNamePattern})\\s*=\\s*(?:async\\s*)?\\([^)]*\\))\\s*(?:=>)?\\s*{)([\\s\\S]*?)(})`, "gi");
                    content = content.replace(funcRegex, (match, head, body, tail) => {
                        functionFound = true;
                        const trimmedBody = body.trim();
                        // SAFEGUARD: Don't inject if body already has API calls
                        if (trimmedBody.includes("fetch") || trimmedBody.includes("axios")) {
                            return match;
                        }
                        // Also avoid double-injecting during the same run if the loop hits the same function twice
                        if (trimmedBody.length > 500)
                            return match;
                        updated = true;
                        result.injectionsCount++;
                        // Ensure 'head' includes 'async' if not present
                        let finalHead = head;
                        if (!head.includes("async")) {
                            if (head.trim().startsWith("function")) {
                                finalHead = head.replace("function", "async function");
                            }
                            else {
                                // Handle arrow functions or expressions
                                finalHead = head.replace(/=\s*\(/, "= async (");
                                if (finalHead === head) { // assignments without parens (e.g. x = y =>)
                                    finalHead = head.replace(/=\s*(\w+)/, "= async $1");
                                }
                            }
                        }
                        const fieldsObj = endpoint.fields.map(f => `            ${f}: formData.get('${f}')`).join(",\n");
                        let finalPath = endpoint.path;
                        let finalBase = backendUrl;
                        if (backendUrl.includes("/api") && finalPath.startsWith("/api/")) {
                            finalBase = backendUrl.split("/api")[0];
                        }
                        const endpointPath = joinUrl(finalBase, finalPath);
                        return `${finalHead}
    if (e && e.preventDefault) e.preventDefault();
    const formData = new FormData(e.target || document.querySelector('form'));
    const data = {
${fieldsObj}
    };

    try {
        const response = await fetch('${endpointPath}', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
            alert('${endpoint.purpose === "login" ? "Login successful!" : "Registration successful!"}');
            if (result.token) localStorage.setItem('token', result.token);
        } else {
            alert(result.error || 'Something went wrong');
        }
    } catch (err) {
        console.error('Error:', err);
        alert('Could not connect to server');
    }
${tail}`;
                    });
                    // FALLBACK: If no function found, inject event listener for form ID
                    if (!functionFound && endpoint.formId) {
                        // SAFEGUARD: Only inject fallback into component files, not utility files
                        const fileName = path.basename(filePath);
                        const utilityFiles = ["main.jsx", "main.js", "index.jsx", "index.js", "App.jsx", "App.js"];
                        const isUtilityFile = utilityFiles.includes(fileName);
                        // Only inject if:
                        // 1. File is NOT a utility/global file
                        // 2. File contains the form ID we're targeting
                        // 3. We haven't already injected this fallback
                        if (!isUtilityFile && content.includes(endpoint.formId)) {
                            if (!content.includes(`document.getElementById('${endpoint.formId}')`)) {
                                const fieldsObj = endpoint.fields.map(f => `            ${f}: formData.get('${f}')`).join(",\n");
                                let finalPath = endpoint.path;
                                let finalBase = backendUrl;
                                if (backendUrl.includes("/api") && finalPath.startsWith("/api/")) {
                                    finalBase = backendUrl.split("/api")[0];
                                }
                                const endpointPath = joinUrl(finalBase, finalPath);
                                const fallbackScript = `
// Auto-generated fallback for ${endpoint.purpose}
(function() {
    const form = document.getElementById('${endpoint.formId}');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = {
${fieldsObj}
            };

            try {
                const response = await fetch('${endpointPath}', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (response.ok) {
                    alert('${endpoint.purpose === "login" ? "Login successful!" : "Registration successful!"}');
                    if (result.token) localStorage.setItem('token', result.token);
                } else {
                    alert(result.error || 'Something went wrong');
                }
            } catch (err) {
                console.error('Error:', err);
                alert('Could not connect to server');
            }
        });
    }
})();
`;
                                content += fallbackScript;
                                updated = true;
                                result.injectionsCount++;
                            }
                        }
                    }
                }
            }
        }
        if (updated) {
            // Auto-strip TypeScript syntax from JSX/TSX files for Babel compatibility
            const ext = path.extname(filePath);
            if ((ext === ".jsx" || ext === ".tsx") && hasTypeScriptSyntax(content)) {
                const originalContent = content;
                content = stripTypeScriptSyntax(content);
                console.log(`\n✨ TypeScript syntax auto-fixed: ${path.relative(process.cwd(), filePath)}`);
            }
            await fs.writeFile(filePath, content, "utf-8");
            result.filesUpdated++;
        }
        if (!isRecursive && path.extname(filePath) === ".html") {
            const scriptRefRegex = /<script[\s\S]*?src=['"`]([^'"`]+)['"`]/gi;
            let scriptMatch;
            while ((scriptMatch = scriptRefRegex.exec(content)) !== null) {
                const scriptSrc = scriptMatch[1];
                if (!scriptSrc.startsWith("http")) {
                    const scriptPath = path.resolve(path.dirname(filePath), scriptSrc);
                    if (await fs.pathExists(scriptPath)) {
                        await plugFile(scriptPath, true);
                    }
                }
            }
        }
    }
    async function walk(dir) {
        const files = await fs.readdir(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = await fs.stat(fullPath);
            if (stat.isDirectory()) {
                if (!excludeDirs.includes(file))
                    await walk(fullPath);
            }
            else
                await plugFile(fullPath);
        }
    }
    try {
        const stat = await fs.stat(targetPath);
        if (stat.isFile())
            await plugFile(targetPath);
        else
            await walk(targetPath);
    }
    catch (error) {
        console.error(chalk.red(`\n❌ Error during plugging: ${error}`));
    }
    return result;
}
