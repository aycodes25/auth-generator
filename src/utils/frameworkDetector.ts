/**
 * ============================================================
 * Frontend Framework Detector Utility
 * ============================================================
 * Intelligently detects the frontend framework and project type
 * Returns framework info needed for accurate code injection
 */

import fs from "fs-extra";
import path from "path";

export type Framework = "react" | "vue" | "angular" | "svelte" | "plain" | "unknown";
export type PackageManager = "npm" | "yarn" | "pnpm" | "bun";

export interface FrameworkInfo {
  framework: Framework;
  type: "app-router" | "pages-router" | "nuxt" | "vite" | "next" | "cra" | "unknown";
  packageManager: PackageManager;
  version?: string;
  supportsTypeScript: boolean;
  mainExtension: ".js" | ".ts" | ".jsx" | ".tsx" | ".vue";
  srcDir: string;
  configFiles: string[];
  hasEslint: boolean;
  hasEsm: boolean;
}

/**
 * Detect the frontend framework from package.json and project structure
 */
export async function detectFramework(
  targetPath: string
): Promise<FrameworkInfo> {
  try {
    const packageJsonPath = path.join(targetPath, "package.json");
    const hasPackageJson = await fs.pathExists(packageJsonPath);

    if (!hasPackageJson) {
      return getDefaultFrameworkInfo("plain");
    }

    const packageJson = await fs.readJson(packageJsonPath);
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Detect framework
    const framework = detectFrameworkType(dependencies);
    const type = detectProjectType(targetPath, dependencies, packageJson);
    const supportsTypeScript = hasTypescriptSupport(dependencies);
    const hasEslint = "eslint" in dependencies;
    const hasEsm = packageJson.type === "module" || (packageJson.exports !== undefined);

    // Determine src directory
    const srcDir = await detectSrcDirectory(targetPath);

    // Determine main extension
    const mainExtension = determineMainExtension(
      framework,
      supportsTypeScript,
      srcDir
    );

    // Detect config files
    const configFiles = await detectConfigFiles(targetPath);

    // Detect package manager
    const packageManager = detectPackageManager(targetPath);

    return {
      framework,
      type,
      packageManager,
      version: dependencies[framework === "react" ? "react" : framework],
      supportsTypeScript,
      mainExtension,
      srcDir,
      configFiles,
      hasEslint,
      hasEsm,
    };
  } catch (error) {
    console.error("Error detecting framework:", error);
    return getDefaultFrameworkInfo("unknown");
  }
}

/**
 * Detect the primary framework from dependencies
 */
function detectFrameworkType(dependencies: Record<string, string>): Framework {
  if ("next" in dependencies) return "react"; // Next.js is React-based
  if ("react" in dependencies) return "react";
  if ("vue" in dependencies) return "vue";
  if ("nuxt" in dependencies) return "vue"; // Nuxt is Vue-based
  if ("@angular/core" in dependencies) return "angular";
  if ("svelte" in dependencies) return "svelte";
  if ("preact" in dependencies) return "react"; // Preact is React-compatible
  return "plain";
}

/**
 * Detect the project type (Next.js app router, pages router, Nuxt, CRA, Vite, etc.)
 */
function detectProjectType(
  targetPath: string,
  dependencies: Record<string, string>,
  packageJson: any
): FrameworkInfo["type"] {
  if ("next" in dependencies) {
    const nextVersion = dependencies["next"];
    // Next.js 13+ defaults to app router
    const majorVersion = parseInt(nextVersion?.split(".")[0] || "0");
    return majorVersion >= 13 ? "app-router" : "pages-router";
  }

  if ("nuxt" in dependencies) return "nuxt";

  if ("next" in dependencies) return "next";

  if (packageJson.type === "module" && ("vite" in dependencies || "webpack" in dependencies)) {
    return "vite";
  }

  if ("react-scripts" in dependencies) return "cra"; // Create React App

  return "unknown";
}

/**
 * Detect if the project supports TypeScript
 */
