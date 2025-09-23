# @newcore/widget-react

A React library for building widgets that communicate with the Newcore platform through an event-driven architecture. This library provides seamless integration between React components and the Newcore host application using WebEventBus for cross-frame communication.

## Features

- 🚀 Event-driven widget communication with host applications
- 📱 Two client types: standard widgets and background processing
- 🔄 Async data operations with Promise-based API
- 🌍 Cross-frame communication using WebEventBus
- 🛡️ Request interceptors for background widgets
- 📦 Full TypeScript support with complete type definitions
- 🎯 React hooks for automatic lifecycle management
- 🔒 Secure event namespacing and message handling
- 📊 Singleton pattern for global client management
- ⚡ Automatic cleanup and resource management

## Installation

```bash
npm install @newcore/widget-react
# or
yarn add @newcore/widget-react
# or
pnpm add @newcore/widget-react
```

## Peer Dependencies

```bash
npm install react@>=17 react-dom@>=17
```

## Quick Start

### Basic Widget Usage

```tsx
import React from 'react';
import { useClient } from '@newcore/widget-react';

function MyWidget() {
  const client = useClient();

  const handleGetData = async () => {
    const result = await client.get('user.profile');
    console.log('User profile:', result.data);
  };

  const handleSetData = async () => {
    const result = await client.set('user.preferences.theme', 'dark');
    console.log('Theme updated:', result.success);
  };

  return (
    <div>
      <button onClick={handleGetData}>Get User Profile</button>
      <button onClick={handleSetData}>Set Dark Theme</button>
    </div>
  );
}
```

### Background Widget Usage

For widgets that need to intercept and handle background operations:

```tsx
import React from 'react';
import { useBackgroundClient } from '@newcore/widget-react';

function BackgroundWidget() {
  const client = useBackgroundClient();

  React.useEffect(() => {
    // Add interceptor for API requests
    client.addInterceptor('api.request', async (data) => {
      console.log('Intercepting API request:', data);
      // Perform validation or modification
      return { success: true, message: 'Request approved' };
    });

    return () => {
      client.removeInterceptor('api.request');
    };
  }, [client]);

  return <div>Background widget running...</div>;
}
```

### Advanced Usage with XHYClient

For more complex initialization scenarios:

```tsx
import React from 'react';
import { XHYClient } from '@newcore/widget-react';

function AdvancedWidget() {
  const [client, setClient] = React.useState(null);
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    const initializeClient = async () => {
      try {
        const clientInstance = await XHYClient.init();
        setClient(clientInstance);
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize client:', error);
      }
    };

    if (!XHYClient.isInitialized()) {
      initializeClient();
    }

    return () => {
      XHYClient.reset();
    };
  }, []);

  if (!isReady) {
    return <div>Initializing widget...</div>;
  }

  return <div>Advanced widget ready!</div>;
}
```

## API Reference

### Client Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `get` | `path: string` | `Promise<EventResponse>` | Retrieve data from host application |
| `set` | `path: string, value: unknown` | `Promise<EventResponse>` | Update data in host application |
| `invoke` | `path: string, ...args: unknown[]` | `Promise<EventResponse>` | Call methods in host application |
| `on` | `eventName: string, callback: Function` | `void` | Subscribe to events |
| `off` | `eventName: string, callback?: Function` | `void` | Unsubscribe from events |
| `has` | `eventName: string, callback?: Function` | `boolean` | Check if event is subscribed |
| `trigger` | `eventName: string, data: unknown` | `void` | Trigger custom events |
| `currentLanguage` | - | `Promise<string>` | Get current language |
| `request` | `url: string, options?: RequestInit` | `Promise<Response>` | Make HTTP requests with proxy support |

### BackgroundClient Additional Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `addInterceptor` | `name: string, interceptor: Function` | `void` | Add request interceptor |
| `removeInterceptor` | `name: string` | `void` | Remove request interceptor |

### React Hooks

| Hook | Returns | Description |
|------|---------|-------------|
| `useClient()` | `Client` | Creates and manages a Client instance with automatic cleanup |
| `useBackgroundClient()` | `BackgroundClient` | Creates and manages a BackgroundClient instance with automatic cleanup |

### XHYClient Singleton

| Method | Returns | Description |
|--------|---------|-------------|
| `XHYClient.init()` | `Promise<Client>` | Initialize the global client instance |
| `XHYClient.reset()` | `void` | Reset and cleanup the global client |
| `XHYClient.isInitialized()` | `boolean` | Check if client is initialized |
| `XHYClient.isLocationReady()` | `boolean` | Check if location context is ready |

### Types

