/**
 * ============================================================
 * Frontend Scanner Utility (Advanced)
 * ------------------------------------------------------------
 * Recursively scans a directory or a single file for API patterns
 * AND HTML form structures.
 * ============================================================
 */
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { execSync } from "child_process";
/**
 * Scan a frontend project directory or file for API usage with deep analysis
 * @param targetPath - Path to the frontend project directory or a specific file
 */
export async function scanFrontend(targetPath) {
    const result = {
        endpoints: [],
        historyInsights: [],
        filesScanned: 0,
    };
    const endpointsMap = new Map();
    const extensions = [".js", ".ts", ".jsx", ".tsx", ".vue", ".html"];
    const excludeDirs = ["node_modules", "dist", ".next", "build"];
    function analyzeHistory(target) {
        try {
            const stat = fs.statSync(target);
            const gitDir = stat.isDirectory() ? target : path.dirname(target);
            if (!fs.existsSync(path.join(gitDir, ".git")))
                return [];
            const log = execSync('git log -n 5 --grep="api\\|auth\\|route" --pretty=format:"%s"', {
                cwd: gitDir,
                encoding: "utf-8",
            });
            return log.split("\n").filter(line => line.trim() !== "");
        }
        catch (e) {
            return [];
        }
    }
    async function scanFile(filePath) {
        const ext = path.extname(filePath);
        if (!extensions.includes(ext))
            return;
        result.filesScanned++;
        const content = await fs.readFile(filePath, "utf-8");
        // 1. Scan for JS/TS API patterns
        if ([".js", ".ts", ".jsx", ".tsx", ".vue"].includes(ext)) {
            // Axios shorthands
            const axiosShorthandRegex = /axios\.(post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*({[\s\S]*?})?/g;
            let match;
            while ((match = axiosShorthandRegex.exec(content)) !== null) {
                const method = match[1].toUpperCase();
                const pathValue = match[2];
                const body = match[3] || "";
                const fields = extractFieldsFromBody(body);
                updateEndpoint(pathValue, method, fields);
            }
            // Generic fetch/axios calls
            const genericApiRegex = /(?:fetch|axios)\s*\(\s*['"`]([^'"`]+)['"`]\s*(?:,\s*({[\s\S]*?}))?/g;
            while ((match = genericApiRegex.exec(content)) !== null) {
                const pathValue = match[1];
                const config = match[2] || "";
                const methodMatch = /method\s*:\s*['"`](GET|POST|PUT|PATCH|DELETE)['"`]/i.exec(config);
                const method = methodMatch ? methodMatch[1].toUpperCase() : (config.includes("body:") ? "POST" : "GET");
                const fields = extractFieldsFromBody(config);
                updateEndpoint(pathValue, method, fields);
            }
        }
        // 2. Scan for HTML form structures (even in JS/JSX strings)
        if ([".html", ".vue", ".jsx", ".tsx"].includes(ext)) {
            const forms = extractFieldsFromHTML(content);
            for (const form of forms) {
                // Map form to a virtual endpoint if no real one was found
                const pathValue = form.purpose === "login" ? "/api/login" : (form.purpose === "signup" ? "/api/signup" : "/api/form");
                updateEndpoint(pathValue, "POST", form.fields, form.purpose, form.formId);
            }
        }
    }
    async function walk(dir) {
        const files = await fs.readdir(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = await fs.stat(fullPath);
            if (stat.isDirectory()) {
                if (!excludeDirs.includes(file)) {
                    await walk(fullPath);
                }
            }
            else {
                await scanFile(fullPath);
            }
        }
    }
    function extractFieldsFromBody(body) {
        const fields = new Set();
        const fieldRegex = /['"']?([a-zA-Z0-9][a-zA-Z0-9_]*)['"']?\s*:/g;
        let match;
        while ((match = fieldRegex.exec(body)) !== null) {
            const field = match[1];
            if (!["method", "headers", "body", "mode", "credentials", "cache", "redirect", "referrer"].includes(field)) {
                fields.add(field);
            }
        }
        return Array.from(fields);
    }
    function extractFieldsFromHTML(content) {
        const results = [];
        // Match <form> blocks
        const formRegex = /<form[\s\S]*?>([\s\S]*?)<\/form>/gi;
        let formMatch;
        while ((formMatch = formRegex.exec(content)) !== null) {
            const formBody = formMatch[1];
            const fullTag = formMatch[0];
            // Capture form ID used for fallback injection
            const idMatch = /id=['"`]([^'"`]+)['"`]/i.exec(fullTag);
            const formId = idMatch ? idMatch[1] : undefined;
            const fields = new Set();
            // Match input/textarea name or id attributes
            const inputRegex = /<(?:input|textarea|select)[\s\S]*?(?:name|id)\s*=\s*['"`]([^'"`]+)['"`]/gi;
            let inputMatch;
            while ((inputMatch = inputRegex.exec(formBody)) !== null) {
                const fieldName = inputMatch[1];
                if (!["submit", "button", "checkbox", "radio"].includes(fieldName)) {
                    fields.add(fieldName);
                }
            }
            // Determine purpose
            let purpose = "generic";
            const lowerForm = fullTag.toLowerCase();
            if (lowerForm.includes("login") || lowerForm.includes("sign-in") || lowerForm.includes("signin")) {
                purpose = "login";
            }
            else if (lowerForm.includes("register") || lowerForm.includes("signup") || lowerForm.includes("sign-up") || lowerForm.includes("create account")) {
                purpose = "signup";
            }
            if (fields.size > 0) {
                results.push({ fields: Array.from(fields), purpose, formId });
            }
        }
        // Also look for standalone inputs if no forms are found (sometimes simple apps don't use <form>)
        if (results.length === 0) {
            const fields = new Set();
            const inputRegex = /<(?:input|textarea|select)[\s\S]*?(?:name|id)\s*=\s*['"`]([^'"`]+)['"`]/gi;
            let inputMatch;
            while ((inputMatch = inputRegex.exec(content)) !== null) {
                fields.add(inputMatch[1]);
            }
            if (fields.size > 0) {
                results.push({ fields: Array.from(fields), purpose: "generic" });
            }
        }
        return results;
    }
    function updateEndpoint(pathValue, method, fields, purpose, formId) {
        const key = `${method}:${pathValue}`;
        if (endpointsMap.has(key)) {
            const existing = endpointsMap.get(key);
            const combinedFields = new Set([...existing.fields, ...fields]);
            existing.fields = Array.from(combinedFields);
            if (purpose && (!existing.purpose || existing.purpose === "generic")) {
                existing.purpose = purpose;
            }
            if (formId && !existing.formId) {
                existing.formId = formId;
            }
        }
        else {
            endpointsMap.set(key, { path: pathValue, method, fields, purpose: purpose || "generic", formId });
        }
    }
    try {
        const stat = await fs.stat(targetPath);
        result.historyInsights = analyzeHistory(targetPath);
        if (stat.isFile()) {
            await scanFile(targetPath);
        }
        else {
            await walk(targetPath);
        }
        result.endpoints = Array.from(endpointsMap.values());
    }
    catch (error) {
        console.error(chalk.red(`\n❌ Error scanning path: ${error}`));
    }
    return result;
}
