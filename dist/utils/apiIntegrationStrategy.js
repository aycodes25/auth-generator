/**
 * ============================================================
 * API Integration Strategy Utility
 * ============================================================
 * Determines the best strategy for integrating backend APIs
 * Creates appropriate service files, hooks, or direct calls
 */
import path from "path";
/**
 * Determine the best API integration strategy based on framework
 */
export function determineIntegrationStrategy(frameworkInfo) {
    switch (frameworkInfo.framework) {
        case "react":
            return "react-hook";
        case "vue":
            return "vue-composable";
        case "angular":
            return "service-file";
        case "svelte":
            return "service-file";
        default:
            return "direct-calls";
    }
}
/**
 * Generate API integration plan based on framework and file analysis
 */
export function generateIntegrationPlan(targetPath, frameworkInfo, fileAnalysis, backendUrl) {
    const strategy = determineIntegrationStrategy(frameworkInfo);
    const plan = {
        strategy,
        filesToCreate: [],
        filesToModify: [],
        injectionPoints: [],
    };
    switch (strategy) {
        case "react-hook":
            generateReactHookPlan(plan, targetPath, frameworkInfo, fileAnalysis, backendUrl);
            break;
        case "vue-composable":
            generateVueComposablePlan(plan, targetPath, frameworkInfo, fileAnalysis, backendUrl);
            break;
        case "service-file":
            generateServiceFilePlan(plan, targetPath, frameworkInfo, fileAnalysis, backendUrl);
            break;
        case "direct-calls":
            generateDirectCallPlan(plan, targetPath, frameworkInfo, fileAnalysis, backendUrl);
            break;
    }
    return plan;
}
/**
 * Generate integration plan for React (uses custom hooks)
 */
function generateReactHookPlan(plan, targetPath, frameworkInfo, fileAnalysis, backendUrl) {
    const hooksDir = path.join(frameworkInfo.srcDir, "hooks");
    const useAuthHookPath = `${hooksDir}/useAuth${frameworkInfo.supportsTypeScript ? ".ts" : ".js"}`;
    // Create useAuth hook
    const useAuthContent = generateReactAuthHook(backendUrl, frameworkInfo.supportsTypeScript);
    plan.filesToCreate.push({
        path: useAuthHookPath,
        type: "hook",
        content: useAuthContent,
    });
    // Generate injection points for components with forms
    for (const component of [...fileAnalysis.loginComponents, ...fileAnalysis.signupComponents]) {
        if (component.suggestedInjection === "handler") {
            plan.injectionPoints.push({
                filePath: component.filePath,
                injectionType: "hook-call",
                code: generateReactHookUsage(component),
            });
        }
    }
}
/**
 * Generate integration plan for Vue (uses composables)
 */
function generateVueComposablePlan(plan, targetPath, frameworkInfo, fileAnalysis, backendUrl) {
    const composablesDir = path.join(frameworkInfo.srcDir, "composables");
    const useAuthPath = `${composablesDir}/useAuth${frameworkInfo.supportsTypeScript ? ".ts" : ".js"}`;
    // Create useAuth composable
    const useAuthContent = generateVueAuthComposable(backendUrl, frameworkInfo.supportsTypeScript);
    plan.filesToCreate.push({
        path: useAuthPath,
        type: "composable",
        content: useAuthContent,
    });
    // Generate injection points
    for (const component of [...fileAnalysis.loginComponents, ...fileAnalysis.signupComponents]) {
        if (component.suggestedInjection === "handler") {
            plan.injectionPoints.push({
                filePath: component.filePath,
                injectionType: "hook-call",
                code: generateVueComposableUsage(component),
            });
        }
    }
}
/**
 * Generate integration plan for services (Angular, Svelte, etc.)
 */
function generateServiceFilePlan(plan, targetPath, frameworkInfo, fileAnalysis, backendUrl) {
    const servicesDir = path.join(frameworkInfo.srcDir, "services");
    const authServicePath = `${servicesDir}/auth${frameworkInfo.mainExtension}`;
    // Create auth service
    const authServiceContent = generateAuthService(backendUrl, frameworkInfo.framework, frameworkInfo.supportsTypeScript);
    plan.filesToCreate.push({
        path: authServicePath,
        type: "service",
        content: authServiceContent,
    });
    // Generate injection points
    for (const component of [...fileAnalysis.loginComponents, ...fileAnalysis.signupComponents]) {
        if (component.suggestedInjection === "handler") {
            plan.injectionPoints.push({
                filePath: component.filePath,
                injectionType: "handler",
                code: generateServiceInjection(component, authServicePath, frameworkInfo),
            });
        }
    }
}
/**
 * Generate integration plan for direct API calls (plain JS)
 */
