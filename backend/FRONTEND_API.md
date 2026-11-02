# API для фронтенда

Бэкенд — Laravel, авторизация по **сессионной cookie** (Sanctum SPA). Токенов нет.

## 0. Общие правила

**Подключение**
- Все запросы с `credentials: 'include'` (axios: `withCredentials: true`).
- Перед первым `POST` один раз: `GET /sanctum/csrf-cookie`. Затем в каждом запросе, меняющем данные, заголовок `X-XSRF-TOKEN` = значение cookie `XSRF-TOKEN` (axios добавляет его сам при `withXSRFToken: true`).
- Заголовки: `Accept: application/json`, `Content-Type: application/json`.
- Фронт и бэк на одном родительском домене (`app.example.ru` и `api.example.ru`), в проде бэку нужен `SESSION_DOMAIN=.example.ru`. Локально — `localhost:3000` из `FRONTEND_URL` / `SANCTUM_STATEFUL_DOMAINS`.

**Формат ответов**
- Объект или массив возвращается как есть, без обёртки `data`.
- Исключение — постраничные списки (`/admin-panel/companies`, `/admin-panel/users`): `{ data: [...], links: {...}, meta: {...} }`, параметр `?page=2`, 25 на страницу.
- `DELETE` отвечает `204` без тела.
- Даты подписки — `YYYY-MM-DD`, остальные — ISO-8601.

**Ошибки**

| Код | Когда | Тело |
|---|---|---|
| 401 | не вошли | `{message}` |
| 403 | нет прав / нужно подтвердить почту / нет подписки | `{message, code?}` |
| 404 | нет такой записи, чужая запись, **любой `/admin-panel/*` для не-админа** |  |
| 409 | выбранная база 1С отключена | `{message, code: "integration_inactive"}` |
| 419 | не передан или протух CSRF — повторить `GET /sanctum/csrf-cookie` |  |
| 422 | валидация | `{message, errors: {поле: ["текст"]}}` |
| 429 | слишком часто (логин 5/мин, сообщения 20/мин) |  |
| 502 | не ответили 1С или DeepSeek | `{message}` |

Коды в 403: `email_verification_required` (показать ввод кода), `subscription_inactive` (показать «подписка неактивна»).

**Кто есть кто.** `type` из логина: `admin` (сотрудник администрации), `company` (директор / владелец компании), `employee` (сотрудник компании). В одном браузере — один аккаунт: новый вход выбивает предыдущий.

---

## 1. Авторизация (`/auth/*`)

### `POST /auth/login` — единый вход
Тело: `{ "login": "...", "password": "..." }`. `login` — email (админ или компания) либо логин сотрудника.
Ответ `200`: `{ "type": "admin"|"company"|"employee", "account": {...} }`. Состав `account` зависит от типа (см. ниже).
Ошибка неверных данных — `422`, `errors.login`.
Если вошла компания с неподтверждённой почтой, на почту автоматически уходит код (не чаще раза в минуту).

`account` для `company`:
```json
{ "id": 1, "name": "ООО Ромашка", "email": "d@x.ru", "email_verified": true,
  "subscription_status": "active",
  "phones": [{"id":1,"phone":"+7900...","label":"Директор"}],
  "messengers": [{"id":1,"name":"Telegram","contact":"@romashka"}],
  "created_at": "..." }
```
`subscription_status`: `active` | `inactive` — клиент видит **только статус**, без дат.

`account` для `employee`:
```json
{ "id": 5, "company_id": 1, "name": "Иван", "position": "Бухгалтер", "login": "ivan",
  "is_online": true, "last_seen_at": "..." }
```
У сотрудника нет ни `email_verified`, ни `subscription_status` — их берите из `GET /cabinet/dashboard` (`company`).

`account` для `admin`:
```json
{ "id": 1, "name": "Босс", "email": "...", "phone_number": null,
  "role": {"id":1,"name":"admin","label":"Администратор"}, "is_admin": true, "created_at": "..." }
```

### `GET /auth/me`
Тот же формат, что у логина. Вызывать при старте приложения: `401` → показать форму входа.

### `POST /auth/logout`
`{ "message": "Вы вышли из системы." }`

