/**
 * ============================================================
 * Frontend File Analyzer Utility
 * ============================================================
 * Analyzes frontend files to identify authentication-related files
 * Maps which files contain login/signup forms and handlers
 */

import fs from "fs-extra";
import path from "path";
import { FrameworkInfo } from "./frameworkDetector.js";

export interface FileAnalysisResult {
  filePath: string;
  relativePath: string;
  fileType: "component" | "hook" | "service" | "utility" | "page" | "layout" | "other";
  hasForm: boolean;
  formPurpose?: "login" | "signup" | "generic";
  hasApiCall: boolean;
  hasEventHandler: boolean;
  isPurposeful: boolean; // True if file likely contains auth logic
  suggestedInjection: "handler" | "hook" | "service" | "none";
  formFields: string[];
  handlerNames: string[];
}

export interface FileAnalysisMap {
  loginComponents: FileAnalysisResult[];
  signupComponents: FileAnalysisResult[];
  apiHooks: FileAnalysisResult[];
  apiServices: FileAnalysisResult[];
  formComponents: FileAnalysisResult[];
  otherFiles: FileAnalysisResult[];
}

/**
 * Check if file should be excluded from analysis (backend files, configs, etc.)
 */
function shouldExcludeFile(filePath: string, fileName: string): boolean {
  const fileLower = fileName.toLowerCase();
  const pathLower = filePath.toLowerCase();

  // Backend/config patterns - these are NOT frontend components
  const backendPatterns = [
    // Backend directories
    pathLower.includes("server"),
    pathLower.includes("api") && (pathLower.includes("routes") || pathLower.includes("controllers")),
    pathLower.includes("middleware"),
    pathLower.includes("models"),
    pathLower.includes("database"),
    pathLower.includes("backend"),
    pathLower.includes("controller"),
    
    // Config files
    fileLower.includes("config"),
    fileLower.includes("webpack"),
    fileLower.includes("vite"),
    fileLower.includes("babel"),
    fileLower.includes("eslint"),
    fileLower.includes("tsconfig"),
    fileLower.includes("package"),
    fileLower.includes(".env"),
    
    // Backend utilities
    fileLower.includes("db.ts") || fileLower.includes("database.ts"),
    fileLower.includes("query.ts"),
    fileLower.includes("mutation.ts"),
  ];

  return backendPatterns.some(pattern => pattern);
}

/**
 * Analyze a frontend file to determine its purpose and auth relevance
 */
