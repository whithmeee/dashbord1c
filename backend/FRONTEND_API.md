# API для фронтенда

Бэкенд — Laravel, авторизация по **сессионной cookie** (Sanctum SPA). Токенов нет.

## Для агента фронтенда: откуда берутся данные

Прочитайте этот раздел первым. Он отвечает на вопрос «этой цифре можно верить и откуда она». Бэкенд — единственный источник истины: суммы и статистику на клиенте не пересчитывайте.

| Что на экране | Ручка | Источник данных | Реальные? |
|---|---|---|---|
| Продажи по покупателям (выручка по месяцам, топ-5) | `GET /cabinet/finance/sales` | сервер **обращается к 1С по OData** (`Document_РеализацияТоваровУслуг`), но **денежные суммы сейчас намеренно скрыты**: валюта документов не подтверждена, ответ `financial_status: "unavailable"` | **нет, цифр пока нет** |
| Ответ бота в чате | `POST /api/chats/{id}/messages` | вопросы про деньги (выручка, топ покупателей) сейчас блокируются тем же правилом: приходит `widget` со `status: "unavailable"` и текст «Денежные показатели недоступны…». Обычные вопросы, не требующие данных, отвечает **DeepSeek** | деньги — нет, текст — да |
| «Состояние системы» | `GET /cabinet/system-status` | **живой запрос к каждой базе 1С** (кэш 60 с) | да |
| Проверка одной базы | `GET /cabinet/integrations/{id}/check` | **живой запрос к 1С** | да |
| «Подключено систем» | `GET /cabinet/integrations`, `/cabinet/dashboard` | наша БД (таблица `integrations`, даты подключения) | да |
| «Статус подписки» (даты, дни) | `GET /cabinet/subscription` | наша БД (даты на компании), дни считаются на сервере | да |
| «Активные пользователи» | `GET /cabinet/employees` | наша БД; `is_online` = активность за 5 минут | да |
| «Запросы к ИИ за месяц» | `GET /cabinet/statistics` | наша БД: считаются вопросы пользователей в таблице `messages` | да |
| Профиль, телефоны, мессенджеры | `GET /cabinet/settings`, `/auth/me` | наша БД | да |
| Админ-панель: компании, базы, пользователи, статистика | `/admin-panel/*` | наша БД | да |

**Важно про деньги.** Ни одной денежной цифры из 1С бэкенд сейчас не отдаёт: пока администратор не подтвердит валюту документов, показывать выручку нельзя (иначе суммы могут оказаться в неверной валюте). Экраны с деньгами должны показывать состояние «данные недоступны», а не нули. Когда валюта будет подтверждена, поля `monthly`, `customers`, `*_amount_minor` в `/cabinet/finance/sales` заполнятся без смены формата.

**Что на фронте пока не реально** (не пытайтесь искать для этого ручку):
- Каталог отчётов (`modules/dashboard/catalog/*`) — статичные карточки «планируется». Денежных данных нет ни у одного отчёта, в том числе «Продажи по покупателям» (см. выше).
- `modules/dashboard/adapters/demo/*` — выдуманные суммы за май–октябрь, прототип. В рабочий экран не подключать.
- Остальные финансовые отчёты (расходы, финансовый результат, поступления, платежи) на бэкенде **не реализованы**. Для каждого нужны сущность 1С, ручка и маппер, по образцу `/cabinet/finance/sales`.

**Правила, чтобы не сломать данные**
1. Когда деньги появятся, они будут приходить в **копейках** (`*_minor`, целые числа). Делите на 100 только при отображении. Сейчас `*_amount_minor` равны `null`: `null` — это «нет данных», не ноль.
2. `currency` в отчёте продаж `null` (`currency_status: not_provided_by_current_odata`): текущая публикация 1С не отдаёт валюту. Не подписывайте суммы символом «₽», пока валюта не определена, и ориентируйтесь на `financial_status`.
3. Отчёт продаж по-прежнему ходит в 1С (учитывает только проведённые документы без пометки удаления), поэтому может вернуть `502`, даже когда сумм нет.
4. Ошибки и состояния определяйте по HTTP-статусу и полю `code`, **не по тексту `message`** (он на русском, но может меняться).
5. Нет сети до 1С: `502` (`onec_unavailable` в отчёте продаж). Нет подписки: `403 subscription_inactive`. Почта не подтверждена: `403 email_verification_required`. Выбранная база отключена: `409 integration_inactive`.
6. Статистика запросов и отчёты не ходят в 1С, только «Продажи», чат и проверки состояния. Поэтому медленные ответы (до нескольких секунд) ждите только у этих трёх.