### `POST /auth/change-password` — необязательная смена пароля (раздел «Настройки»)
Тело: `{ current_password, password, password_confirmation }`. Пароль: ≥ 8 символов, буквы и цифры, не равен текущему. Ответ: как `/auth/me`. Остальные сессии аккаунта завершаются.

### Подтверждение почты (только `company`)
Пока почта не подтверждена, `/cabinet/*` (кроме `/auth/*`) и `/api/*` отвечают `403 email_verification_required`. Сценарий: после логина `account.email_verified === false` → экран ввода кода.
- `POST /auth/email/verify` `{ "code": "123456" }` → ответ как `/auth/me` (теперь `email_verified: true`). Код 6 цифр, живёт 15 минут, 5 попыток; неверный → `422 errors.code`.
- `POST /auth/email/resend` → `{message}`. Не чаще 3 в минуту.
- Для `employee` эти ручки возвращают `403` — сотрудники ждут, пока владелец подтвердит почту.

---

## 2. Кабинет клиента (`/cabinet/*`)
Доступны `company` и `employee` (остальным — `401`). Нужна подтверждённая почта. Подписка **не** требуется — клиент с неактивной подпиской видит кабинет и статус.
Метки: **[владелец]** — только `company`, сотрудник получает `403`.

### `GET /cabinet/dashboard`
```json
{
  "company": { ...как account компании... },
  "integrations": { "count": 2, "active_count": 1, "items": [ <integration> ] },
  "employees": { "count": 3, "online_count": 1, "items": [ <employee> ] }
}
```
Блок `employees` приходит **только** у владельца.

### Базы 1С
`<integration>`:
```json
{ "id": 3, "company_id": 1, "name": "Основная", "odata_url": "https://...", "login": "odata",
  "config_name": "Бухгалтерия предприятия", "is_active": true, "status": "active" }
```
Пароль 1С не возвращается никогда. `status`: `active` | `inactive` (включена или отключена администратором).

- `GET /cabinet/integrations` → `[ <integration> ]` — список баз (для переключателя в «Чате»; количество — `length`, активных — по `status`).
- `GET /cabinet/integrations/{id}/check` → `{ "id": 3, "status": "online"|"offline"|"inactive", "checked_at": "..." }`. Реальная проверка связи с 1С (до нескольких секунд, 30 в минуту). Вызывайте для каждой базы после открытия раздела и показывайте индикатор. `offline` — 1С не отвечает.

### Настройки **[владелец]**
- `GET /cabinet/settings` → объект компании (как `account`).
- `PATCH /cabinet/settings` — тело: `{ name?, phones?: [{phone, label?}], messengers?: [{name, contact}] }`. Если `phones`/`messengers` переданы — **целиком заменяют** существующие (до 10 штук), если не переданы — не меняются. Email и подписку клиент менять не может. Ответ — объект компании.

### Сотрудники **[владелец]**
`<employee>`: `{ id, company_id, name, position, login, is_online, last_seen_at }`. `is_online` — была активность за последние 5 минут.
- `GET /cabinet/employees` → `[ <employee> ]`
- `POST /cabinet/employees` `{ name, position, login, password }` → `201 <employee>`. Логин: латиница, цифры, `-`, `_`, уникальный. Пароль ≥ 8, буквы + цифры.
- `PATCH /cabinet/employees/{id}` `{ name?, position?, login?, password? }` → `<employee>`. Смена пароля завершает сессии сотрудника.
- `DELETE /cabinet/employees/{id}` → `204`

### Статистика запросов к боту
`GET /cabinet/statistics` — см. раздел 4. Владелец видит всю компанию, сотрудник — только свои запросы.

---

## 3. Чат (`/api/*`)
Доступен `company` и `employee` с подтверждённой почтой и **активной подпиской** (иначе `403 subscription_inactive`). Чат личный: компания видит только свои чаты, сотрудник — только свои.

Чат привязан к одной базе 1С, DeepSeek работает **только в ней**. Базу можно сменить в любой момент — следующие вопросы пойдут в новую базу.

`<chat>`:
```json
{ "id": 7, "integration_id": 3, "integration": <integration>, "title": "Выручка за октябрь", "created_at": "..." }
```
`title` у нового чата — «Новый диалог», после первого вопроса становится его текстом (до 60 символов).

