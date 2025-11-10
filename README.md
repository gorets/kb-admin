# Knowledge Base Admin

A React-based admin interface for managing Knowledge Bases, Data Sources, and Documents using the Wildix Knowledge Base API.

## Technologies

- **React 18** with TypeScript
- **Vite** - Build tool and dev server
- **Material-UI (MUI)** - UI component library
- **@tanstack/react-query** - Data fetching and caching
- **React Router** - Client-side routing
- **@wildix/wim-knowledge-base-client** - Official API client

## Installation

```bash
npm install
```

## Configuration

### Authentication Token

The application uses a token from localStorage for authentication. Set the token with key `kb_admin_token`:

```javascript
localStorage.setItem('kb_admin_token', 'your-token-here')
```

## Running the Application

### Development Mode

```bash
npm run dev
```

Application will be available at: http://localhost:5173

### Production Build

```bash
npm run build
npm run preview
```

## Features

### Knowledge Bases
- View list of knowledge bases in table format
- Create, edit, and delete knowledge bases
- Pagination support

### Data Sources
- View list of data sources in table format
- Create, edit, delete, clone, and clear data sources
- Type-specific configuration fields (Files, Confluence, GDrive, Proxy)
- Sync operations (full sync, incremental sync, stop sync)
- Real-time sync status monitoring
- View detailed information with associated documents
- Pagination support

### Documents
- View documents within their parent data source
- Create, edit, and delete documents
- Document status tracking
- Pagination support

## Architecture

The application follows a clean architecture pattern:

```
UI Components → React Query Hooks → @wildix/wim-knowledge-base-client → API
```

- **Types** are imported directly from the client package
- **Command Pattern** is used for all API operations (AWS SDK style)
- **Token Provider** pattern handles authentication
- **React Query** manages data fetching, caching, and mutations