async function analyzeFile(
  filePath: string,
  relativePath: string,
  frameworkInfo: FrameworkInfo
): Promise<FileAnalysisResult> {
  const fileName = path.basename(filePath);
  const fileNameLower = fileName.toLowerCase();

  // Skip backend/utility files
  if (shouldExcludeFile(filePath, fileName)) {
    return {
      filePath,
      relativePath,
      fileType: "utility",
      hasForm: false,
      hasApiCall: false,
      hasEventHandler: false,
      isPurposeful: false,
      suggestedInjection: "none",
      formFields: [],
      handlerNames: [],
    };
  }

  const content = await fs.readFile(filePath, "utf-8");

  // Determine file type
  const fileType = determineFileType(fileNameLower, content, relativePath);

  // Check for forms
  const { hasForm, formPurpose, formFields } = analyzeForForms(content);

  // Check for API calls
  const hasApiCall = /(?:fetch|axios|api\.|useQuery|useMutation)/.test(content);

  // Check for event handlers
  const { hasEventHandler, handlerNames } = analyzeEventHandlers(content);

  // Determine if this is a purposeful auth file
  const isPurposeful = determinePurposefulness(
    fileNameLower,
    content,
    fileType,
    hasForm,
    hasApiCall,
    hasEventHandler,
    relativePath
  );

  // Determine suggested injection strategy
  const suggestedInjection = determineSuggestedInjection(
    fileType,
    hasForm,
    hasApiCall,
    hasEventHandler,
    isPurposeful
  );

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
function determineFileType(
  fileNameLower: string,
  content: string,
  relativePath: string
): FileAnalysisResult["fileType"] {
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
 * STRICT: Only detects actual HTML forms, not just keywords
 */
function analyzeForForms(
  content: string
): {
  hasForm: boolean;
  formPurpose?: "login" | "signup" | "generic";
  formFields: string[];
} {
  const formFields = new Set<string>();

  // Check for actual <form> tags (not just input elements)
  // This is STRICT - we require actual form elements to exist
  const hasFormTag = /<form[\s\S]*?<\/form>/i.test(content);
  
  if (!hasFormTag) {
    return { hasForm: false, formFields: [] };
  }

  // Extract form content for analysis
  const formMatch = content.match(/<form[\s\S]*?<\/form>/i);
  if (!formMatch) {
    return { hasForm: false, formFields: [] };
  }

  const formContent = formMatch[0];
  const contentLower = formContent.toLowerCase();

  // Determine form purpose - must have actual form + context
  let formPurpose: "login" | "signup" | "generic" | undefined = "generic";

  if (
    contentLower.includes("login") ||
    contentLower.includes("sign-in") ||
    contentLower.includes("signin")
  ) {
    formPurpose = "login";
  } else if (
    contentLower.includes("signup") ||
    contentLower.includes("sign-up") ||
    contentLower.includes("register") ||
    contentLower.includes("create account")
  ) {
    formPurpose = "signup";
  }

  // Extract form fields
  const fieldRegex = /(?:name|id|v-model|bind|ng-model)\s*=\s*["']([^"']+)["']/gi;
  let match;
  while ((match = fieldRegex.exec(formContent)) !== null) {
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
 * STRICT MODE: Only detect actual function definitions, not keywords in text/comments
 */
function analyzeEventHandlers(
  content: string
): {
  hasEventHandler: boolean;
  handlerNames: string[];
} {
  const handlers = new Set<string>();

  // ONLY match actual function definitions, not just keyword mentions
  const patterns = [
    // Match: const handleSubmit = () => { }
    /(?:const|let|var)\s+([a-zA-Z0-9_]*(?:handle|on)[a-zA-Z0-9_]*)\s*=\s*(?:async\s*)?\(/gi,
    // Match: function handleSubmit() { }
    /function\s+([a-zA-Z0-9_]*(?:handle|on)[a-zA-Z0-9_]*)\s*\(/gi,
    // Match: handleSubmit = () => { } (arrow function assignment)
    /([a-zA-Z0-9_]*(?:handle|on)[a-zA-Z0-9_]*)\s*:\s*(?:async\s*)?\([^)]*\)\s*=>/gi,
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
 * STRICT: Only considers actual UI components with forms, not utility files
 */
function determinePurposefulness(
  fileNameLower: string,
  content: string,
  fileType: FileAnalysisResult["fileType"],
  hasForm: boolean,
  hasApiCall: boolean,
  hasEventHandler: boolean,
  filePath?: string // Add file path for better filtering
): boolean {
  // REJECT: Files that are clearly utilities/non-components
  if (fileType === "utility" || fileType === "other" || fileType === "service") {
    return false; // Utility/service/other files are NOT auth components
  }

  // REJECT: Files with "login" in name but NOT a component type
  // (e.g., login.ts utility file vs Login.jsx component)
  const authKeywords = ["login", "signup", "register", "auth", "signin"];
  if (authKeywords.some((kw) => fileNameLower.includes(kw))) {
    // Only consider it purposeful if it's actually a component with a form
    if (fileType === "component" && hasForm) {
      return true;
    }
    // Or if it's a hook/service specifically for auth
    if ((fileType === "hook") && /useAuth|useLogin|useSignup/.test(content)) {
      return true;
    }
    // Otherwise it's just a utility mentioning these keywords
    return false;
  }

  // ONLY accept if has ACTUAL form + event handler
  if (hasForm && hasEventHandler && fileType === "component") {
    return true;
  }

  // Hook files with auth-specific patterns
  if (fileType === "hook" && /useAuth|useLogin|useSignup|login|signup/.test(fileNameLower)) {
    return true;
  }

  return false;
}

/**
 * Determine the best injection strategy for a file
 * STRICT: Only suggests injection for actual UI components with forms
 */
function determineSuggestedInjection(
  fileType: FileAnalysisResult["fileType"],
  hasForm: boolean,
  hasApiCall: boolean,
  hasEventHandler: boolean,
  isPurposeful: boolean
): FileAnalysisResult["suggestedInjection"] {
  // REJECT: Don't inject into utility files or layouts
  if (fileType === "utility" || fileType === "layout" || fileType === "other" || fileType === "service") {
    return "none";
  }

  // ONLY inject into actual UI components with forms
  if (fileType === "component") {
    // Must have an actual form to be injectable
    if (!hasForm) {
      return "none"; // No form = not a form component
    }

    // Has form + event handler = inject into handler
    if (hasEventHandler && isPurposeful) {
      return "handler";
    }

    // Has form but no handler = suggest creating hook to handle it
    if (!hasEventHandler && isPurposeful) {
      return "hook";
    }

    return "none";
  }

  // For hooks: if it's already a hook, no injection needed (it's for other components to use)
  if (fileType === "hook") {
    return "none";
  }

  return "none";
}

/**
 * Analyze all files in a frontend project and categorize them
 */
export async function analyzeFiles(
  targetPath: string,
  frameworkInfo: FrameworkInfo
): Promise<FileAnalysisMap> {
  const results: FileAnalysisMap = {
    loginComponents: [],
    signupComponents: [],
    apiHooks: [],
    apiServices: [],
    formComponents: [],
    otherFiles: [],
  };

  const extensions = [".js", ".ts", ".jsx", ".tsx", ".vue", ".svelte"];
  // Exclude: node_modules, build outputs, backend-specific directories, config files
  const excludeDirs = [
    "node_modules",
    "dist",
    ".next",
    "build",
    ".git",
    ".vscode",
    ".idea",
    "server",
    "api",
    "backend",
    "controllers",
    "models",
    "middleware",
    "routes",
    "database",
    "db",
  ];

  async function walk(dir: string) {
    const files = await fs.readdir(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        if (!excludeDirs.includes(file)) {
          await walk(fullPath);
        }
      } else {
        const ext = path.extname(fullPath);
        if (extensions.includes(ext)) {
          const relativePath = path.relative(targetPath, fullPath);
          const analysis = await analyzeFile(fullPath, relativePath, frameworkInfo);

          // Categorize the file
          if (analysis.formPurpose === "login" && analysis.isPurposeful) {
            results.loginComponents.push(analysis);
          } else if (analysis.formPurpose === "signup" && analysis.isPurposeful) {
            results.signupComponents.push(analysis);
          } else if (analysis.fileType === "hook" && analysis.hasApiCall) {
            results.apiHooks.push(analysis);
          } else if (analysis.fileType === "service" && analysis.hasApiCall) {
            results.apiServices.push(analysis);
          } else if (analysis.hasForm && analysis.isPurposeful) {
            results.formComponents.push(analysis);
          } else if (analysis.isPurposeful) {
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
    } else {
      await walk(targetPath);
    }
  } catch (error) {
    console.error("Error analyzing files:", error);
  }

  return results;
}
