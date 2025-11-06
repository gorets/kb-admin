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
│   │   └── client.ts           # API клиент с поддержкой токенов
│   ├── components/
│   │   ├── Layout.tsx           # Общий layout с навигацией
│   │   ├── KnowledgeBaseDialog.tsx
│   │   ├── DataSourceDialog.tsx
│   │   ├── DocumentDialog.tsx
│   │   └── useForm.ts          # Хук для работы с формами
│   ├── hooks/
│   │   ├── useKnowledgeBases.ts # React Query hooks для KB
│   │   ├── useDataSources.ts    # React Query hooks для DataSources
│   │   └── useDocuments.ts      # React Query hooks для Documents
│   ├── pages/
│   │   ├── KnowledgeBasesPage.tsx
│   │   ├── DataSourcesPage.tsx
│   │   └── DocumentsPage.tsx
│   ├── types/
│   │   └── index.ts            # TypeScript типы
│   ├── App.tsx                 # Главный компонент с роутингом
│   └── main.tsx                # Точка входа
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

В файлах `src/hooks/use*.ts` находятся заглушки API вызовов. Необходимо заменить их на реальные вызовы клиента:

```typescript
import { KnowledgeBaseClient } from '@wildix/wim-knowledge-base-client'
import { getApiConfig } from '../api/client'

const config = getApiConfig()
const client = new KnowledgeBaseClient(config)

// Пример использования
const getAll = async (): Promise<KnowledgeBase[]> => {
  return client.getKnowledgeBases()
}
```

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

## TODO

- [ ] Интегрировать реальный API клиент @wildix/wim-knowledge-base-client
- [ ] Добавить страницу логина
- [ ] Добавить фильтрацию и поиск
- [ ] Добавить пагинацию
- [ ] Добавить валидацию форм
- [ ] Добавить тесты