```typescript
interface EventResponse {
  success: boolean;
  message?: string;
  data?: unknown; // Only for get() and invoke() operations
}

interface IXHYClient {
  _initialized: boolean;
  _locationReady: boolean;
  _resolveQueue: Array<(client: Client) => void>;
  _rejectQueue: Array<(error: Error) => void>;
  _initTimeout: number;
  _timeoutIds: Set<number>;
  _subscriptions: Set<string>;
  _eventBus: SimpleEventBus;
  _messageListener?: (evt: globalThis.MessageEvent) => void;
  init: (timeout?: number) => Promise<Client>;
  reset: () => void;
  isInitialized: () => boolean;
  isLocationReady: () => boolean;
}

interface Context {
  location?: 'NavBar' | 'TopBar' | 'SideBar' | '';
  sidebarPath?: string;
  appId: string;
  instanceId: string;
}

type LocationType = 'NavBar' | 'TopBar' | 'SideBar' | '';
type LanguageType = 'zh-CN' | 'en-US' | 'vi-VN' | 'ja-JP' | '';
```

## Event System

The library uses a sophisticated event system with different namespaces:

- **Widget Events**: Prefixed with `widget-event:` for standard widget communication
- **Background Events**: Prefixed with `background-event:` for background operations
- **System Events**: Used internally for lifecycle management

### Event Flow

1. **Widget → Host**: Events are published to the parent frame using `publishParent()`
2. **Host → Widget**: Events are received through subscriptions to specific event names
3. **Async Operations**: Request-response patterns using unique event names with path/operation identifiers

## Error Handling

All async operations return standardized response objects:

```tsx
interface Response {
  success: boolean;
  message?: string;
  data?: unknown; // Only for get() and invoke() operations
}
```

Handle errors appropriately:

```tsx
const result = await client.get('user.profile');
if (!result.success) {
  console.error('Failed to get profile:', result.message);
  return;
}
// Use result.data safely
```

## TypeScript Support

The library is built with TypeScript and provides full type definitions. Import types as needed:

```tsx
import type { IXHYClient, Context, LocationEvent } from '@newcore/widget-react';
```

## Widget Communication Protocol

### Event Namespaces

The library uses structured event namespaces for secure communication:

- **Widget Events**: Prefixed with `widget-event:` for standard widget operations
- **Background Events**: Prefixed with `background-event:` for background processing
- **System Events**: Internal events for lifecycle management (`web-event-bus:`)

### Supported Operations

| Operation | Event Pattern | Description |
|-----------|---------------|-------------|
| `#get` | `{prefix}#get` → `{prefix}#get-response:{path}` | Data retrieval with response |
| `#set` | `{prefix}#set` → `{prefix}#set-result:{path}` | Data storage with acknowledgment |
| `#invoke` | `{prefix}#invoke` → `{prefix}#invoke-result:{path}` | Method invocation with response |
| `#trigger` | `{prefix}#trigger` | Fire-and-forget event triggering |
| `#onChange` | `{prefix}#onChange` | Event change notifications |
| `#onIntercept` | `background-event:#onIntercept` | Background interceptor events |

## Security Features

- **Event Namespacing**: Prevents event collision with prefixed event names
- **Cross-Frame Communication**: Secure parent-child window message passing
- **Origin Validation**: Built-in support for origin checking (configurable)
- **Resource Cleanup**: Automatic cleanup of event listeners and timeouts

## Development

### Prerequisites

- Node.js 16+
- pnpm (recommended)

### Setup

```bash
# Install dependencies
pnpm install

# Development mode
pnpm dev

# Build library
pnpm build

# Lint code
pnpm lint
```

### Project Structure

```
src/
├── client.ts              # Main widget client implementation
├── background-client.ts   # Background client with interceptors
├── hooks.ts              # React hooks for client management
├── index.ts              # Main library exports
├── common/
│   └── index.ts          # XHYClient singleton factory
└── __test__/             # Test directory
```

## Build Configuration

The library is built using Rollup with the following outputs:

- **ES Modules**: `dist/index.js`
- **TypeScript Declarations**: `dist/index.d.ts`
- **External Dependencies**: React and ReactDOM (peer dependencies)
- **CSS Processing**: PostCSS with Sass/Less support
- **Asset Handling**: Images and URLs with size limits

### Build Features

- TypeScript compilation with strict mode
- Babel transpilation for ES compatibility
- CSS extraction and minification
- Source maps in development mode
- Tree-shaking optimization

## Browser Support

- Modern browsers with ES2020+ support
- React 17+ compatibility
- WebEventBus cross-frame communication support
- PostMessage API support

## Changelog

### v2.0.1-beta11
- 🚀 Event-driven architecture with WebEventBus
- 📱 Dual client types (standard and background)
- 🔄 Promise-based async operations
- 🛡️ Request interceptor support
- 📦 Full TypeScript support
- 🎯 React hooks integration
- 🔒 Secure event namespacing

## License

See the repository for license information.

## Support

For issues and questions, please use the project's issue tracker at the GitHub repository.