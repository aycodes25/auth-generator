# API Integration Strategy Guide

## Overview

Auth-Gen v2.0 uses intelligent strategy selection to integrate backend APIs into frontend projects in a professional, framework-aware manner.

## Integration Strategies

### 1. React Hook Strategy (`react-hook`)

**When Used**: React projects (Vite, CRA, Next.js)

**Generated File**: `src/hooks/useAuth.ts`

**Pattern**:
```typescript
// In component
import { useAuth } from '@/hooks/useAuth';

function LoginPage() {
  const { login, loading, error } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await login(email, password);
      // Success handling
    } catch (err) {
      // Error handling
    }
  };
}
```

**Advantages**:
- ✅ React-native solution
- ✅ Reusable across components
- ✅ Automatic state management (loading, error)
- ✅ TypeScript support
- ✅ Token management built-in

---

### 2. Vue Composable Strategy (`vue-composable`)

**When Used**: Vue 3 projects (Vite, Nuxt)

**Generated File**: `src/composables/useAuth.ts`

**Pattern**:
```vue
<script setup>
import { useAuth } from '@/composables/useAuth';

const { login, loading, error } = useAuth();

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const result = await login(email.value, password.value);
    // Success handling
  } catch (err) {
    // Error handling
  }
};
</script>

<template>
  <form @submit="handleSubmit">
    <!-- Form fields -->
  </form>
</template>
```

**Advantages**:
- ✅ Vue 3 Composition API native
- ✅ Reactive state (`ref`)
- ✅ TypeScript support
- ✅ Clean, modern syntax
- ✅ Token management built-in

---

### 3. Service File Strategy (`service-file`)

**When Used**: Angular, Svelte, or projects preferring service-based architecture

**Generated File**: `src/services/auth.ts`

**Pattern**:
```typescript
// Angular
import { Injectable } from '@angular/core';
import { AuthService } from '@/services/auth';

@Component({
  selector: 'app-login',
  template: `...`
})
export class LoginComponent {
  constructor(private authService: AuthService) {}
  
  async onSubmit() {
    try {
      const result = await this.authService.login(email, password);
      // Success
    } catch (err) {
      // Error
    }
  }
}
```

**Advantages**:
- ✅ Angular/TypeScript friendly
- ✅ Dependency injection support
- ✅ Centralized auth logic
- ✅ Easy to test
- ✅ Reusable across application

---

### 4. Direct Calls Strategy (`direct-calls`)

**When Used**: Plain JavaScript projects without framework

**Generated File**: `src/api.js`

**Pattern**:
```javascript
import { login, signup } from '@/api.js';

async function handleLogin(e) {
  e.preventDefault();
  try {
    const result = await login(email, password);
    localStorage.setItem('token', result.token);
  } catch (err) {
    console.error('Login failed:', err);
  }
}
```

**Advantages**:
- ✅ No framework dependency
- ✅ Simple, direct usage
- ✅ Lightweight
- ✅ Works everywhere

---

## Comparison Matrix

| Aspect | React Hook | Vue Composable | Service | Direct |
|--------|-----------|----------------|---------|--------|
| **State Mgmt** | Built-in | Built-in | Manual | Manual |
| **Reusability** | High | High | High | Medium |
| **Learning Curve** | Low | Low | Medium | Very Low |
| **TypeScript** | Full | Full | Full | Partial |
| **Testing** | Easy | Easy | Very Easy | Easy |
| **Framework Required** | React | Vue 3 | Any | None |

---

## Code Generation Details

### React Hook Implementation

```typescript
import { useState, useCallback } from 'react';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');
      if (data.token) localStorage.setItem('token', data.token);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (userData: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Signup failed');
      if (data.token) localStorage.setItem('token', data.token);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { login, signup, loading, error };
}
```

**Key Features**:
- State: `loading`, `error`
- Methods: `login()`, `signup()`
- Auto token storage to localStorage
- Automatic error handling
- TypeScript types included

### Vue Composable Implementation

```typescript
import { ref } from 'vue';

export function useAuth() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  const login = async (email: string, password: string) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');
      if (data.token) localStorage.setItem('token', data.token);
      return data;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const signup = async (userData: any) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Signup failed');
      if (data.token) localStorage.setItem('token', data.token);
      return data;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return { login, signup, loading, error };
}
```

**Key Features**:
- Reactive state with `ref()`
- Vue 3 Composition API native
- TypeScript support
- Same API as React hook

---

## Token Management

All strategies include automatic token management:

```javascript
// Token is automatically stored after successful login
const result = await login(email, password);
// localStorage.setItem('token', result.token)

// To retrieve token later
const token = localStorage.getItem('token');

// To logout
localStorage.removeItem('token');
```

---

## Error Handling

### With Hook/Composable
```javascript
const { login, error } = useAuth();

try {
  await login(email, password);
} catch (err) {
  // err is already available in 'error' state
  console.error(error.value); // Vue
  console.error(error); // React (from hook)
}
```

### With Service
```javascript
try {
  await authService.login(email, password);
} catch (err) {
  console.error('Login failed:', err.message);
}
```

---

## Usage Examples

### React Example
```jsx
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Navigate to dashboard
    } catch (err) {
      // Error is in 'error' state
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}
```

### Vue Example
```vue
<script setup>
import { ref } from 'vue';
import { useAuth } from '@/composables/useAuth';

const email = ref('');
const password = ref('');
const { login, loading, error } = useAuth();

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await login(email.value, password.value);
    // Navigate to dashboard
  } catch (err) {
    // Error is in error.value
  }
};
</script>

<template>
  <form @submit="handleSubmit">
    <input
      v-model="email"
      type="email"
      required
    />
    <input
      v-model="password"
      type="password"
      required
    />
    <button :disabled="loading">
      {{ loading ? 'Logging in...' : 'Login' }}
    </button>
    <p v-if="error" style="color: red">{{ error }}</p>
  </form>
</template>
```

---

## Best Practices

1. **Always handle errors**: Wrap API calls in try-catch
2. **Show loading state**: Use `loading` flag to disable forms
3. **Store token safely**: Use localStorage (or sessionStorage for sensitive apps)
4. **Validate inputs**: Check email/password before submission
5. **Secure endpoints**: Use HTTPS in production
6. **Add CORS headers**: Backend must allow frontend origin

---

## Customization

You can modify the generated hook/service files:

```typescript
// Add custom error handling
const login = async (email, password) => {
  try {
    // Your custom logic
  } catch (err) {
    // Custom error handling
  }
};

// Add request/response interceptors
const customHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};
```

---

## See Also

- [FRAMEWORK_DETECTION.md](./FRAMEWORK_DETECTION.md) - Framework detection details
- [README.md](../README.md) - Main documentation