---
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
{ "id": 5, "company_id": 1, "name": "Иван", "position": "Бухгалтер", X, "last_seen_at": "..." }
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
  "config_name": "Бухгалтерия предприятия", "is_active": true, "status": "active", "connected_at": "2026-10-15T09:30:00.000000Z" }
```
Пароль 1С не возвращается никогда. `status`: `active` | `inactive` (включена или отключена администратором).

- `GET /cabinet/integrations` → `[ <integration> ]` — список баз (для переключателя в «Чате»; количество — `length`, активных — по `status`).
- `GET /cabinet/integrations/{id}/check` → `{ "id": 3, "status": "online"|"offline"|"inactive", "checked_at": "..." }`. Реальная проверка связи с 1С (до нескольких секунд, 30 в минуту). Вызывайте для каждой базы после открытия раздела и показывайте индикатор. `offline` — 1С не отвечает.

### Настройки **[владелец]**
- `GET /cabinet/settings` → объект компании (как `account`).
- `PATCH /cabinet/settings` — тело: `{ name?, phones?: [{phone, label?}], messengers?: [{name, contact}] }`. Если `phones`/`messengers` переданы — **целиком заменяют** существующие (до 10 штук), если не переданы — не меняются. Email и подписку клиент менять не может. Ответ — объект компании.

### Состояние системы (карточка «Состояние системы»)
`GET /cabinet/system-status` — владелец и сотрудник. Проверяет реальную доступность баз 1С (все базы опрашиваются одновременно, таймаут 5 с), результат кэшируется на 60 секунд.
```json
{ "status": "degraded",
  "message": "Работает частично: активно баз 1 из 2.",
  "total": 2, "active_count": 1, "inactive_count": 1,
  "integrations": [
    { "id": 3, "name": "Основная", "status": "active", "reason": null, "checked_at": "..." },
    { "id": 4, "name": "Филиал", "status": "inactive", "reason": "unreachable", "checked_at": "..." } ] }
```
- `status`: `operational` — все базы работают; `degraded` — часть не работает; `inactive` — баз нет или не работает ни одна.
- `message` — готовый текст для карточки: «Не активно: ни одной базы не подключено.», «Не активно: ни одна из баз не работает.», «Работает частично: активно баз N из M.», «Все системы работают.».
- В `integrations[]` у каждой базы `status` (`active` | `inactive`) и `reason`: `disabled` (отключена администратором), `unreachable` (1С не отвечает) или `null`.
### Продажи по покупателям (данные из 1С, суммы пока скрыты)
`GET /cabinet/finance/sales?integration_id=3&from=2026-05-01&to=2026-10-31` — владелец и сотрудник; нужна подтверждённая почта.
- `integration_id` — своя база (чужая или несуществующая даёт `404`), `from`/`to` — `YYYY-MM-DD`, обе границы включительно, `to >= from`.
- Если база отключена — `409 integration_inactive`. Если 1С не ответила — `502`, `code: onec_unavailable`.
- Сервер обращается к 1С (документы реализации), но **пока не отдаёт суммы**: валюта документов не подтверждена. Ответ `200` сейчас всегда такой:
```json
{ "integration_id": 3,
  "period": { "from": "2026-05-01", "to": "2026-10-31" },
  "money": { "currency": null, "currency_status": "not_provided_by_current_odata", "amount_scale": null, "unit": null },
  "financial_status": "unavailable",
  "financial_status_code": "currency_unconfirmed",
  "monthly": [],
  "customers": [],
  "total_amount_minor": null,
  "customers_total_amount_minor": null }
