# API Integration Guide

Руководство по интеграции с @wildix/wim-knowledge-base-client

## Текущая архитектура

### Слои приложения

```
UI Components (Pages)
         ↓
React Query Hooks
         ↓
Service Layer (API Services)
         ↓
HTTP Client (kbClient)
         ↓
Backend API
```

## API Client

### Базовый клиент (src/api/kbClient.ts)

Базовый HTTP клиент с автоматической авторизацией:

```typescript
import { kbClient } from './api/kbClient'

// Пример GET запроса
const data = await kbClient.request<KnowledgeBase[]>('/knowledge-bases', {
  method: 'GET',
})

// Пример POST запроса
const newKB = await kbClient.request<KnowledgeBase>('/knowledge-bases', {
  method: 'POST',
  body: JSON.stringify({ name: 'My KB', description: 'Description' }),
})
```

### Конфигурация (src/api/client.ts)

Управление токеном и настройками API:

```typescript
import { setAuthToken, getAuthToken, removeAuthToken, getApiConfig } from './api/client'

// Установка токена при логине
setAuthToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')

// Получение токена
const token = getAuthToken()

// Проверка наличия токена
if (token) {
  // Пользователь авторизован
}

// Выход из системы
removeAuthToken()

// Получение конфига с токеном
const config = getApiConfig()
console.log(config.headers) // { 'Content-Type': 'application/json', 'Authorization': 'Bearer ...' }
```

## Service Layer

### Knowledge Bases Service

```typescript
import { knowledgeBasesService } from './api/knowledgeBasesService'

// Получить все Knowledge Bases
const kbs = await knowledgeBasesService.getAll()

// Получить один KB по ID
const kb = await knowledgeBasesService.getById('kb-id')

// Создать новый KB
const newKB = await knowledgeBasesService.create({
  name: 'My Knowledge Base',
  description: 'Optional description',
})

// Обновить KB
const updatedKB = await knowledgeBasesService.update('kb-id', {
  name: 'Updated name',
})

// Удалить KB
await knowledgeBasesService.delete('kb-id')
```

### Data Sources Service

```typescript
import { dataSourcesService } from './api/dataSourcesService'

// Получить все Data Sources
const allDS = await dataSourcesService.getAll()

// Получить Data Sources для конкретного KB
const kbDS = await dataSourcesService.getAll('kb-id')

// Альтернативный способ
const kbDS2 = await dataSourcesService.getByKnowledgeBase('kb-id')

// Создать новый Data Source
const newDS = await dataSourcesService.create({
  knowledgeBaseId: 'kb-id',
  name: 'My Data Source',
  type: 'file',
  config: { path: '/path/to/files' },
})

// Обновить Data Source
const updatedDS = await dataSourcesService.update('ds-id', {
  name: 'Updated name',
  config: { path: '/new/path' },
})
```

### Documents Service

```typescript
import { documentsService } from './api/documentsService'

// Получить все документы
const allDocs = await documentsService.getAll()

// Фильтрация по Data Source
const dsDocs = await documentsService.getAll('ds-id')

// Фильтрация по Knowledge Base и Data Source
const filteredDocs = await documentsService.getAll('ds-id', 'kb-id')

// Альтернативные методы
const byDS = await documentsService.getByDataSource('ds-id')
const byKB = await documentsService.getByKnowledgeBase('kb-id')

// Создать документ
const newDoc = await documentsService.create({
  knowledgeBaseId: 'kb-id',
  dataSourceId: 'ds-id',
  title: 'Document Title',
  content: 'Document content...',
  metadata: { tags: ['tag1', 'tag2'] },
})
```

## React Query Hooks

### useKnowledgeBases

```typescript
import { useKnowledgeBases, useCreateKnowledgeBase } from './hooks/useKnowledgeBases'

function MyComponent() {
  // Получение списка
  const { data: kbs, isLoading, error } = useKnowledgeBases()

  // Создание
  const createMutation = useCreateKnowledgeBase()

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        name: 'New KB',
        description: 'Description',
      })
      // Данные автоматически обновятся благодаря React Query
    } catch (error) {
      console.error('Failed to create KB:', error)
    }
  }

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {kbs?.map((kb) => (
        <div key={kb.id}>{kb.name}</div>
      ))}
    </div>
  )
}
```

### useDataSources

```typescript
import { useDataSources, useUpdateDataSource } from './hooks/useDataSources'

function DataSourcesList({ knowledgeBaseId }) {
  // Автоматическая фильтрация по KB
  const { data: dataSources } = useDataSources(knowledgeBaseId)

  const updateMutation = useUpdateDataSource()

  const handleUpdate = async (id: string) => {
    await updateMutation.mutateAsync({
      id,
      data: { name: 'Updated name' },
    })
  }

  return <div>{/* ... */}</div>
}
```

### useDocuments

```typescript
import { useDocuments, useDeleteDocument } from './hooks/useDocuments'

function DocumentsList() {
  const { data: documents } = useDocuments()
  const deleteMutation = useDeleteDocument()

  const handleDelete = async (id: string) => {
    if (confirm('Delete document?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  return <div>{/* ... */}</div>
}
```

## Обработка ошибок

### В компонентах

```typescript
function MyComponent() {
  const { data, error, isLoading } = useKnowledgeBases()

  if (isLoading) {
    return <CircularProgress />
  }

  if (error) {
    return <Alert severity="error">Error: {error.message}</Alert>
  }

  return <div>{/* Render data */}</div>
}
```

### В мутациях

```typescript
const createMutation = useCreateKnowledgeBase()

const handleCreate = async (data) => {
  try {
    await createMutation.mutateAsync(data)
    // Успех
    showNotification('KB created successfully')
  } catch (error) {
    // Ошибка
    showNotification('Failed to create KB: ' + error.message, 'error')
  }
}
```

## Настройка API URL

### Через .env файл

```env
VITE_API_BASE_URL=https://api.example.com/v1
```

### Программно

```typescript
// src/api/client.ts
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3000/api'
```

## Переход на @wildix/wim-knowledge-base-client

Если пакет предоставляет готовый SDK, обновите `src/api/kbClient.ts`:

```typescript
import { KnowledgeBaseClient } from '@wildix/wim-knowledge-base-client'
import { getApiConfig } from './client'

export function createKBClient() {
  const config = getApiConfig()

  // Инициализация клиента из пакета
  return new KnowledgeBaseClient({
    baseUrl: config.baseURL,
    headers: config.headers,
  })
}

export const kbClient = createKBClient()
```

Затем обновите сервисы:

```typescript
// src/api/knowledgeBasesService.ts
import { kbClient } from './kbClient'

export const knowledgeBasesService = {
  async getAll() {
    // Используйте методы клиента вместо request
    return kbClient.knowledgeBases.list()
  },

  async create(data) {
    return kbClient.knowledgeBases.create(data)
  },

  // и т.д.
}
```

## Тестирование

### Mock для тестов

```typescript
import { rest } from 'msw'
import { setupServer } from 'msw/node'

const server = setupServer(
  rest.get('/api/knowledge-bases', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: '1', name: 'Test KB', description: 'Test' },
      ])
    )
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

## Best Practices

1. **Всегда используйте React Query hooks** в компонентах, а не прямые вызовы сервисов
2. **Обрабатывайте ошибки** на уровне компонентов
3. **Используйте loading states** для лучшего UX
4. **Инвалидируйте кэш** после мутаций (уже настроено)
5. **Храните токен в localStorage** только для demo/dev окружения
6. **Для production** используйте httpOnly cookies
