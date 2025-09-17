---
title: "No Fake Fallbacks Rule"
description: "Prevent implementation of fake fallbacks for cloud services"
globs: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"]
alwaysApply: true
---

# No Fake Fallbacks Rule

## Core Principle
Never implement fake fallbacks, mock services, or placeholder implementations when integrating with cloud services or external APIs.

## What NOT to Do
- Do not create mock Google Cloud Storage implementations
- Do not implement fake API responses when cloud services fail
- Do not create placeholder data when real cloud integration should be used
- Do not use setTimeout or fake async operations to simulate cloud services
- Do not create "demo mode" alternatives for production cloud features

## What TO Do Instead
- Implement proper error handling and logging
- Return clear error messages when cloud services are unavailable
- Let the user know when there are configuration issues
- Implement proper retries and exponential backoff for transient failures
- Use environment variables to control which services are enabled

## Examples

### ❌ Bad - Fake Fallback
```typescript
try {
  const result = await cloudService.process(data)
  return result
} catch (error) {
  // BAD: Creating fake data when cloud service fails
  return {
    success: true,
    data: mockData,
    message: "Using demo data"
  }
}
```

### ✅ Good - Proper Error Handling
```typescript
try {
  const result = await cloudService.process(data)
  return result
} catch (error) {
  console.error('Cloud service error:', error)
  throw new Error(`Cloud service unavailable: ${error.message}`)
}
```

## When in Doubt
- Ask the user about cloud configuration issues
- Return proper error states
- Log errors for debugging
- Never hide real problems with fake solutions
