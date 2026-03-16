/**
 * ============================================================
 * Frontend File Analyzer Utility
 * ============================================================
 * Analyzes frontend files to identify authentication-related files
 * Maps which files contain login/signup forms and handlers
 */
import fs from "fs-extra";
import path from "path";
/**
 * Analyze a frontend file to determine its purpose and auth relevance
 */
async function analyzeFile(filePath, relativePath, frameworkInfo) {
    const content = await fs.readFile(filePath, "utf-8");
    const fileName = path.basename(filePath);
    const fileNameLower = fileName.toLowerCase();
    // Determine file type
    const fileType = determineFileType(fileNameLower, content, relativePath);
    // Check for forms
    const { hasForm, formPurpose, formFields } = analyzeForForms(content);
    // Check for API calls
    const hasApiCall = /(?:fetch|axios|api\.|useQuery|useMutation)/.test(content);
    // Check for event handlers
    const { hasEventHandler, handlerNames } = analyzeEventHandlers(content);
    // Determine if this is a purposeful auth file
    const isPurposeful = determinePurposefulness(fileNameLower, content, fileType, hasForm, hasApiCall, hasEventHandler);
    // Determine suggested injection strategy
    const suggestedInjection = determineSuggestedInjection(fileType, hasForm, hasApiCall, hasEventHandler, isPurposeful);
    return {
        filePath,
        relativePath,
        fileType,
        hasForm,
        formPurpose,
        hasApiCall,
        hasEventHandler,
        isPurposeful,
        suggestedInjection,
        formFields,
        handlerNames,
    };
}
/**
 * Determine the file type based on naming and location
 */
function determineFileType(fileNameLower, content, relativePath) {
    const relativeLower = relativePath.toLowerCase();
    // Hooks (React/Vue/Svelte)
    if (fileNameLower.startsWith("use") || fileNameLower.includes("hook")) {
        return "hook";
    }
    // Services/API files
    if (fileNameLower.includes("service") || fileNameLower.includes("api") || fileNameLower.includes("client")) {
        return "service";
    }
    // Pages/routes
    if (relativeLower.includes("pages/") || relativeLower.includes("routes/") || relativeLower.includes("views/")) {
        return "page";
    }
    // Layouts
    if (fileNameLower.includes("layout") || relativeLower.includes("layouts/")) {
        return "layout";
    }
    // Utilities
    if (fileNameLower.includes("util") || fileNameLower.includes("helper") || fileNameLower.includes("constant")) {
        return "utility";
    }
    // Components (default for most files in React/Vue)
    if (fileNameLower.includes("component") || fileNameLower.includes("login") || fileNameLower.includes("signup") || fileNameLower.includes("form")) {
        return "component";
    }
    // Check if it looks like a component based on content
    if (/(function|const)\s+\w+\s*(?::\s*React\.FC|=\s*(?:async\s*)?(?:\(|<)|=\s*(?:async\s*)?\([^)]*\)\s*=>)/.test(content)) {
        return "component";
    }
    return "other";
}
/**
 * Analyze file for form structures and purposes
 */
function analyzeForForms(content) {
    const formFields = new Set();
    // Check for form elements
    const hasForm = /<form|<input|<textarea|<select/.test(content);
    if (!hasForm) {
        return { hasForm: false, formFields: [] };
    }
    // Determine form purpose
    let formPurpose;
    const contentLower = content.toLowerCase();
    if (contentLower.includes("login") ||
        contentLower.includes("sign-in") ||
        contentLower.includes("signin")) {
        formPurpose = "login";
    }
    else if (contentLower.includes("signup") ||
        contentLower.includes("sign-up") ||
        contentLower.includes("register") ||
        contentLower.includes("create account")) {
        formPurpose = "signup";
    }
    else {
        formPurpose = "generic";
    }
    // Extract form fields
    const fieldRegex = /(?:name|id|v-model|bind|ng-model)\s*=\s*["']([^"']+)["']/gi;
    let match;
    while ((match = fieldRegex.exec(content)) !== null) {
        const fieldName = match[1];
        if (!["submit", "button", "checkbox", "radio"].includes(fieldName)) {
            formFields.add(fieldName);
        }
    }
    return {
        hasForm: true,
        formPurpose,
        formFields: Array.from(formFields),
    };
}
/**
 * Analyze file for event handlers and submission functions
 */
