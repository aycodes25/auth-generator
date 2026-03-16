/**
 * ============================================================
 * Dependency Installation Utility
 * ------------------------------------------------------------
 * Automatically runs `npm install` in generated project
 * ============================================================
 */
import { exec } from "child_process";
import { promisify } from "util";
import ora from "ora";
import chalk from "chalk";
const execAsync = promisify(exec);
/**
 * Install dependencies in a project directory
 * @param projectPath - Absolute path to the project folder
 */
export async function installDependencies(projectPath) {
    const spinner = ora("Installing dependencies...").start();
    try {
        await execAsync("npm install", {
            cwd: projectPath,
            windowsHide: true,
        });
        spinner.succeed(chalk.green("Dependencies installed successfully!"));
    }
    catch (error) {
        spinner.fail(chalk.red("Failed to install dependencies"));
        console.error(chalk.yellow("\n⚠️  You can manually run:"));
        console.error(chalk.cyan(`   cd ${projectPath} && npm install\n`));
        throw error;
    }
}