```
- Проверяйте `financial_status`: `unavailable` — показать состояние «Денежные данные недоступны: валюта не подтверждена» вместо графика; пустые `monthly`/`customers` здесь не означают «продаж не было».
- Когда валюта будет подтверждена, те же поля заполнятся: `monthly` (месяцы с продажами, `period` = `YYYY-MM`, `amount_minor`), `customers` (топ-5 с `name` и `amount_minor`), итоги в копейках. Формат менять не придётся, поэтому логику отображения готовьте уже сейчас.
- Запрос идёт в 1С и может занять несколько секунд, выставляйте индикатор загрузки.

### Подписка (для модалки «Статус подписки»)
`GET /cabinet/subscription` — доступно и владельцу, и сотруднику, при неактивной подписке тоже.
```json
{ "status": "active", "state": "active",
  "starts_at": "2026-10-01", "ends_at": "2027-09-30",
  "total_days": 365, "elapsed_days": 35, "days_left": 330,
  "progress_percent": 10, "expires_soon": false }
```
- `state`: `active` | `expired` (срок вышел) | `not_started` (ещё не началась); `status` — `active` или `inactive` для плашки.
- `days_left` — полных дней до окончания (в последний день = 0; у `expired` и `not_started` = 0). Подписка действует включительно по `ends_at`.
- `expires_soon` — осталось 7 дней или меньше.
- `progress_percent` — доля прошедшего срока (для прогресс-бара).

### Сотрудники **[владелец]**
`<employee>`: `{ id, company_id, name, position, login, sections, is_online, last_seen_at, created_at }` (`created_at` — когда добавлен). `is_online` — была активность за последние 5 минут.
- `GET /cabinet/employees` → `[ <employee> ]`
- `GET /cabinet/employees/{id}` → `<employee>`
- `POST /cabinet/employees` `{ name, position, login, password, sections? }` → `201 <employee>`. Логин: латиница, цифры, `-`, `_`, уникальный. Пароль ≥ 8, буквы + цифры.
- `PATCH /cabinet/employees/{id}` `{ name?, position?, login?, password?, sections? }` → `<employee>`. Смена пароля завершает сессии сотрудника.
- `DELETE /cabinet/employees/{id}` → `204` (вместе с историей входов сотрудника)
- `GET /cabinet/employees/{id}/activity?limit=50` → профиль активности (только владелец, `limit` 1–200):
```json
{ "last_login_at": "..."|null, "last_logout_at": "..."|null, "questions_count": 12,
  "items": [ { "type": "login"|"logout"|"question", "at": "...", "details": null|"текст вопроса (до 200 символов)" } ] }
```
Входы и выходы пишутся с момента этого обновления; `items` — от новых к старым. Выход фиксируется только по кнопке «Выйти» (протухшая сессия выходом не считается).

**Доступ сотрудника по разделам.** `sections` — массив из: `finance` (`/cabinet/finance/sales`), `integrations` (`/cabinet/integrations*`), `statistics` (`/cabinet/statistics`), `subscription` (`/cabinet/subscription`), `system_status` (`/cabinet/system-status`), `chat` (`/api/chats*`). Не передан при создании — доступны все разделы. Главная `/cabinet/dashboard` доступна всегда. Если раздела у сотрудника нет — ручка отвечает `404`, а сам список разделов приходит в `account.sections` (`/auth/me`, логин) — по нему прячьте пункты меню. Владелец компании разделами не ограничен.

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

**Повторная отправка без дублей (`Idempotency-Key`).** В `POST /api/chats/{id}/messages` можно передать заголовок `Idempotency-Key: <UUID>`. Один и тот же ключ с тем же текстом не создаёт второй вопрос:
- уже выполненный запрос — вернётся то же сообщение ассистента (`201`);
- запрос ещё идёт — `409`, `code: message_request_processing`;
- результат неизвестен (сервер упал или прошло более 5 минут) — `409`, `code: message_request_unknown`, после этого обновите историю `GET /api/chats/{id}/messages`;
- тот же ключ с другим текстом или в другой базе — `409`, `code: idempotency_key_conflict`; ключ не UUID — `422`, `code: invalid_idempotency_key`.

`GET /api/chats/{id}/message-requests/{requestId}` (ключ — тот же UUID) → `{ "request_id": "...", "status": "processing"|"completed"|"unknown", "message": <message> }`. Поле `message` есть только у `completed`. Используйте после обрыва связи, чтобы узнать итог, не отправляя вопрос повторно. Новый UUID для каждого нового вопроса.

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

**Сейчас денежные вопросы** (выручка, топ покупателей) вместо таблицы возвращают виджет-заглушку, а `content` — её сообщение:
```json
{ "title": "Сводка реализаций", "status": "unavailable",
  "code": "currency_unconfirmed",
  "message": "Денежные показатели недоступны: валюта документов 1С не подтверждена." }
