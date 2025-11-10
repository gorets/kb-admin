# Knowledge Base Admin

Простой интерфейс на React + MUI + @tanstack/react-query для управления Knowledge Base, DataSources и Documents.

## Технологии

- **React 18** - UI библиотека
- **TypeScript** - типизация
- **Vite** - сборщик и dev сервер
- **Material-UI (MUI)** - компоненты UI
- **@tanstack/react-query** - управление состоянием и кэширование данных
- **React Router** - роутинг
- **@wildix/wim-knowledge-base-client** - клиент для работы с API

## Setup Credentials

```
localStorage.setItem('kb_admin_token', 'wsk-v1-ddxxOMSUacpNQy43yUjzXQKiLYwVlNi5UnY******')
```

## Структура проекта

```
kb-admin/
├── src/
│   ├── api/
│   │   ├── client.ts                # Конфигурация API с токенами
│   │   └── kbClient.ts              # KnowledgeBaseClient из пакета
│   ├── components/
│   │   ├── Layout.tsx               # Общий layout с навигацией
│   │   ├── KnowledgeBaseDialog.tsx
│   │   ├── DataSourceDialog.tsx
│   │   ├── DocumentDialog.tsx
│   │   └── useForm.ts               # Хук для работы с формами
│   ├── hooks/
│   │   ├── useKnowledgeBases.ts     # React Query hooks для KB
│   │   ├── useDataSources.ts        # React Query hooks для DataSources
│   │   └── useDocuments.ts          # React Query hooks для Documents
│   ├── pages/
│   │   ├── KnowledgeBasesPage.tsx
│   │   ├── DataSourcesPage.tsx
│   │   └── DocumentsPage.tsx
│   ├── types/
│   │   └── index.ts                 # Re-export типов из клиента
│   ├── App.tsx                      # Главный компонент с роутингом
│   └── main.tsx                     # Точка входа
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Установка

```bash
npm install
```

## Конфигурация

### API URL

Создайте файл `.env` в корне проекта:

```env
VITE_API_BASE_URL=http://your-api-url.com/api
```

### Токен аутентификации

Приложение использует токен из localStorage для аутентификации. Токен должен быть сохранен в localStorage с ключом `kb_admin_token`.

Вы можете установить токен в консоли браузера:

```javascript
localStorage.setItem('kb_admin_token', 'your-token-here')
```

## Запуск

### Development режим

```bash
npm run dev
```

Приложение будет доступно по адресу: http://localhost:5173

### Production сборка

```bash
npm run build
npm run preview
```

## Функционал

### Knowledge Bases

- Просмотр списка Knowledge Bases
- Создание нового Knowledge Base
- Редактирование существующего
- Удаление Knowledge Base

### Data Sources

- Просмотр списка Data Sources
- Создание нового Data Source
- Привязка к Knowledge Base
- Выбор типа источника данных (file, url, database, api)
- Редактирование и удаление

### Documents

- Просмотр списка документов
- Создание нового документа
- Привязка к Knowledge Base и Data Source
- Редактирование содержимого
- Удаление документов

## Интеграция с @wildix/wim-knowledge-base-client

Приложение полностью интегрировано с официальным клиентом! ✅

### Архитектура

```
UI Components (Pages)
         ↓
React Query Hooks
         ↓
@wildix/wim-knowledge-base-client
         ↓
Backend API
```

**Типы** - импортируются напрямую из пакета:
```typescript
// src/types/index.ts
export type {
  KnowledgeBase,
  DataSource,
  Document,
  CreateKnowledgeBaseRequest,
  UpdateKnowledgeBaseRequest,
  // ...
} from '@wildix/wim-knowledge-base-client'
```

**API Client** (`src/api/kbClient.ts`) - инициализация клиента:
```typescript
import { KnowledgeBaseClient } from '@wildix/wim-knowledge-base-client'
import { getApiConfig } from './client'

export const kbClient = new KnowledgeBaseClient({
  baseUrl: config.baseURL,
  headers: config.headers, // включает Bearer token
})
```

**React Query Hooks** - используют клиент напрямую:
```typescript
// src/hooks/useKnowledgeBases.ts
import { kbClient } from '../api/kbClient'

export const useKnowledgeBases = () => {
  return useQuery({
    queryKey: ['knowledgeBases'],
    queryFn: () => kbClient.knowledgeBases.getAll(),
  })
}
```

### Методы клиента

**Knowledge Bases:**
- `kbClient.knowledgeBases.getAll()` - получить все KB
- `kbClient.knowledgeBases.getById(id)` - получить KB по ID
- `kbClient.knowledgeBases.create(data)` - создать KB
- `kbClient.knowledgeBases.update(id, data)` - обновить KB
- `kbClient.knowledgeBases.delete(id)` - удалить KB

**Data Sources:**
- `kbClient.dataSources.getAll()` - получить все DS
- `kbClient.dataSources.getById(id)` - получить DS по ID
- `kbClient.dataSources.getByKnowledgeBase(kbId)` - получить DS для KB
- `kbClient.dataSources.create(data)` - создать DS
- `kbClient.dataSources.update(id, data)` - обновить DS
- `kbClient.dataSources.delete(id)` - удалить DS

**Documents:**
- `kbClient.documents.getAll()` - получить все документы
- `kbClient.documents.getById(id)` - получить документ по ID
- `kbClient.documents.getByDataSource(dsId)` - получить документы для DS
- `kbClient.documents.getByKnowledgeBase(kbId)` - получить документы для KB
- `kbClient.documents.create(data)` - создать документ
- `kbClient.documents.update(id, data)` - обновить документ
- `kbClient.documents.delete(id)` - удалить документ

## API клиент

Все запросы к API автоматически включают:
- Токен аутентификации из localStorage
- Content-Type: application/json
- Обработку ошибок

Функции для работы с токеном:

```typescript
import { setAuthToken, getAuthToken, removeAuthToken } from './api/client'

// Установить токен
setAuthToken('your-token')

// Получить токен
const token = getAuthToken()

// Удалить токен
removeAuthToken()
```

## Возможности для улучшения

- [ ] Добавить страницу логина с формой авторизации
- [ ] Добавить фильтрацию и поиск по сущностям
- [ ] Добавить пагинацию для больших списков
- [ ] Расширенная валидация форм
- [ ] Добавить unit и integration тесты
- [ ] Добавить обработку состояний загрузки с skeleton
- [ ] Добавить toast уведомления об успехе/ошибке
- [ ] Добавить подтверждающие диалоги для удаления
- [ ] Экспорт/импорт данных
- [ ] Dark mode toggle
