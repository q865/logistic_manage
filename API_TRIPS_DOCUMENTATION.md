# 🚗 API Документация: Управление рейсами

## Обзор

API для управления рейсами (trips) предоставляет полный набор эндпоинтов для создания, чтения, обновления и удаления рейсов в системе "Груз Сервис".

**Базовый URL**: `http://localhost:3000/api/trips`

## 🔐 Аутентификация

> **Внимание**: В текущей версии API публично доступен. В продакшене необходимо добавить аутентификацию.

## 📋 Модель данных

### Trip (Рейс)

```typescript
interface Trip {
  id?: number;                    // Уникальный идентификатор
  driver_id: number;              // ID водителя (обязательно)
  delivery_id: number | null;     // ID доставки (опционально)
  route_info: string;             // Информация о маршруте (обязательно)
  status: TripStatus;             // Статус рейса
  notes: string | null;           // Дополнительные заметки
  created_at?: Date;              // Дата создания
  updated_at?: Date;              // Дата обновления
}
```

### TripStatus (Статусы рейса)

```typescript
enum TripStatus {
  'review'        // На проверке
  'with_driver'   // У водителя
  'rework'        // На доработке
  'lost'          // Утеряны
  'verified'      // Проверены
}
```

## 🚀 Эндпоинты

### 1. Создание рейса

**POST** `/api/trips`

Создает новый рейс в системе.

#### Тело запроса

```json
{
  "driver_id": 1,
  "delivery_id": 123,
  "route_info": "01.09.25_77_00ч_ВИП_19 - Москва-СПб",
  "status": "review",
  "notes": "Срочная доставка"
}
```

#### Обязательные поля

- `driver_id` - ID водителя
- `route_info` - Информация о маршруте

#### Ответ

```json
{
  "success": true,
  "data": {
    "id": 1,
    "driver_id": 1,
    "delivery_id": 123,
    "route_info": "01.09.25_77_00ч_ВИП_19 - Москва-СПб",
    "status": "review",
    "notes": "Срочная доставка",
    "created_at": "2025-09-01T08:30:00.000Z",
    "updated_at": "2025-09-01T08:30:00.000Z"
  },
  "message": "Рейс успешно создан"
}
```

### 2. Получение списка рейсов

**GET** `/api/trips`

Возвращает список всех рейсов с пагинацией и фильтрацией.

#### Параметры запроса

- `page` - Номер страницы (по умолчанию: 1)
- `limit` - Количество элементов на странице (по умолчанию: 20)
- `status` - Фильтр по статусу
- `driver_id` - Фильтр по водителю

#### Примеры

```bash
# Все рейсы
GET /api/trips

# Рейсы на проверке
GET /api/trips?status=review

# Рейсы конкретного водителя
GET /api/trips?driver_id=1

# Пагинация
GET /api/trips?page=2&limit=10
```

#### Ответ

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "driver_id": 1,
      "route_info": "01.09.25_77_00ч_ВИП_19",
      "status": "review",
      "notes": "Срочная доставка",
      "created_at": "2025-09-01T08:30:00.000Z",
      "updated_at": "2025-09-01T08:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### 3. Получение рейса по ID

**GET** `/api/trips/:id`

Возвращает конкретный рейс по его идентификатору.

#### Параметры пути

- `id` - ID рейса

#### Пример

```bash
GET /api/trips/1
```

#### Ответ

```json
{
  "success": true,
  "data": {
    "id": 1,
    "driver_id": 1,
    "route_info": "01.09.25_77_00ч_ВИП_19",
    "status": "review",
    "notes": "Срочная доставка",
    "created_at": "2025-09-01T08:30:00.000Z",
    "updated_at": "2025-09-01T08:30:00.000Z"
  }
}
```

### 4. Получение рейсов водителя

**GET** `/api/trips/driver/:driverId`

Возвращает все рейсы конкретного водителя.

#### Параметры пути

- `driverId` - ID водителя

#### Пример

```bash
GET /api/trips/driver/1
```

#### Ответ

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "driver_id": 1,
      "route_info": "01.09.25_77_00ч_ВИП_19",
      "status": "review",
      "notes": "Срочная доставка",
      "created_at": "2025-09-01T08:30:00.000Z",
      "updated_at": "2025-09-01T08:30:00.000Z"
    }
  ],
  "count": 1
}
```

### 5. Смена статуса рейса

**PUT** `/api/trips/:id/status`

Обновляет статус конкретного рейса.

#### Параметры пути

- `id` - ID рейса

#### Тело запроса

```json
{
  "status": "with_driver"
}
```

#### Пример

```bash
PUT /api/trips/1/status
Content-Type: application/json

