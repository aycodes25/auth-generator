/**
 * ============================================================
 * Auth-Gen CLI Entry Point (v2.0 - Enhanced)
 * ============================================================
 * Interactive CLI tool for generating authentication backends
 * Now with intelligent framework detection and precise file analysis
 * ============================================================
 */

import inquirer from "inquirer";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import { copyTemplate } from "./utils/copyTemplate.js";
import { installDependencies } from "./utils/installDependencies.js";
import { generateEnvFile } from "./utils/generateEnv.js";
import { scanFrontend, ScanResult } from "./utils/scanner.js";
import { plugFrontend } from "./utils/plugger.js";
import { tailorBackend } from "./utils/tailor.js";
import { enhancedScanFrontend, formatScanResults } from "./utils/enhancedScanner.js";
import { accuratePlugFrontend } from "./utils/accuratePlugger.js";

/**
 * Display welcome banner
 */
function displayWelcome() {
  console.clear();
  console.log(chalk.cyan.bold("\n🔐 Auth-Gen - Authentication Backend Generator\n"));
  console.log(chalk.gray("Generate production-ready auth backends in seconds\n"));
}

/**
 * Main CLI runner function
 */
async function run() {
  try {
    displayWelcome();

    /**
     * ==========================================
     * STEP 1 — Collect User Configuration
     * ==========================================
     */
    const answers = await inquirer.prompt([
      {
        type: "list",
        name: "backend",
        message: "Select backend framework:",
        choices: [
          "Express",
          // Future: "NestJS (Simple)", "NestJS (Modular)", "Next.js API", "PHP"
        ],
      },
      {
        type: "list",
        name: "database",
        message: "Select database:",
        choices: [
          "SQLite",
          // Future: "PostgreSQL", "MySQL", "MongoDB"
        ],
      },
      {
        type: "input",
        name: "projectName",
        message: "Project name:",
        default: "my-auth-backend",
        validate: (input) => {
          if (!input.trim()) return "Project name cannot be empty";
          if (!/^[a-z0-9-_]+$/i.test(input)) {
            return "Project name can only contain letters, numbers, hyphens, and underscores";
          }
          return true;
        },
      },
      {
        type: "input",
        name: "frontendPath",
        message: "Frontend path (optional, for auto-scanning):",
        default: "",
      },
    ]);

    const templatePath = path.join(
      process.cwd(),
      "templates",
      answers.backend.toLowerCase(),
      answers.database.toLowerCase()
    );

    // Validate frontend path if provided
    let frontendPath = "";
    if (answers.frontendPath) {
      frontendPath = path.isAbsolute(answers.frontendPath)
        ? answers.frontendPath
        : path.resolve(process.cwd(), answers.frontendPath);
    }

    const projectPath = path.join(process.cwd(), answers.projectName);

    console.log(chalk.gray(`\n📂 Template: ${templatePath}`));
    console.log(chalk.gray(`📁 Destination: ${projectPath}\n`));

    /**
     * ==========================================
     * STEP 3 — Copy Template
     * ==========================================
     */
    await copyTemplate(templatePath, projectPath);

    /**
     * ==========================================
     * STEP 4 — Enhanced Frontend Scan (Optional)
     * ==========================================
     */
    let scanResult: ScanResult | null = null;
    let enhancedScan: any = null;
    if (frontendPath) {
      try {
        const spinner = ora(chalk.blue("🔍 Advanced frontend analysis...")).start();
        enhancedScan = await enhancedScanFrontend(frontendPath);
        spinner.succeed(chalk.green("✅ Analysis complete!"));
        
        // Display formatted results
        formatScanResults(enhancedScan);
        
        // Also run legacy scanner for backward compatibility
        scanResult = await scanFrontend(frontendPath);
      } catch (error) {
        console.log(chalk.yellow("⚠️  Falling back to legacy scanner..."));
        const spinner = ora(chalk.blue("Scanning frontend...")).start();
        scanResult = await scanFrontend(frontendPath);
        spinner.succeed(chalk.green("Scan complete!"));
      }
    }

    /**
     * ==========================================
     * STEP 5 — Tailor Backend
     * ==========================================
     */
    if (scanResult) {
      const spinner = ora(chalk.blue("Tailoring backend to match frontend requirements...")).start();
      const results = await tailorBackend(projectPath, scanResult);
      if (results.filesModified.length > 0) {
        spinner.succeed(chalk.green(`Tailoring complete! Customized ${results.filesModified.length} files.`));
        results.tailoredEndpoints.forEach(e => console.log(chalk.gray(`  - ${e}`)));
      } else {
        spinner.info(chalk.gray("No specific tailoring required for this frontend structure."));
      }
    }

    /**
     * ==========================================
     * STEP 6 — Generate .env File
     * ==========================================
     */
    await generateEnvFile(projectPath, answers.database);

    /**
     * ==========================================
     * STEP 5 — Install Dependencies
     * ==========================================
     */
    const { install } = await inquirer.prompt([
      {
        type: "confirm",
        name: "install",
        message: "Install dependencies now?",
        default: true,
      },
    ]);

    if (install) {
      await installDependencies(projectPath);
    }

    /**
     * ==========================================
     * STEP 7 — Accurate Frontend API Plugging (Optional)
     * ==========================================
     */
    if (frontendPath) {
      const { confirmPlug } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirmPlug",
          message: `Auto-plug API calls in ${path.basename(frontendPath)}?`,
          default: true,
        },
      ]);

      if (confirmPlug) {
        try {
          // Try accurate plugger first (if enhanced scan succeeded)
          if (enhancedScan) {
            const spinner = ora(chalk.blue("💉 Intelligently injecting API calls...")).start();
            const results = await accuratePlugFrontend(frontendPath, "http://localhost:5000");
            spinner.succeed(chalk.green(`✅ Injection complete!`));
            console.log(chalk.gray(`\n📊 Results:`));
            results.details.forEach(detail => console.log(chalk.gray(detail)));
          } else {
            // Fallback to legacy plugger
            const spinner = ora(chalk.blue("Plugging API calls into frontend...")).start();
            const results = await plugFrontend(frontendPath, "http://localhost:5000", scanResult || undefined);
            spinner.succeed(chalk.green(`Plugging complete! Updated ${results.filesUpdated} files and performed ${results.injectionsCount} code injections.`));
          }
        } catch (error) {
          console.log(chalk.yellow("⚠️  Falling back to standard plugging..."));
          const spinner = ora(chalk.blue("Plugging API calls into frontend...")).start();
          const results = await plugFrontend(frontendPath, "http://localhost:5000", scanResult || undefined);
          spinner.succeed(chalk.green(`Plugging complete! Updated ${results.filesUpdated} files.`));
        }
      }
    }

    /**
     * ==========================================
     * STEP 6 — Final Instructions
     * ==========================================
     */
    console.log(chalk.green.bold("\n✅ Project generated successfully!\n"));
    console.log(chalk.cyan("Next steps:"));
    console.log(chalk.white(`  cd ${answers.projectName}`));
    if (!install) {
      console.log(chalk.white(`  npm install`));
    }
    console.log(chalk.white(`  npm run dev`));
    console.log(chalk.gray("\nYour auth backend is ready to use! 🚀\n"));
  } catch (error) {
    console.error(chalk.red("\n❌ Error:"), error);
    process.exit(1);
  }
}

/**
 * Execute CLI
 */
run();