- `GET /api/chats` → `[ <chat> ]`, новые первыми.
- `POST /api/chats` `{ integration_id, title? }` → `201 <chat>`. База должна принадлежать компании и быть включённой, иначе `422`.
- `PATCH /api/chats/{id}` `{ integration_id?, title? }` → `<chat>`. **Переключение базы** — это передача нового `integration_id` (включённая база своей компании, иначе `422`). Так же переименование.
- `DELETE /api/chats/{id}` → `204` (вместе с сообщениями).
- `GET /api/chats/{id}/messages` → `[ <message> ]` по порядку.
- `POST /api/chats/{id}/messages` `{ "content": "Покажи выручку за октябрь" }` (до 2000 символов) → `201 <message>` ответа ассистента. Занимает несколько секунд (DeepSeek + 1С), показывайте индикатор. Лимит 20 в минуту. Если у чата база отключена — `409 integration_inactive` (предложите переключить базу). `502` — 1С или DeepSeek недоступны.

`<message>`:
```json
{ "id": 21, "chat_id": 7, "integration_id": 3, "role": "assistant",
  "content": "- Выручка стабильна...", "widget": { ... } | null, "created_at": "..." }
```
`role`: `user` | `assistant`. `content` — текст-сводка от ИИ (markdown-список). `widget` — таблица с точными цифрами (посчитаны на бэкенде) или `null`, если вопрос не требовал данных:
```json
{ "title": "Выручка за октябрь 2026",
  "columns": [ {"key":"name","label":"Организация","type":"string"},
               {"key":"revenue","label":"Выручка, ₽","type":"money"} ],
  "rows": [ {"name":"ООО \"ИЛСЕРВИС\"","documents":2,"revenue":300000.3,"average":150000.15} ],
  "totals": { "documents": 2, "revenue": 300000.3 },
  "rows_count": 1, "columns_count": 4 }
```
Типы колонок: `string`, `integer`, `money` (₽), `percent`. Ячейки читайте по `columns[].key`.

**Рекомендуемый экран «Чат»:** список чатов слева; сверху — переключатель баз (`GET /cabinet/integrations`: «Баз: N», статус каждой, `…/check` для live-индикатора); смена базы в открытом чате — `PATCH /api/chats/{id}`; отключённые базы показывать серыми и не давать выбрать.

---

## 4. Статистика запросов
«Запрос» — вопрос пользователя боту. Ответы ассистента не считаются.

`GET /cabinet/statistics` (клиент) и `GET /admin-panel/statistics` (админ). Параметры (все необязательные):

| Параметр | Значение |
|---|---|
| `period` | `today` (сегодня), `week` (7 дней), `month` (30 дней, по умолчанию), `year` (365 дней). Считается назад от `to` (по умолчанию — сегодня) |
| `from`, `to` | `YYYY-MM-DD`, обе границы включительно. Задают произвольный промежуток и главнее `period`. Максимум 5 лет |
| `group` | `hour`, `day`, `week`, `month`. По умолчанию подбирается сам: 1 день → `hour`, до 31 дня → `day`, до 120 дней → `week`, дальше → `month`. `hour` — только до 7 дней |
| `integration_id` | только одна база |
| `company_id` | **только админ**: только одна компания |

Ответ:
```json
{
  "period": { "from": "2026-10-04", "to": "2026-11-02", "group": "day" },
  "total": 128,
  "by_period": [ { "period": "2026-10-04", "requests": 3 }, ... ],
  "by_integration": [ { "integration_id": 3, "name": "Основная", "requests": 100 } ],
  "by_author": [ { "type": "company"|"employee", "id": 1, "name": "Иван", "requests": 40 } ],
  "by_company": [ { "company_id": 1, "name": "ООО Ромашка", "requests": 90 } ]
}
```
- `by_period` без пропусков: пустые интервалы приходят с `requests: 0`. Подписи: `hour` → `2026-11-02 14:00`, `day` → `2026-11-02`, `week` → понедельник недели `2026-10-26`, `month` → `2026-11`.
- `by_author` — у владельца (`/cabinet`) и у админа с `company_id`. У сотрудника его нет.
- `by_company` — только у админа без `company_id`.
- Для выбора промежутков в интерфейсе: кнопки День / Неделя / Месяц / Год → `period`, выбор дат → `from`+`to`.
- Статистика доступна и при неактивной подписке.