{
  "status": "with_driver"
}
```

#### Ответ

```json
{
  "success": true,
  "data": {
    "id": 1,
    "driver_id": 1,
    "route_info": "01.09.25_77_00ч_ВИП_19",
    "status": "with_driver",
    "notes": "Срочная доставка",
    "created_at": "2025-09-01T08:30:00.000Z",
    "updated_at": "2025-09-01T08:30:00.000Z"
  },
  "message": "Статус рейса успешно обновлен"
}
```

### 6. Обновление рейса

**PUT** `/api/trips/:id`

Обновляет данные рейса.

#### Параметры пути

- `id` - ID рейса

#### Тело запроса

```json
{
  "route_info": "Обновленная информация о маршруте",
  "notes": "Новые заметки",
  "status": "verified"
}
```

#### Пример

```bash
PUT /api/trips/1
Content-Type: application/json

{
  "route_info": "01.09.25_77_00ч_ВИП_19 - Обновленный маршрут",
  "notes": "Рейс проверен и подтвержден",
  "status": "verified"
}
```

#### Ответ

```json
{
  "success": true,
  "data": {
    "id": 1,
    "driver_id": 1,
    "route_info": "01.09.25_77_00ч_ВИП_19 - Обновленный маршрут",
    "status": "verified",
    "notes": "Рейс проверен и подтвержден",
    "created_at": "2025-09-01T08:30:00.000Z",
    "updated_at": "2025-09-01T08:30:00.000Z"
  },
  "message": "Рейс успешно обновлен"
}
```

### 7. Удаление рейса

**DELETE** `/api/trips/:id`

Удаляет рейс из системы.

#### Параметры пути

- `id` - ID рейса

#### Пример

```bash
DELETE /api/trips/1
```

#### Ответ

```json
{
  "success": true,
  "message": "Рейс успешно удален"
}
```

## 🔍 Коды ошибок

### HTTP статусы

- `200` - Успешный запрос
- `201` - Ресурс создан
- `400` - Неверный запрос (валидация)
- `404` - Ресурс не найден
- `500` - Внутренняя ошибка сервера

### Формат ошибок

```json
{
  "success": false,
  "error": "Описание ошибки",
  "details": "Детали ошибки (если доступны)"
}
```

### Примеры ошибок

#### Валидация

```json
{
  "success": false,
  "error": "driver_id и route_info обязательны"
}
```

#### Неверный статус

```json
{
  "success": false,
  "error": "Неверный статус. Допустимые значения: review, with_driver, rework, lost, verified"
}
```

#### Ресурс не найден

```json
{
  "success": false,
  "error": "Рейс не найден"
}
```

## 🧪 Тестирование

Для тестирования API используйте файл `test_trip_api.mjs`:

```bash
# Запуск тестов
node test_trip_api.mjs

# Или с помощью curl
curl -X POST http://localhost:3000/api/trips \
  -H "Content-Type: application/json" \
  -d '{"driver_id": 1, "route_info": "Тестовый маршрут"}'
```

## 📝 Примеры использования

### Создание рейса для водителя

```javascript
const response = await fetch('/api/trips', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    driver_id: 1,
    route_info: '01.09.25_77_00ч_ВИП_19 - Москва-СПб',
    status: 'review',
    notes: 'Срочная доставка документов'
  })
});

const result = await response.json();
console.log('Создан рейс:', result.data);
```

### Получение рейсов водителя

```javascript
const response = await fetch('/api/trips/driver/1');
const result = await response.json();

if (result.success) {
  console.log(`У водителя ${result.count} рейсов:`);
  result.data.forEach(trip => {
    console.log(`- Рейс ${trip.id}: ${trip.route_info} (${trip.status})`);
  });
}
```

### Смена статуса рейса

```javascript
const response = await fetch('/api/trips/1/status', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'with_driver' })
});

const result = await response.json();
if (result.success) {
  console.log('Статус изменен на:', result.data.status);
}
```

## 🔮 Планы развития

- [ ] Добавление аутентификации и авторизации
- [ ] Валидация данных с помощью Joi/Zod
- [ ] Логирование всех операций
- [ ] Кэширование для улучшения производительности
- [ ] WebSocket уведомления об изменениях
- [ ] Экспорт данных в Excel/CSV
- [ ] Массовые операции (создание/обновление нескольких рейсов)