function analyzeEventHandlers(content) {
    const handlers = new Set();
    // Common handler patterns
    const patterns = [
        /(?:const|let|var|function)\s+([a-zA-Z0-9_]*(?:handle|on)[a-zA-Z0-9_]*)\s*[=\(]/gi,
        /\b(login|signup|register|authenticate|submit|handleSubmit)\b/gi,
        /async\s+function\s+([a-zA-Z0-9_]*(?:login|signup|register)[a-zA-Z0-9_]*)/gi,
    ];
    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            if (match[1]) {
                handlers.add(match[1]);
            }
        }
    }
    return {
        hasEventHandler: handlers.size > 0,
        handlerNames: Array.from(handlers),
    };
}
/**
 * Determine if a file is purposefully related to authentication
 */
function determinePurposefulness(fileNameLower, content, fileType, hasForm, hasApiCall, hasEventHandler) {
    // High confidence auth files
    const authKeywords = ["login", "signup", "register", "auth", "signin"];
    if (authKeywords.some((kw) => fileNameLower.includes(kw))) {
        return true;
    }
    // Files with both form and handler are purposeful
    if (hasForm && hasEventHandler) {
        return true;
    }
    // Service/hook files with auth-related names
    if ((fileType === "service" || fileType === "hook") && /auth|login|signup|register/.test(content)) {
        return true;
    }
    // Component files with form and API calls
    if (fileType === "component" && hasForm && hasApiCall) {
        return true;
    }
    return false;
}
/**
 * Determine the best injection strategy for a file
 */
function determineSuggestedInjection(fileType, hasForm, hasApiCall, hasEventHandler, isPurposeful) {
    // Don't inject into utility files
    if (fileType === "utility" || fileType === "layout") {
        return "none";
    }
    // If it's a hook/service, suggest service injection
    if (fileType === "hook" || fileType === "service") {
        return "service";
    }
    // If it's a component with form and handler, inject into handler
    if (fileType === "component" && hasForm && hasEventHandler && isPurposeful) {
        return "handler";
    }
    // If it's a component with form but no handler, suggest hook creation
    if (fileType === "component" && hasForm && !hasEventHandler && isPurposeful) {
        return "hook";
    }
    // If it has an event handler, inject there
    if (hasEventHandler && isPurposeful) {
        return "handler";
    }
    return "none";
}
/**
 * Analyze all files in a frontend project and categorize them
 */
export async function analyzeFiles(targetPath, frameworkInfo) {
    const results = {
        loginComponents: [],
        signupComponents: [],
        apiHooks: [],
        apiServices: [],
        formComponents: [],
        otherFiles: [],
    };
    const extensions = [".js", ".ts", ".jsx", ".tsx", ".vue", ".svelte"];
    const excludeDirs = ["node_modules", "dist", ".next", "build", ".git"];
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
                const ext = path.extname(fullPath);
                if (extensions.includes(ext)) {
                    const relativePath = path.relative(targetPath, fullPath);
                    const analysis = await analyzeFile(fullPath, relativePath, frameworkInfo);
                    // Categorize the file
                    if (analysis.formPurpose === "login" && analysis.isPurposeful) {
                        results.loginComponents.push(analysis);
                    }
                    else if (analysis.formPurpose === "signup" && analysis.isPurposeful) {
                        results.signupComponents.push(analysis);
                    }
                    else if (analysis.fileType === "hook" && analysis.hasApiCall) {
                        results.apiHooks.push(analysis);
                    }
                    else if (analysis.fileType === "service" && analysis.hasApiCall) {
                        results.apiServices.push(analysis);
                    }
                    else if (analysis.hasForm && analysis.isPurposeful) {
                        results.formComponents.push(analysis);
                    }
                    else if (analysis.isPurposeful) {
                        results.otherFiles.push(analysis);
                    }
                }
            }
        }
    }
    try {
        const srcPath = path.join(targetPath, frameworkInfo.srcDir);
        if (await fs.pathExists(srcPath)) {
            await walk(srcPath);
        }
        else {
            await walk(targetPath);
        }
    }
    catch (error) {
        console.error("Error analyzing files:", error);
    }
    return results;
}
