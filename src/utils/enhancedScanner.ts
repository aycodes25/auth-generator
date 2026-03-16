/**
 * ============================================================
 * Enhanced Frontend Scanner Utility
 * ============================================================
 * Advanced scanner that leverages framework detection
 * Provides accurate endpoint and form field detection
 */

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { FrameworkInfo, detectFramework } from "./frameworkDetector.js";
import { analyzeFiles } from "./fileAnalyzer.js";
import { execSync } from "child_process";

export interface EnhancedScanResult {
  framework: FrameworkInfo;
  loginEndpoint: {
    path: string;
    method: string;
    fields: string[];
    sourceFile: string;
  } | null;
  signupEndpoint: {
    path: string;
    method: string;
    fields: string[];
    sourceFile: string;
  } | null;
  customEndpoints: Array<{
    path: string;
    method: string;
    fields: string[];
    sourceFile: string;
  }>;
  formComponents: string[];
  apiServices: string[];
  historyInsights: string[];
  filesScanned: number;
}

/**
 * Enhanced scan of frontend with framework awareness
 */
export async function enhancedScanFrontend(
  targetPath: string
): Promise<EnhancedScanResult> {
  const result: EnhancedScanResult = {
    framework: { framework: "unknown", type: "unknown", packageManager: "npm", supportsTypeScript: false, mainExtension: ".js", srcDir: "src", configFiles: [], hasEslint: false, hasEsm: false },
    loginEndpoint: null,
    signupEndpoint: null,
    customEndpoints: [],
    formComponents: [],
    apiServices: [],
    historyInsights: [],
    filesScanned: 0,
  };

  try {
    // Step 1: Detect framework
    console.log(chalk.blue("🔍 Detecting framework..."));
    const frameworkInfo = await detectFramework(targetPath);
    result.framework = frameworkInfo;
    console.log(chalk.gray(`   Framework: ${frameworkInfo.framework}`));
    console.log(chalk.gray(`   Type: ${frameworkInfo.type}`));
    console.log(chalk.gray(`   TypeScript: ${frameworkInfo.supportsTypeScript}`));

    // Step 2: Analyze files
    console.log(chalk.blue("📊 Analyzing files..."));
    const fileAnalysis = await analyzeFiles(targetPath, frameworkInfo);

    // Step 3: Extract endpoint information from analysis
    if (fileAnalysis.loginComponents.length > 0) {
      const loginComponent = fileAnalysis.loginComponents[0];
      result.loginEndpoint = {
        path: "/api/login",
        method: "POST",
        fields: loginComponent.formFields,
        sourceFile: loginComponent.relativePath,
      };
    }

    if (fileAnalysis.signupComponents.length > 0) {
      const signupComponent = fileAnalysis.signupComponents[0];
      result.signupEndpoint = {
        path: "/api/signup",
        method: "POST",
        fields: signupComponent.formFields,
        sourceFile: signupComponent.relativePath,
      };
    }

    // Step 4: Map form components
    for (const component of fileAnalysis.formComponents) {
      result.formComponents.push(component.relativePath);
    }

    // Step 5: Map API services
    for (const service of [
      ...fileAnalysis.apiServices,
      ...fileAnalysis.apiHooks,
    ]) {
      result.apiServices.push(service.relativePath);
    }

    // Step 6: Get git history insights
    console.log(chalk.blue("📜 Analyzing git history..."));
    result.historyInsights = analyzeGitHistory(targetPath);

    // Count files scanned
    result.filesScanned = Object.values(fileAnalysis).reduce(
      (count, arr) => count + arr.length,
      0
    );

    console.log(chalk.green(`✅ Scan complete!\n`));
    console.log(chalk.gray(`   Files analyzed: ${result.filesScanned}`));
    if (result.loginEndpoint) {
      console.log(chalk.gray(`   Login form found: ${result.loginEndpoint.sourceFile}`));
      console.log(chalk.gray(`   Fields: ${result.loginEndpoint.fields.join(", ")}`));
    }
    if (result.signupEndpoint) {
      console.log(chalk.gray(`   Signup form found: ${result.signupEndpoint.sourceFile}`));
      console.log(chalk.gray(`   Fields: ${result.signupEndpoint.fields.join(", ")}`));
    }

    return result;
  } catch (error) {
    console.error(chalk.red(`Error during enhanced scanning: ${error}`));
    throw error;
  }
}

/**
 * Analyze git history for auth-related commits
 */
function analyzeGitHistory(targetPath: string): string[] {
  const insights: string[] = [];

  try {
    const gitDir = targetPath;
    const gitExists = fs.existsSync(path.join(gitDir, ".git"));

    if (!gitExists) {
      return [];
    }

    const log = execSync(
      'git log -n 10 --grep="auth\\|login\\|signup\\|register" --pretty=format:"%s"',
      {
        cwd: gitDir,
        encoding: "utf-8",
      }
    );

    const commits = log
      .split("\n")
      .filter((line) => line.trim() !== "")
      .slice(0, 3);

    commits.forEach((commit) => {
      insights.push(`Recent auth change: ${commit}`);
    });
  } catch (e) {
    // Git not available or not a git repo
  }

  return insights;
}

/**
 * Format scan results for display
 */
export function formatScanResults(scan: EnhancedScanResult): void {
  console.log(chalk.cyan("\n📋 Scan Results:\n"));

  if (scan.loginEndpoint) {
    console.log(chalk.white("🔐 Login Endpoint:"));
    console.log(chalk.gray(`   Path: ${scan.loginEndpoint.path}`));
    console.log(chalk.gray(`   Method: ${scan.loginEndpoint.method}`));
    console.log(chalk.gray(`   Fields: ${scan.loginEndpoint.fields.join(", ")}`));
    console.log(chalk.gray(`   Source: ${scan.loginEndpoint.sourceFile}\n`));
  }

  if (scan.signupEndpoint) {
    console.log(chalk.white("📝 Signup Endpoint:"));
    console.log(chalk.gray(`   Path: ${scan.signupEndpoint.path}`));
    console.log(chalk.gray(`   Method: ${scan.signupEndpoint.method}`));
    console.log(chalk.gray(`   Fields: ${scan.signupEndpoint.fields.join(", ")}`));
    console.log(chalk.gray(`   Source: ${scan.signupEndpoint.sourceFile}\n`));
  }

  if (scan.formComponents.length > 0) {
    console.log(chalk.white("📋 Form Components:"));
    scan.formComponents.forEach((comp) => {
      console.log(chalk.gray(`   - ${comp}`));
    });
    console.log();
  }

  if (scan.apiServices.length > 0) {
    console.log(chalk.white("🔌 API Services/Hooks:"));
    scan.apiServices.forEach((service) => {
      console.log(chalk.gray(`   - ${service}`));
    });
    console.log();
  }

  if (scan.historyInsights.length > 0) {
    console.log(chalk.white("📜 Git History:"));
    scan.historyInsights.forEach((insight) => {
      console.log(chalk.gray(`   - ${insight}`));
    });
    console.log();
  }
}
