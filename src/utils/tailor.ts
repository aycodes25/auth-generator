/**
 * ============================================================
 * Backend Tailoring Utility (Advanced - Flexible + Aliasing)
 * ------------------------------------------------------------
 * Modifies generated backend files to match frontend requirements
 * Uses aliasing to preserve email/password variables in controllers
 * Auto-sanitizes invalid field names to prevent SQL syntax errors
 * ============================================================
 */

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { ScanResult, EndpointInfo } from "./scanner.js";
import { sanitizeColumn, createFieldMapping, logFieldNormalization } from "./sanitizeColumn.js";

export interface TailorResult {
    filesModified: string[];
    tailoredEndpoints: string[];
}

export async function tailorBackend(
    projectPath: string,
    scanResult: ScanResult
): Promise<TailorResult> {
    const result: TailorResult = {
        filesModified: [],
        tailoredEndpoints: [],
    };

    if (scanResult.endpoints.length === 0) return result;

    async function findPath(subPaths: string[]): Promise<string | null> {
        for (const sub of subPaths) {
            const full = path.join(projectPath, sub);
            if (await fs.pathExists(full)) return full;
        }
        return null;
    }

    const routesPath = await findPath(["src/routes/auth.ts", "routes/auth.ts", "src/routes/auth.js", "routes/auth.js"]);
    const controllerPath = await findPath(["src/controllers/authController.ts", "controllers/authController.ts", "src/controllers/authController.js", "controllers/authController.js"]);
    const dbPath = await findPath(["src/utils/db.ts", "utils/db.ts", "src/utils/db.js", "utils/db.js"]);

    try {
        const customFields = new Set<string>();
        scanResult.endpoints.forEach(e => {
            if (e.purpose === "signup" || e.purpose === "generic") {
                e.fields.forEach(f => {
                    if (!["id", "email", "password", "created_at"].includes(f)) {
                        customFields.add(f);
                    }
                });
            }
        });

        if (dbPath && customFields.size > 0) {
            let dbContent = await fs.readFile(dbPath, "utf-8");
            
            // Create mapping of original to sanitized field names
            const customFieldsArray = Array.from(customFields);
            const fieldMapping = createFieldMapping(customFieldsArray);
            logFieldNormalization(fieldMapping);
            
            // Use sanitized field names in the schema
            const sanitizedFields = customFieldsArray.map(f => sanitizeColumn(f));
            const fieldLines = sanitizedFields.map(f => `        ${f} TEXT,`).join("\n");
            
            // Store mapping in db.ts as a constant for the controller to use
            const mappingExport = `
// Field name mappings (original → sanitized)
export const FIELD_MAPPING = ${JSON.stringify(fieldMapping, null, 2)};`;
            
            dbContent = dbContent.replace(
                /(created_at\s+DATETIME\s+DEFAULT\s+CURRENT_TIMESTAMP\s*)(\);)/,
                (match, lastCol, closing) => `${fieldLines}\n        ${lastCol}${closing}`
            );
            
            // Add field mapping export at the end, before module exports if any
            if (!dbContent.includes("export const FIELD_MAPPING")) {
                dbContent = mappingExport + "\n\n" + dbContent;
            }
            
            await fs.writeFile(dbPath, dbContent, "utf-8");
            result.filesModified.push(path.relative(projectPath, dbPath));
        }

        if (routesPath) {
            let routesContent = await fs.readFile(routesPath, "utf-8");
            const signupEndpoint = scanResult.endpoints.find(e => e.purpose === "signup");
            const loginEndpoint = scanResult.endpoints.find(e => e.purpose === "login");

            if (signupEndpoint) {
                const cleanedPath = signupEndpoint.path.replace(/^\/api/, "");
                routesContent = routesContent.replace(/router\.(post|put|patch)\s*\(\s*['"`]\/signup['"`]/, `router.${signupEndpoint.method.toLowerCase()}("${cleanedPath}"`);
                result.tailoredEndpoints.push(`Signup: ${signupEndpoint.path}`);
            }
            if (loginEndpoint) {
                const cleanedPath = loginEndpoint.path.replace(/^\/api/, "");
                routesContent = routesContent.replace(/router\.(post|put|patch)\s*\(\s*['"`]\/login['"`]/, `router.${loginEndpoint.method.toLowerCase()}("${cleanedPath}"`);
                result.tailoredEndpoints.push(`Login: ${loginEndpoint.path}`);
            }
            await fs.writeFile(routesPath, routesContent, "utf-8");
            result.filesModified.push(path.relative(projectPath, routesPath));
        }

        if (controllerPath) {
            let controllerContent = await fs.readFile(controllerPath, "utf-8");

            const signupEndpoint = scanResult.endpoints.find(e => e.purpose === "signup");
            const signupFields = signupEndpoint ? signupEndpoint.fields : [];

            if (signupEndpoint && signupFields.length > 0) {
                const emailField = signupFields.find(f => f.toLowerCase().includes("email")) || "email";
                const passwordField = signupFields.find(f => f.toLowerCase().includes("password")) || "password";
                const nameField = signupFields.find(f => f.toLowerCase().includes("name") && f !== emailField && f !== passwordField) || "name";
                const otherFields = signupFields.filter(f => ![emailField, passwordField, nameField].includes(f));

                const destructuringParts = [];
                destructuringParts.push(emailField === "email" ? "email" : `${emailField}: email`);
                destructuringParts.push(passwordField === "password" ? "password" : `${passwordField}: password`);
                destructuringParts.push(nameField === "name" ? "name" : `${nameField}: name`);
                destructuringParts.push(...otherFields);
                const destructuring = `{ ${destructuringParts.join(", ")} }`;

                controllerContent = controllerContent.replace(
                    /const\s*{\s*email,\s*password,\s*name\s*}\s*=\s*req\.body/,
                    `const ${destructuring} = req.body`
                );

                // Use sanitized field names for database columns
                const columns = signupFields.filter(f => f !== "id").map(f => sanitizeColumn(f));
                const originalColumns = signupFields.filter(f => f !== "id");
                const params = originalColumns.map(f => {
                    if (f === emailField) return "email";
                    if (f === passwordField) return "hashedPassword";
                    if (f === nameField) return "name";
                    return sanitizeColumn(f);
                });
                const placeholders = columns.map(() => "?").join(", ");

                controllerContent = controllerContent.replace(
                    /db\.run\(\s*['"`]INSERT\s+INTO\s+users\s*\([^)]+\)\s*VALUES\s*\([^)]+\)['"`]\s*,\s*\[([^\]]+)\]/g,
                    (match, existingParams) => {
                        if (existingParams.includes("email") && existingParams.includes("hashedPassword")) {
                            // Use sanitized column names
                            const allColumns = ["email", "password", ...columns];
                            const allPlaceholders = allColumns.map(() => "?").join(", ");
                            const allParams = ["email", "hashedPassword", ...params];

                            return `db.run(\n      "INSERT INTO users (${allColumns.join(", ")}) VALUES (${allPlaceholders})",\n      [${allParams.join(", ")}]`;
                        }
                        return match;
                    }
                );

                // Use sanitized field names in response object
                const userObjectFields = originalColumns.filter(f => f !== passwordField).map(f => {
                    const sanitized = sanitizeColumn(f);
                    if (f === "id") return "id: this.lastID";
                    if (f === emailField) return "email";
                    if (f === nameField) return "name";
                    return `${sanitized}: ${sanitized}`;
                }).join(", ");
                controllerContent = controllerContent.replace(
                    /user:\s*{\s*id:\s*this\.lastID,\s*email,\s*name\s*}/,
                    `user: { ${userObjectFields} }`
                );
            }

            const loginEndpoint = scanResult.endpoints.find(e => e.purpose === "login");
            const loginFields = loginEndpoint ? loginEndpoint.fields : [];
            if (loginEndpoint && loginFields.length > 0) {
                const emailField = loginFields.find(f => f.toLowerCase().includes("email")) || "email";
                const passwordField = loginFields.find(f => f.toLowerCase().includes("password")) || "password";
                const otherFields = loginFields.filter(f => ![emailField, passwordField].includes(f));

                const destParts = [];
                destParts.push(emailField === "email" ? "email" : `${emailField}: email`);
                destParts.push(passwordField === "password" ? "password" : `${passwordField}: password`);
                destParts.push(...otherFields);

                controllerContent = controllerContent.replace(
                    /const\s*{\s*email,\s*password\s*}\s*=\s*req\.body/,
                    `const { ${destParts.join(", ")} } = req.body`
                );

                const userResponseFields = Array.from(customFields).map(f => {
                    const sanitized = sanitizeColumn(f);
                    return `${sanitized}: user.${sanitized}`;
                }).join(", ");
                controllerContent = controllerContent.replace(
                    /user:\s*{\s*id:\s*user\.id,\s*email:\s*user\.email,\s*name:\s*user\.name\s*}/,
                    `user: { id: user.id, email: user.email, name: user.name, ${userResponseFields} }`
                );
            }

            if (customFields.size > 0) {
                // Use sanitized field names in SELECT query
                const sanitizedCustomFields = Array.from(customFields).map(f => sanitizeColumn(f)).join(", ");
                const allCols = "id, email, name, " + sanitizedCustomFields + ", created_at";
                controllerContent = controllerContent.replace(
                    /SELECT\s+id,\s+email,\s+name,\s+created_at\s+FROM\s+users/,
                    `SELECT ${allCols} FROM users`
                );
            }

            await fs.writeFile(controllerPath, controllerContent, "utf-8");
            result.filesModified.push(path.relative(projectPath, controllerPath));
        }
    } catch (error) {
        console.error(chalk.red(`\n❌ Error during tailoring: ${error}`));
    }
    return result;
}