function hasTypescriptSupport(dependencies: Record<string, string>): boolean {
  return "typescript" in dependencies;
}

/**
 * Detect the src directory location
 */
async function detectSrcDirectory(targetPath: string): Promise<string> {
  const possibleDirs = ["src", "app", "pages", "components"];

  for (const dir of possibleDirs) {
    const fullPath = path.join(targetPath, dir);
    if (await fs.pathExists(fullPath)) {
      return dir;
    }
  }

  return "src"; // Default fallback
}

/**
 * Determine the main file extension based on framework and TypeScript support
 */
function determineMainExtension(
  framework: Framework,
  supportsTypeScript: boolean,
  srcDir: string
): ".js" | ".ts" | ".jsx" | ".tsx" | ".vue" {
  if (framework === "vue") return ".vue";
  if (framework === "angular") return supportsTypeScript ? ".ts" : ".js";
  if (framework === "svelte") return supportsTypeScript ? ".ts" : ".js";

  // React/Preact/Plain JS
  if (framework === "plain") {
    return supportsTypeScript ? ".ts" : ".js";
  }

  // React - use .tsx if TypeScript, else .jsx
  return supportsTypeScript ? ".tsx" : ".jsx";
}

/**
 * Detect configuration files in the project
 */
async function detectConfigFiles(targetPath: string): Promise<string[]> {
  const possibleConfigs = [
    "vite.config.ts",
    "vite.config.js",
    "webpack.config.js",
    "webpack.config.ts",
    "next.config.js",
    "next.config.ts",
    "nuxt.config.ts",
    "nuxt.config.js",
    "vue.config.js",
    "svelte.config.js",
    "tsconfig.json",
    "jsconfig.json",
  ];

  const found: string[] = [];
  for (const config of possibleConfigs) {
    if (await fs.pathExists(path.join(targetPath, config))) {
      found.push(config);
    }
  }

  return found;
}

/**
 * Detect which package manager is used
 */
function detectPackageManager(targetPath: string): PackageManager {
  // Check for lock files in order of preference
  if (fs.existsSync(path.join(targetPath, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(targetPath, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(targetPath, "bun.lockb"))) return "bun";
  return "npm"; // Default fallback
}

/**
 * Get default framework info for a given framework type
 */
function getDefaultFrameworkInfo(framework: Framework): FrameworkInfo {
  const defaults: Record<Framework, FrameworkInfo> = {
    react: {
      framework: "react",
      type: "unknown",
      packageManager: "npm",
      supportsTypeScript: false,
      mainExtension: ".jsx",
      srcDir: "src",
      configFiles: [],
      hasEslint: false,
      hasEsm: true,
    },
    vue: {
      framework: "vue",
      type: "unknown",
      packageManager: "npm",
      supportsTypeScript: false,
      mainExtension: ".vue",
      srcDir: "src",
      configFiles: [],
      hasEslint: false,
      hasEsm: true,
    },
    angular: {
      framework: "angular",
      type: "unknown",
      packageManager: "npm",
      supportsTypeScript: true,
      mainExtension: ".ts",
      srcDir: "src",
      configFiles: [],
      hasEslint: false,
      hasEsm: true,
    },
    svelte: {
      framework: "svelte",
      type: "unknown",
      packageManager: "npm",
      supportsTypeScript: false,
      mainExtension: ".js",
      srcDir: "src",
      configFiles: [],
      hasEslint: false,
      hasEsm: true,
    },
    plain: {
      framework: "plain",
      type: "unknown",
      packageManager: "npm",
      supportsTypeScript: false,
      mainExtension: ".js",
      srcDir: ".",
      configFiles: [],
      hasEslint: false,
      hasEsm: false,
    },
    unknown: {
      framework: "unknown",
      type: "unknown",
      packageManager: "npm",
      supportsTypeScript: false,
      mainExtension: ".js",
      srcDir: "src",
      configFiles: [],
      hasEslint: false,
      hasEsm: false,
    },
  };

  return defaults[framework];
}
