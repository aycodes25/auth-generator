/**
 * ============================================================
 * Accurate Frontend API Plugger Utility
 * ============================================================
 * Intelligently injects API calls into the correct frontend files
 * Uses framework detection and file analysis for precision
 */
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { detectFramework } from "./frameworkDetector.js";
import { analyzeFiles } from "./fileAnalyzer.js";
import { generateIntegrationPlan } from "./apiIntegrationStrategy.js";
import { stripTypeScriptSyntax, hasTypeScriptSyntax } from "./stripTypeScript.js";
/**
 * Accurately plug frontend with backend APIs
 * Uses intelligent detection and analysis for precise injection
 */
export async function accuratePlugFrontend(targetPath, backendUrl) {
    const result = {
        filesUpdated: 0,
        filesCreated: 0,
        injectionsCount: 0,
        details: [],
    };
    try {
        // Step 1: Detect framework
        console.log(chalk.blue("🔍 Detecting frontend framework..."));
        const frameworkInfo = await detectFramework(targetPath);
        result.details.push(`✓ Detected framework: ${frameworkInfo.framework}`);
        result.details.push(`  Type: ${frameworkInfo.type}`);
        result.details.push(`  TypeScript: ${frameworkInfo.supportsTypeScript}`);
        // Step 2: Analyze files
        console.log(chalk.blue("📊 Analyzing frontend files..."));
        const fileAnalysis = await analyzeFiles(targetPath, frameworkInfo);
        result.details.push(`✓ Found ${fileAnalysis.loginComponents.length} login components`);
        result.details.push(`✓ Found ${fileAnalysis.signupComponents.length} signup components`);
        // Step 3: Generate integration plan
        console.log(chalk.blue("📋 Planning API integration strategy..."));
        const integrationPlan = generateIntegrationPlan(targetPath, frameworkInfo, fileAnalysis, backendUrl);
        result.details.push(`✓ Integration strategy: ${integrationPlan.strategy}`);
        result.details.push(`✓ Will create ${integrationPlan.filesToCreate.length} new files`);
        result.details.push(`✓ Will inject into ${integrationPlan.injectionPoints.length} locations`);
        // Step 4: Create new files (hooks, services, etc.)
        console.log(chalk.blue("📝 Creating API integration files..."));
        for (const fileToCreate of integrationPlan.filesToCreate) {
            const fullPath = path.join(targetPath, fileToCreate.path);
            await fs.ensureDir(path.dirname(fullPath));
            await fs.writeFile(fullPath, fileToCreate.content, "utf-8");
            result.filesCreated++;
            result.details.push(`✓ Created: ${fileToCreate.path}`);
        }
        // Step 5: Apply injections to existing files
        console.log(chalk.blue("💉 Injecting API calls into components..."));
        for (const injection of integrationPlan.injectionPoints) {
            const filePath = path.join(targetPath, injection.filePath);
            if (await fs.pathExists(filePath)) {
                let content = await fs.readFile(filePath, "utf-8");
                let updated = false;
                // Check if injection already exists (safeguard)
                if (!content.includes(injection.code)) {
                    // Apply injection based on type
                    switch (injection.injectionType) {
                        case "hook-call":
                            content = injectHookCall(content, injection.code);
                            updated = true;
                            break;
                        case "handler":
                            content = injectIntoHandler(content, injection.code);
                            updated = true;
                            break;
                        case "component-init":
                            content = injectIntoComponentInit(content, injection.code);
                            updated = true;
                            break;
                        case "form-submit":
                            content = injectIntoFormSubmit(content, injection.code);
                            updated = true;
                            break;
                    }
                }
                if (updated) {
                    // Auto-strip TypeScript if needed
                    const ext = path.extname(filePath);
                    if ((ext === ".jsx" || ext === ".tsx") &&
                        hasTypeScriptSyntax(content)) {
                        content = stripTypeScriptSyntax(content);
                    }
                    await fs.writeFile(filePath, content, "utf-8");
                    result.filesUpdated++;
                    result.injectionsCount++;
                    result.details.push(`✓ Updated: ${path.relative(targetPath, filePath)}`);
                }
            }
        }
        // Step 6: Print results
        console.log(chalk.green("\n✅ API plugging complete!\n"));
        result.details.forEach((detail) => console.log(chalk.gray(detail)));
        return result;
    }
    catch (error) {
        console.error(chalk.red(`\n❌ Error during accurate plugging: ${error}`));
        throw error;
    }
}
/**
 * Inject hook call at the beginning of a component
 */
function injectHookCall(content, hookCall) {
    // For React components, inject at the top of the component function
    const componentRegex = /((?:function|const)\s+\w+\s*(?::\s*React\.FC)?[^{]*{)/;
    return content.replace(componentRegex, (match) => {
        return match + `\n  ${hookCall}\n`;
    });
}
/**
 * Inject code into a form submission handler
 */
function injectIntoHandler(content, code) {
    // Find form submission handlers and inject the code
    const handlerRegex = /((?:const|let|var|function)\s+handle\w+.*?{)/i;
    return content.replace(handlerRegex, (match) => {
        if (match.includes("async")) {
            return match + `\n  ${code}\n`;
        }
        else {
            return match.replace("function", "async function") + `\n  ${code}\n`;
        }
    });
}
/**
 * Inject code into component initialization (useEffect in React)
 */
function injectIntoComponentInit(content, code) {
    // Check if useEffect exists
    if (content.includes("useEffect")) {
        const useEffectRegex = /(useEffect\s*\(\s*\(\s*\)\s*=>\s*{)/;
        return content.replace(useEffectRegex, (match) => {
            return match + `\n    ${code}\n`;
        });
    }
    else {
        // If no useEffect, add one
        const componentEndRegex = /((?:function|const)\s+\w+[^{]*{[\s\S]*?)(\n\s*return)/;
        return content.replace(componentEndRegex, (match, before, after) => {
            return `${before}\n  useEffect(() => {\n    ${code}\n  }, [])${after}`;
        });
    }
}
/**
 * Inject code into form submit handler
 */
function injectIntoFormSubmit(content, code) {
    const formRegex = /(<form[\s\S]*?onSubmit\s*=\s*{([^}]*)})/;
    return content.replace(formRegex, (match, formTag, handler) => {
        if (!handler.includes(code)) {
            return match.replace(handler, code);
        }
        return match;
    });
}
