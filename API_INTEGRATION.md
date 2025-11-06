# API Integration Guide

Руководство по использованию @wildix/wim-knowledge-base-client в приложении

## Архитектура

Приложение использует прямую интеграцию с официальным клиентом:

```
UI Components (Pages)
         ↓
React Query Hooks
         ↓
@wildix/wim-knowledge-base-client
         ↓
Backend API
```

## Конфигурация

### API Client (src/api/client.ts)

Управление токеном и настройками:

```typescript
import { setAuthToken, getAuthToken, removeAuthToken, getApiConfig } from './api/client'

// Установка токена при логине
setAuthToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')

// Получение токена
const token = getAuthToken()

// Проверка авторизации
if (token) {
  // Пользователь авторизован
}

// Выход из системы
removeAuthToken()

// Получение конфига с токеном
const config = getApiConfig()
console.log(config.headers) // { 'Content-Type': 'application/json', 'Authorization': 'Bearer ...' }
```

### Инициализация клиента (src/api/kbClient.ts)

```typescript
import { KnowledgeBaseClient } from '@wildix/wim-knowledge-base-client'
import { getApiConfig } from './client'

function createKBClient() {
  const config = getApiConfig()

  return new KnowledgeBaseClient({
    baseUrl: config.baseURL,
    headers: config.headers, // автоматически включает токен
  })
}

export const kbClient = createKBClient()
```

## Типы

Все типы импортируются напрямую из пакета:

```typescript
// src/types/index.ts
export type {
  KnowledgeBase,
  DataSource,
  Document,
  CreateKnowledgeBaseRequest,
  UpdateKnowledgeBaseRequest,
  CreateDataSourceRequest,
  UpdateDataSourceRequest,
  CreateDocumentRequest,
  UpdateDocumentRequest,
} from '@wildix/wim-knowledge-base-client'
```

Использование в компонентах:

```typescript
import type { KnowledgeBase, CreateKnowledgeBaseRequest } from '../types'

const kb: KnowledgeBase = {
  id: '1',
  name: 'My KB',
  description: 'Description',
}
```

## Использование клиента напрямую

### Knowledge Bases

```typescript
import { kbClient } from './api/kbClient'

// Получить все Knowledge Bases
const kbs = await kbClient.knowledgeBases.getAll()

// Получить один KB по ID
const kb = await kbClient.knowledgeBases.getById('kb-id')

// Создать новый KB
const newKB = await kbClient.knowledgeBases.create({
  name: 'My Knowledge Base',
  description: 'Optional description',
})

// Обновить KB
const updatedKB = await kbClient.knowledgeBases.update('kb-id', {
  name: 'Updated name',
})

// Удалить KB
await kbClient.knowledgeBases.delete('kb-id')
```

### Data Sources

```typescript
import { kbClient } from './api/kbClient'

// Получить все Data Sources
const allDS = await kbClient.dataSources.getAll()

// Получить Data Sources для конкретного KB
const kbDS = await kbClient.dataSources.getByKnowledgeBase('kb-id')

// Получить один DS по ID
const ds = await kbClient.dataSources.getById('ds-id')

// Создать новый Data Source
const newDS = await kbClient.dataSources.create({
  knowledgeBaseId: 'kb-id',
  name: 'My Data Source',
  type: 'file',
  config: { path: '/path/to/files' },
})

// Обновить Data Source
const updatedDS = await kbClient.dataSources.update('ds-id', {
  name: 'Updated name',
  config: { path: '/new/path' },
})

// Удалить Data Source
await kbClient.dataSources.delete('ds-id')
```

### Documents