---

## 5. Админ-панель (`/admin-panel/*`)
Только `admin`, всем остальным — `404`. Здесь ответы на создание содержат `initial_password` — **показывается один раз**, его нужно передать директору (после перезагрузки страницы он не восстанавливается, только `reset-password`).

### Компании
`<company-admin>` — как компания клиента, плюс: `subscription_starts_at`, `subscription_ends_at` (`YYYY-MM-DD`), `employees_count`, `integrations_count` (в списке и карточке), `email_verified`.

- `GET /admin-panel/companies?search=&page=` — постранично, поиск по названию и email.
- `POST /admin-panel/companies` → `201 <company-admin> + initial_password`. Тело:
  `{ name, email, subscription_starts_at, subscription_ends_at, phones?: [{phone,label?}], messengers?: [{name,contact}] }`. Email уникален среди компаний и администрации; конец подписки ≥ начала.
- `GET /admin-panel/companies/{id}`
- `PATCH /admin-panel/companies/{id}` — любые поля из `POST`. Продление подписки — `subscription_ends_at`. `phones`/`messengers` заменяют списки целиком. **Смена email сбрасывает подтверждение почты.**
- `DELETE /admin-panel/companies/{id}` → `204` (удаляются сотрудники, базы, чаты).
- `POST /admin-panel/companies/{id}/reset-password` → `<company-admin> + initial_password`; старые сессии компании завершаются.
- `GET /admin-panel/companies/{id}/employees` → `[ <employee> ]` (просмотр, без управления).

### Базы 1С компаний
- `GET /admin-panel/integrations?company_id=` → `[ <integration> ]`
- `POST /admin-panel/integrations` `{ company_id, odata_url, login, password, name?, config_name? }` → `201 <integration>` (создаётся включённой). Пароль хранится зашифрованным.
- `PATCH /admin-panel/integrations/{id}` `{ name?, odata_url?, login?, password?, config_name?, is_active? }` → `<integration>`. `is_active: false` отключает базу (чаты на ней перестанут отвечать, пока клиент не переключится). Пустой `password` — оставить прежний.
- `DELETE /admin-panel/integrations/{id}` → `204` (удаляет чаты на этой базе вместе со статистикой по ней).
- `GET /admin-panel/integrations/{id}/test` → `{status:"success"|"error", message, ...}` — диагностика связи. Для индикатора в интерфейсе клиента используйте `/cabinet/.../check`.

### Администрация
`<user>`: `{ id, name, email, phone_number, role:{id,name,label}, is_admin, created_at }`. `role_id`: 1 — администратор, 2 — пользователь.
- `GET /admin-panel/users?role_id=&page=` — постранично.
- `POST /admin-panel/users` `{ name, email, phone_number?, role_id? }` → `201 <user> + initial_password`
- `GET /admin-panel/users/{id}`, `PATCH /admin-panel/users/{id}` `{ name?, email?, phone_number?, role_id? }`
- `DELETE /admin-panel/users/{id}` → `204`. Себя удалить и снять с себя роль админа нельзя (`422`).
- `POST /admin-panel/users/{id}/reset-password` → `<user> + initial_password`
- `GET /admin-panel/statistics` — раздел 4.

---

## 6. Сводная таблица

| Метод и путь | Кто | Условия |
|---|---|---|
| `POST /auth/login` | все | — |
| `GET /auth/me`, `POST /auth/logout`, `POST /auth/change-password` | все вошедшие | — |
| `POST /auth/email/verify`, `POST /auth/email/resend` | company | — |
| `GET /cabinet/dashboard`, `/cabinet/integrations`, `/cabinet/integrations/{id}/check`, `/cabinet/statistics` | company, employee | почта подтверждена |
| `GET, PATCH /cabinet/settings`, CRUD `/cabinet/employees` | company | почта подтверждена |
| `GET, POST /api/chats`, `PATCH, DELETE /api/chats/{id}`, `GET, POST /api/chats/{id}/messages` | company, employee | почта + активная подписка |
| `/admin-panel/*` | admin | иначе 404 |
