# Newcore Widget React Library

This is a React library for building widgets that communicate with the Newcore platform through event-driven architecture.

## Development Commands

### Build & Development
- `npm run dev` - Start development build with watch mode using Rollup
- `npm run build` - Build production bundle using Rollup
- `npm run lint` - Run ESLint on all files
- `npm run preview` - Preview built files using Vite

### Package Management
- Uses `pnpm` as package manager (see pnpm-lock.yaml)
- Node version specified in `.nvmrc`

## Architecture Overview

### Core Components

**Client Architecture**: The library provides two main client types:
- `Client` (`src/client.ts`) - Main widget client for standard widget operations
- `BackgroundClient` (`src/background-client.ts`) - Background client with interceptor capabilities for background operations

**Event System**: Built on `src/web-event-bus` for cross-frame communication:
- Widget events use `widget-event:` prefix
- Background events use `background-event:` prefix
- Supports async operations with Promise-based responses

**React Integration**:
- `useClient()` hook - Creates and manages Client instance lifecycle
- `useBackgroundClient()` hook - Creates and manages BackgroundClient instance lifecycle
- Both hooks handle cleanup automatically

### Key Features

**Data Operations**:
- `get(path)` - Retrieve data from host application
- `set(path, value)` - Update data in host application
- `invoke(path, ...args)` - Call methods in host application
- `trigger(eventName, data)` - Trigger custom events

**Event Management**:
- `on(eventName, callback)` - Subscribe to events
- `off(eventName, callback?)` - Unsubscribe from events
- `has(eventName, callback?)` - Check event subscription status

**Background Client Specific**:
- `addInterceptor(name, interceptor)` - Add request interceptors
- `removeInterceptor(name)` - Remove interceptors

### Build Configuration

**Rollup Setup**:
- Production: `rollup.config.js` - ESM output, external React/ReactDOM
- Development: `rollup.config.dev.js` - Includes sourcemaps, babel transforms
- TypeScript compilation with declaration files
- PostCSS for styles (Sass/Less support)
- Image and URL asset handling

**TypeScript Configuration**:
- Target: ESNext with React JSX
- Generates declaration files in `dist/`
- Strict mode enabled

## File Structure

```
src/
├── client.ts              # Main widget client implementation
├── background-client.ts   # Background client with interceptors
├── hooks.ts              # React hooks for client management
├── index.ts              # Main exports
├── common/
│   └── index.ts          # XHYClient singleton factory
└── __test__/             # Test directory (currently empty)
```

## Important Notes

**Missing Type File**: The codebase references `src/type.ts` in imports but this file was deleted. Type definitions exist in `dist/type.d.ts` but the source import in `src/common/index.ts:2` is broken.

**Singleton Pattern**: `XHYClient` in `src/common/index.ts` implements a singleton factory with initialization lifecycle management.

**Event Bus Communication**: All client-host communication goes through WebEventBus with specific event naming conventions and async response patterns.

**External Dependencies**: React and ReactDOM are peer dependencies and externalized in the build.
