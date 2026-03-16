/**
 * ============================================================
 * Template Copying Utility
 * ------------------------------------------------------------
 * Copies template files with progress indication
 * ============================================================
 */
import fs from "fs-extra";
import path from "path";
import ora from "ora";
import chalk from "chalk";
/**
 * Copy template to destination with exclusions
 * @param source - Template source path
 * @param destination - Project destination path
 */
export async function copyTemplate(source, destination) {
    const spinner = ora("Copying template files...").start();
    try {
        // Check if source exists
        const sourceExists = await fs.pathExists(source);
        if (!sourceExists) {
            throw new Error(`Template not found at: ${source}`);
        }
        // Create destination directory
        await fs.ensureDir(destination);
        // Copy with exclusions
        await fs.copy(source, destination, {
            filter: (src) => {
                const basename = path.basename(src);
                // Exclude node_modules, dist, and other build artifacts
                return (!basename.includes("node_modules") &&
                    !basename.includes("dist") &&
                    !basename.includes(".sqlite") &&
                    basename !== ".env");
            },
        });
        spinner.succeed(chalk.green(`Template copied to ${destination}`));
    }
    catch (error) {
        spinner.fail(chalk.red("Failed to copy template"));
        throw error;
    }
}
