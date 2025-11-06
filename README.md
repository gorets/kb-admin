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

## Структура проекта

```
kb-admin/
├── src/
│   ├── api/
│   │   ├── client.ts                # Конфигурация API с токенами
│   │   ├── kbClient.ts              # Базовый клиент для API запросов
│   │   ├── knowledgeBasesService.ts # Сервис для Knowledge Bases
│   │   ├── dataSourcesService.ts    # Сервис для Data Sources
│   │   └── documentsService.ts      # Сервис для Documents
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
│   │   └── index.ts                 # TypeScript типы
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

Приложение готово к работе с реальным API! Интеграция разделена на слои:

### Архитектура API

1. **API Client** (`src/api/kbClient.ts`) - базовый HTTP клиент с поддержкой:
   - Автоматическое добавление токена из localStorage
   - Обработка ошибок
   - Парсинг JSON ответов

2. **Service Layer** - сервисы для каждой сущности:
   - `src/api/knowledgeBasesService.ts` - CRUD операции для Knowledge Bases
   - `src/api/dataSourcesService.ts` - CRUD операции для Data Sources
   - `src/api/documentsService.ts` - CRUD операции для Documents

3. **React Query Hooks** - хуки используют сервисы:
   - `src/hooks/useKnowledgeBases.ts`
   - `src/hooks/useDataSources.ts`
   - `src/hooks/useDocuments.ts`

### REST API Endpoints

Текущая реализация использует следующие эндпоинты:

**Knowledge Bases:**
- `GET /knowledge-bases` - получить все KB
- `GET /knowledge-bases/:id` - получить KB по ID
- `POST /knowledge-bases` - создать KB
- `PATCH /knowledge-bases/:id` - обновить KB
- `DELETE /knowledge-bases/:id` - удалить KB

**Data Sources:**
- `GET /data-sources?knowledgeBaseId=...` - получить все DS
- `GET /data-sources/:id` - получить DS по ID
- `POST /data-sources` - создать DS
- `PATCH /data-sources/:id` - обновить DS
- `DELETE /data-sources/:id` - удалить DS

**Documents:**
- `GET /documents?dataSourceId=...&knowledgeBaseId=...` - получить все документы
- `GET /documents/:id` - получить документ по ID
- `POST /documents` - создать документ
- `PATCH /documents/:id` - обновить документ
- `DELETE /documents/:id` - удалить документ

### Переход на @wildix/wim-knowledge-base-client

Если в пакете есть готовый SDK клиент, можно заменить текущую реализацию в `src/api/kbClient.ts`:

```typescript
import { KnowledgeBaseClient } from '@wildix/wim-knowledge-base-client'
import { getApiConfig } from './client'

export function createKBClient() {
  const config = getApiConfig()

  return new KnowledgeBaseClient({
    baseUrl: config.baseURL,
    headers: config.headers,
  })
}

export const kbClient = createKBClient()
```

Затем обновите сервисы для использования методов клиента вместо прямых fetch запросов.

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
