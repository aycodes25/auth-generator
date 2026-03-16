/**
 * ============================================================
 * TypeScript Syntax Remover Utility
 * ============================================================
 * Automatically removes TypeScript type assertions from JSX files
 * Prevents Babel parsing errors when using .jsx with TS syntax
 */
/**
 * Remove TypeScript type assertions from JSX code
 * Converts: new FormData(e.target as HTMLFormElement)
 * To:       new FormData(e.target)
 *
 * @param content - JSX file content
 * @returns Content with TS type assertions removed
 */
export function removeTypeAssertions(content) {
    return content.replace(/\s+as\s+[A-Za-z<>[\],\s|&]*?(?=[,\);}\]\n])/g, "");
}
/**
 * Remove TypeScript type annotations from variable declarations
 * Converts: const x: string = "value"
 * To:       const x = "value"
 *
 * @param content - JSX file content
 * @returns Content with TS type annotations removed
 */
export function removeTypeAnnotations(content) {
    // Match patterns like : Type in variable declarations
    return content.replace(/:\s+[A-Za-z<>[\],\s|&]*?(?==|\n|;)/g, "");
}
/**
 * Remove all TypeScript syntax from JSX content
 * Safely strips TS-specific code while preserving logic
 *
 * @param content - JSX file content
 * @returns Cleaned JSX content safe for Babel
 */
export function stripTypeScriptSyntax(content) {
    let cleaned = content;
    // 1. Remove type assertions: as Type
    // Matches: as HTMLFormElement, as string, as any, etc.
    cleaned = cleaned.replace(/\s+as\s+(?:HTML[A-Za-z]*Element|[A-Za-z<>[\],\s|&()]+?)(?=[,\);}\]\n\s])/g, "");
    // 2. Remove simple type annotations from variables
    // Matches: : string, : number, : boolean, : any, : void, etc.
    cleaned = cleaned.replace(/:\s*(?:string|number|boolean|any|void|null|undefined)(?=[,\)=\n{])/g, "");
    // 3. Remove generic types in function parameters
    // Matches: <Type>, <Type1, Type2>, etc.
    cleaned = cleaned.replace(/<(?:[A-Za-z0-9, |&\[\]<>])+>/g, (match) => {
        // Only remove if it looks like a type parameter, not comparison
        return match.includes("|") || match.includes("&") || match.match(/[A-Z]/) ? "" : match;
    });
    // 4. Remove complex type annotations
    // Matches: : Record<string, any>, : React.FormEvent<T>, etc.
    cleaned = cleaned.replace(/:\s*(?:Record|Map|Set|Array|React\.[A-Za-z]+|[A-Za-z]+<[^>]+>)(?=[,\)=\n{])/g, "");
    return cleaned;
}
/**
 * Check if content has TypeScript syntax
 * Returns true if TS-specific syntax is detected
 *
 * @param content - JSX file content
 * @returns True if TypeScript syntax found
 */
export function hasTypeScriptSyntax(content) {
    return /\s+as\s+[A-Za-z<>[\],\s|&]*?(?=[,\);}\]\n])/.test(content) ||
        /:\s*(?:string|number|boolean|[A-Za-z<>[\],\s|&]+?)(?=[,\)=])/.test(content);
}
/**
 * Log TypeScript syntax removal for transparency
 *
 * @param filePath - Path to the file being cleaned
 * @param changeCount - Number of changes made
 */
export function logTypeScriptRemoval(filePath, changeCount) {
    if (changeCount > 0) {
        console.log(`\n⚙️ TypeScript syntax auto-fixed:\n  ${filePath}\n  Removed ${changeCount} type assertions/annotations\n`);
    }
}