```
Признак — `widget.status === "unavailable"`; тогда колонок и строк нет, рисуйте сообщение (`widget.message`) вместо таблицы. Таблица выше — формат, который вернётся после подтверждения валюты.

**Рекомендуемый экран «Чат»:** список чатов слева; сверху — переключатель баз (`GET /cabinet/integrations`: «Баз: N», статус каждой, `…/check` для live-индикатора); смена базы в открытом чате — `PATCH /api/chats/{id}`; отключённые базы показывать серыми и не давать выбрать.

---

## 4. Статистика запросов
«Запрос» — вопрос пользователя боту. Ответы ассистента не считаются.

`GET /cabinet/statistics` (клиент) и `GET /admin-panel/statistics` (админ). Параметры (все необязательные):

| Параметр | Значение |
|---|---|
| `period` | `today` (сегодня), `week` (7 дней), `month` (30 дней, по умолчанию), `year` (365 дней). Считается назад от `to` (по умолчанию — сегодня) |
| `month` | `YYYY-MM` — календарный месяц целиком (для «запросов за месяц»), группировка по дням. Главнее `period`, но слабее `from`/`to` |
| `from`, `to` | `YYYY-MM-DD`, обе границы включительно. Задают произвольный промежуток и главнее `period`. Максимум 5 лет |
| `group` | `hour`, `day`, `week`, `month`. По умолчанию подбирается сам: 1 день → `hour`, до 31 дня → `day`, до 120 дней → `week`, дальше → `month`. `hour` — только до 7 дней |
| `integration_id` | только одна база |
| `company_id` | **только админ**: только одна компания |

Ответ:
```json
{
  "period": { "from": "2026-10-04", "to": "2026-11-02", "group": "day" },
  "total": 128,
  "summary": { "average_per_day": 4.3, "active_days": 22,
    "peak_day": { "date": "2026-10-14", "requests": 17 }, "last_request_at": "2026-11-02T14:05:00+00:00" },
  "by_period": [ { "period": "2026-10-04", "requests": 3 }, ... ],
  "by_integration": [ { "integration_id": 3, "name": "Основная", "requests": 100 } ],
  "by_author": [ { "type": "company"|"employee", "id": 1, "name": "Иван", "requests": 40 } ],
  "by_company": [ { "company_id": 1, "name": "ООО Ромашка", "requests": 90 } ]
}
```
- `by_period` без пропусков: пустые интервалы приходят с `requests: 0`. Подписи: `hour` → `2026-11-02 14:00`, `day` → `2026-11-02`, `week` → понедельник недели `2026-10-26`, `month` → `2026-11`.
- `summary`: `average_per_day` — среднее за календарные дни периода, `active_days` — дней с хотя бы одним запросом, `peak_day` — самый загруженный день (`null`, если запросов не было), `last_request_at` — последний запрос (`null`, если не было).
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

### Страница «Безопасность»
`GET /security` — обычная веб-страница (Blade `resources/views/security.blade.php`), не JSON, без входа. Сейчас там только заголовок; текст политики безопасности вставьте в `<main>` этого шаблона либо сделайте страницу во фронтенде и уберите маршрут.

## 6. Сводная таблица

| Метод и путь | Кто | Условия |
|---|---|---|
| `POST /auth/login` | все | — |
| `GET /auth/me`, `POST /auth/logout`, `POST /auth/change-password` | все вошедшие | — |
| `POST /auth/email/verify`, `POST /auth/email/resend` | company | — |
| `GET /cabinet/dashboard`, `/cabinet/integrations`, `/cabinet/integrations/{id}/check`, `/cabinet/statistics`, `/cabinet/subscription`, `/cabinet/system-status`, `/cabinet/finance/sales` | company, employee | почта подтверждена |
| `GET, PATCH /cabinet/settings`, CRUD `/cabinet/employees` | company | почта подтверждена |
| `GET, POST /api/chats`, `PATCH, DELETE /api/chats/{id}`, `GET, POST /api/chats/{id}/messages`, `GET /api/chats/{id}/message-requests/{requestId}` | company, employee | почта + активная подписка |
| `/admin-panel/*` | admin | иначе 404 |