function generateDirectCallPlan(plan, targetPath, frameworkInfo, fileAnalysis, backendUrl) {
    const apiUtilPath = path.join(frameworkInfo.srcDir, `api${frameworkInfo.mainExtension}`);
    // Create API utility file
    const apiUtilContent = generateApiUtil(backendUrl, frameworkInfo.supportsTypeScript);
    plan.filesToCreate.push({
        path: apiUtilPath,
        type: "utility",
        content: apiUtilContent,
    });
}
/**
 * Generate React useAuth hook
 */
function generateReactAuthHook(backendUrl, supportsTypeScript) {
    const typeScript = supportsTypeScript;
    return `/**
 * Auto-generated by Auth-Gen
 * React hook for authentication
 */

import { useState, useCallback } from 'react'${typeScript ? ";\ntype AuthResponse = { token?: string; user?: any; error?: string };" : ";"}

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState${typeScript ? "<string | null>" : ""}(null);

  const login = useCallback(async (email${typeScript ? ": string" : ""}, password${typeScript ? ": string" : ""}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('${backendUrl}/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');
      if (data.token) localStorage.setItem('token', data.token);
      return data;
    } catch (err${typeScript ? ": any" : ""}) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (userData${typeScript ? ": any" : ""}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('${backendUrl}/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Signup failed');
      if (data.token) localStorage.setItem('token', data.token);
      return data;
    } catch (err${typeScript ? ": any" : ""}) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { login, signup, loading, error };
}`;
}
/**
 * Generate Vue useAuth composable
 */
function generateVueAuthComposable(backendUrl, supportsTypeScript) {
    return `/**
 * Auto-generated by Auth-Gen
 * Vue 3 composable for authentication
 */

import { ref } from 'vue'${supportsTypeScript ? ";\ntype AuthResponse = { token?: string; user?: any; error?: string };" : ";"}

export function useAuth() {
  const loading = ref(false);
  const error = ref${supportsTypeScript ? "<string | null>" : ""}(null);

  const login = async (email${supportsTypeScript ? ": string" : ""}, password${supportsTypeScript ? ": string" : ""}) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await fetch('${backendUrl}/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');
      if (data.token) localStorage.setItem('token', data.token);
      return data;
    } catch (err${supportsTypeScript ? ": any" : ""}) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const signup = async (userData${supportsTypeScript ? ": any" : ""}) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await fetch('${backendUrl}/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Signup failed');
      if (data.token) localStorage.setItem('token', data.token);
      return data;
    } catch (err${supportsTypeScript ? ": any" : ""}) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return { login, signup, loading, error };
}`;
}
/**
 * Generate authentication service file
 */
function generateAuthService(backendUrl, framework, supportsTypeScript) {
    const decorator = framework === "angular" ? "@Injectable({ providedIn: 'root' })\n" : "";
    const classKeyword = framework === "angular" ? "export class AuthService" : `export const authService = ${supportsTypeScript ? "Object" : "{"}`;
    return `/**
 * Auto-generated by Auth-Gen
 * Authentication service
 */

${decorator}${classKeyword} {
  private baseUrl = '${backendUrl}';

  async login(email${supportsTypeScript ? ": string" : ""}, password${supportsTypeScript ? ": string" : ""}) {
    const response = await fetch(\`\${this.baseUrl}/api/login\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Login failed');
    if (data.token) localStorage.setItem('token', data.token);
    return data;
  }

  async signup(userData${supportsTypeScript ? ": any" : ""}) {
    const response = await fetch(\`\${this.baseUrl}/api/signup\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Signup failed');
    if (data.token) localStorage.setItem('token', data.token);
    return data;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('token');
  }
}`;
}
/**
 * Generate API utility file for plain JavaScript
 */
function generateApiUtil(backendUrl, supportsTypeScript) {
    return `/**
 * Auto-generated by Auth-Gen
 * API utility functions
 */

const baseUrl = '${backendUrl}';

export async function login(email${supportsTypeScript ? ": string" : ""}, password${supportsTypeScript ? ": string" : ""}) {
  const response = await fetch(\`\${baseUrl}/api/login\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Login failed');
  if (data.token) localStorage.setItem('token', data.token);
  return data;
}

export async function signup(userData${supportsTypeScript ? ": any" : ""}) {
  const response = await fetch(\`\${baseUrl}/api/signup\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Signup failed');
  if (data.token) localStorage.setItem('token', data.token);
  return data;
}`;
}
/**
 * Generate React hook usage code
 */
function generateReactHookUsage(component) {
    return `const { login, signup, loading, error } = useAuth();`;
}
/**
 * Generate Vue composable usage code
 */
function generateVueComposableUsage(component) {
    return `const { login, signup, loading, error } = useAuth();`;
}
/**
 * Generate service injection code
 */
function generateServiceInjection(component, servicePath, frameworkInfo) {
    if (frameworkInfo.framework === "angular") {
        return `constructor(private authService: AuthService) {}`;
    }
    return `import { authService } from '${servicePath}';`;
}