```typescript
import { kbClient } from './api/kbClient'

// Получить все документы
const allDocs = await kbClient.documents.getAll()

// Получить документы для Data Source
const dsDocs = await kbClient.documents.getByDataSource('ds-id')

// Получить документы для Knowledge Base
const kbDocs = await kbClient.documents.getByKnowledgeBase('kb-id')

// Получить один документ по ID
const doc = await kbClient.documents.getById('doc-id')

// Создать документ
const newDoc = await kbClient.documents.create({
  knowledgeBaseId: 'kb-id',
  dataSourceId: 'ds-id',
  title: 'Document Title',
  content: 'Document content...',
  metadata: { tags: ['tag1', 'tag2'] },
})

// Обновить документ
const updatedDoc = await kbClient.documents.update('doc-id', {
  title: 'New Title',
  content: 'New content',
})

// Удалить документ
await kbClient.documents.delete('doc-id')
```

## React Query Hooks

Хуки используют клиент напрямую для интеграции с React Query.

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

## Реализация хуков

### Knowledge Bases Hook

```typescript
// src/hooks/useKnowledgeBases.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { kbClient } from '../api/kbClient'
import type {
  CreateKnowledgeBaseRequest,
  UpdateKnowledgeBaseRequest,
} from '../types'

export const useKnowledgeBases = () => {
  return useQuery({
    queryKey: ['knowledgeBases'],
    queryFn: () => kbClient.knowledgeBases.getAll(),
  })
}

export const useCreateKnowledgeBase = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateKnowledgeBaseRequest) =>
      kbClient.knowledgeBases.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases'] })
    },
  })
}
```

### Data Sources Hook

```typescript
// src/hooks/useDataSources.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { kbClient } from '../api/kbClient'
import type {
  CreateDataSourceRequest,
  UpdateDataSourceRequest,
} from '../types'

export const useDataSources = (knowledgeBaseId?: string) => {
  return useQuery({
    queryKey: ['dataSources', knowledgeBaseId],
    queryFn: () => knowledgeBaseId
      ? kbClient.dataSources.getByKnowledgeBase(knowledgeBaseId)
      : kbClient.dataSources.getAll(),
  })
}

export const useCreateDataSource = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateDataSourceRequest) =>
      kbClient.dataSources.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] })
    },
  })
}
```

### Documents Hook

```typescript
// src/hooks/useDocuments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { kbClient } from '../api/kbClient'
import type {
  CreateDocumentRequest,
  UpdateDocumentRequest,
} from '../types'

export const useDocuments = (dataSourceId?: string, knowledgeBaseId?: string) => {
  return useQuery({
    queryKey: ['documents', dataSourceId, knowledgeBaseId],
    queryFn: () => {
      if (dataSourceId) {
        return kbClient.documents.getByDataSource(dataSourceId)
      } else if (knowledgeBaseId) {
        return kbClient.documents.getByKnowledgeBase(knowledgeBaseId)
      } else {
        return kbClient.documents.getAll()
      }
    },
  })
}

export const useCreateDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateDocumentRequest) =>
      kbClient.documents.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
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

## Тестирование

### Mock клиента для тестов

```typescript
import { vi } from 'vitest'

// Mock kbClient
vi.mock('./api/kbClient', () => ({
  kbClient: {
    knowledgeBases: {
      getAll: vi.fn(() => Promise.resolve([
        { id: '1', name: 'Test KB', description: 'Test' },
      ])),
      create: vi.fn((data) => Promise.resolve({ id: '1', ...data })),
      update: vi.fn((id, data) => Promise.resolve({ id, ...data })),
      delete: vi.fn(() => Promise.resolve()),
    },
  },
}))
```

### MSW для тестов API

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

1. **Используйте React Query hooks** в компонентах вместо прямых вызовов клиента
2. **Импортируйте типы** из пакета, не создавайте свои
3. **Обрабатывайте ошибки** на уровне компонентов
4. **Используйте loading states** для лучшего UX
5. **Кэш автоматически инвалидируется** после мутаций
6. **Храните токен в localStorage** только для dev окружения
7. **Для production** используйте httpOnly cookies

## Преимущества текущей архитектуры

✅ **Нет промежуточного слоя** - прямое использование клиента
✅ **Типы из одного источника** - импорт из пакета
✅ **Меньше кода** - нет дублирования сервисов
✅ **Проще поддержка** - обновления пакета автоматически работают
✅ **Type-safe** - полная типизация из коробки
