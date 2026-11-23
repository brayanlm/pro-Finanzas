# Documentación de API - Dashboard de Finanzas Personales

## 1. Información General

| Aspecto | Detalle |
|---------|---------|
| **Base URL** | `/api/v1` |
| **Protocolo** | HTTPS |
| **Formato** | JSON |
| **Autenticación** | JWT Bearer Token |
| **Versionado** | URL path (`/v1`) |
| **Rate Limiting** | Auth: 10/min, API: 100/min, General: 200/min |

---

## 2. Autenticación

### 2.1 Headers Requeridos
```
Authorization: Bearer <access_token>
Content-Type: application/json
Accept: application/json
```

### 2.2 Códigos de Estado HTTP
| Código | Significado |
|--------|-------------|
| 200 | OK - Éxito |
| 201 | Created - Recurso creado |
| 400 | Bad Request - Validación fallida |
| 401 | Unauthorized - Token inválido/expirado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no existe |
| 409 | Conflict - Duplicado (email, nombre único) |
| 422 | Unprocessable Entity - Error semántico |
| 429 | Too Many Requests - Rate limit |
| 500 | Internal Server Error |

### 2.3 Formato Respuesta Estándar
```json
// Éxito
{
  "success": true,
  "data": {},
  "meta": {}
}

// Error
{
  "success": false,
  "message": "Descripción legible",
  "details": [
    { "field": "email", "message": "Email inválido" }
  ]
}

// Paginación
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 3. Endpoints de Autenticación (`/auth`)

### POST `/auth/register`
**Registrar nuevo usuario**

**Request:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "Segura123!",
  "confirmPassword": "Segura123!",
  "name": "Juan Pérez"
}
```

**Validaciones:**
- Email único, formato válido
- Password: min 8 chars, 1 mayúscula, 1 número, 1 símbolo
- confirmPassword coincide

**Response 201:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "name": "...", "role": "USER", "preferences": {} },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### POST `/auth/login`
**Iniciar sesión**

**Request:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "Segura123!",
  "rememberMe": false
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "name": "...", "role": "USER", "preferences": {} },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### POST `/auth/logout`
**Cerrar sesión (invalida token en blacklist si se implementa)**

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{ "success": true, "message": "Sesión cerrada correctamente" }
```

---

### POST `/auth/forgot-password`
**Solicitar reset de contraseña**

**Request:**
```json
{ "email": "usuario@ejemplo.com" }
```

**Response 200:** (Siempre 200 por seguridad, no revelar si email existe)
```json
{ "success": true, "message": "Si el email existe, recibirás instrucciones" }
```

---

### POST `/auth/reset-password`
**Restablecer contraseña con token**

**Request:**
```json
{
  "token": "reset_token_from_email",
  "password": "NuevaSegura456!",
  "confirmPassword": "NuevaSegura456!"
}
```

**Response 200:**
```json
{ "success": true, "message": "Contraseña actualizada. Inicia sesión con la nueva." }
```

---

### GET `/auth/me`
**Obtener usuario actual (validar token)**

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "usuario@ejemplo.com",
    "name": "Juan Pérez",
    "role": "USER",
    "preferences": { "currency": "EUR", "theme": "system" },
    "createdAt": "2024-01-15T10:30:00Z",
    "lastLoginAt": "2024-01-20T08:15:00Z"
  }
}
```

---

### PUT `/auth/me`
**Actualizar perfil usuario actual**

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "name": "Juan Pérez García",
  "preferences": { "currency": "USD", "theme": "dark", "language": "en" }
}
```

**Response 200:**
```json
{ "success": true, "data": { "user": { ...updated } } }
```

---

### PUT `/auth/me/password`
**Cambiar contraseña (usuario logueado)**

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "currentPassword": "Segura123!",
  "newPassword": "NuevaSegura789!",
  "confirmPassword": "NuevaSegura789!"
}
```

**Response 200:**
```json
{ "success": true, "message": "Contraseña cambiada correctamente" }
```

---

## 4. Endpoints de Movimientos (`/movements`)

*Todos requieren `Authorization: Bearer <token>` y filtro automático `userId`*

### GET `/movements`
**Listar movimientos con filtros y paginación**

**Query Params:**
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| page | integer | 1 | Página |
| limit | integer | 20 | Items por página (max 100) |
| sort | string | -date | Campo orden: `date`, `-date`, `amount`, `-amount`, `createdAt` |
| type | string | - | `income` o `expense` |
| categoryId | ObjectId | - | Filtrar por categoría |
| accountId | ObjectId | - | Filtrar por cuenta |
| startDate | ISO date | - | Fecha desde (inclusive) |
| endDate | ISO date | - | Fecha hasta (inclusive) |
| search | string | - | Búsqueda en descripción (regex parcial) |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "type": "expense",
      "description": "Supermercado",
      "amount": 85.50,
      "categoryId": "...",
      "category": { "id": "...", "name": "Alimentación", "color": "#EF4444", "icon": "utensils" },
      "accountId": "...",
      "account": { "id": "...", "name": "Efectivo", "type": "cash" },
      "date": "2024-01-15T00:00:00Z",
      "notes": "Compra semanal",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 150, "totalPages": 8, "hasNext": true, "hasPrev": false }
}
```

---

### POST `/movements`
**Crear movimiento**

**Request:**
```json
{
  "type": "expense",
  "description": "Cena restaurante",
  "amount": 45.00,
  "categoryId": "cat_object_id",
  "accountId": "acc_object_id",
  "date": "2024-01-20T20:30:00Z",
  "notes": "Cena con amigos"
}
```

**Validaciones:**
- type: `income` | `expense`
- amount > 0
- categoryId existe, pertenece al usuario, type coincide
- accountId existe, pertenece al usuario
- date: ISO 8601 válida, no futura > 1 día

**Response 201:**
```json
{
  "success": true,
  "data": { "movement": { ...created_movement_with_populated_category_account } }
}
```

---

### GET `/movements/:id`
**Obtener detalle de movimiento**

**Response 200:**
```json
{
  "success": true,
  "data": { "movement": { ...full_movement_with_category_account } }
}
```

**Response 404:** `{ "success": false, "message": "Movimiento no encontrado" }`

---

### PUT `/movements/:id`
**Actualizar movimiento** (recalcula saldos y presupuestos si cambia importe/cuenta/categoría)

**Request:** (campos opcionales, al menos uno)
```json
{
  "description": "Cena restaurante (actualizada)",
  "amount": 50.00,
  "categoryId": "new_cat_id",
  "accountId": "new_acc_id",
  "date": "2024-01-20T21:00:00Z",
  "notes": "Nueva nota"
}
```

**Response 200:**
```json
{ "success": true, "data": { "movement": { ...updated } } }
```

---

### DELETE `/movements/:id`
**Eliminar movimiento** (soft delete, recalcula saldos y presupuestos)

**Response 200:**
```json
{ "success": true, "message": "Movimiento eliminado correctamente" }
```

---

### GET `/movements/stats/summary`
**Resumen estadístico para período**

**Query:** `?year=2024&month=1` (default: mes actual)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "income": { "total": 2500, "count": 3 },
    "expense": { "total": 1800, "count": 25 },
    "balance": 700,
    "expensePercentage": 72,
    "previousMonth": { "income": 2400, "expense": 1700, "balance": 700 },
    "variation": { "incomePct": 4.17, "expensePct": 5.88, "balancePct": 0 }
  }
}
```

---

## 5. Endpoints de Categorías (`/categories`)

### GET `/categories`
**Listar categorías del usuario**

**Query:** `?type=expense&active=true`

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "id": "...", "name": "Alimentación", "type": "expense", "color": "#EF4444", "icon": "utensils", "isDefault": true, "isActive": true, "movementCount": 45 }
  ]
}
```

---

### POST `/categories`
**Crear categoría**

**Request:**
```json
{
  "name": "Suscripciones",
  "type": "expense",
  "color": "#8B5CF6",
  "icon": "credit-card"
}
```

**Response 201:** `{ "success": true, "data": { "category": { ... } } }`

---

### GET `/categories/:id`
**Obtener categoría**

---

### PUT `/categories/:id`
**Actualizar categoría**

**Request:** (campos opcionales)
```json
{ "name": "Suscripciones Digitales", "color": "#7C3AED" }
```

---

### DELETE `/categories/:id`
**Eliminar categoría**

**Regla:** Falla si tiene movimientos (`409 CONFLICT` con `details: { movementCount: N }`)

**Response 200:** `{ "success": true, "message": "Categoría eliminada" }`

---

### POST `/categories/seed-defaults`
**Crear categorías por defecto para usuario actual** (idempotente)

**Response 201:** `{ "success": true, "data": { "created": 12 } }`

---

## 6. Endpoints de Cuentas (`/accounts`)

### GET `/accounts`
**Listar cuentas del usuario**

**Query:** `?active=true&type=bank`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Banco Principal",
      "type": "bank",
      "initialBalance": 1000,
      "currentBalance": 1250,
      "currency": "EUR",
      "isActive": true,
      "bankName": "Banco Ejemplo",
      "lastFourDigits": "1234"
    }
  ]
}
```

---

### POST `/accounts`
**Crear cuenta**

**Request:**
```json
{
  "name": "Tarjeta Crédito",
  "type": "credit_card",
  "initialBalance": 0,
  "currency": "EUR",
  "creditLimit": 3000,
  "bankName": "Banco Ejemplo",
  "lastFourDigits": "5678"
}
```

**Validación extra:** `creditLimit` requerido si `type === 'credit_card'`

---

### GET `/accounts/:id`
**Obtener cuenta con movimientos recientes (opcional)**

**Query:** `?includeMovements=true&limit=10`

---

### PUT `/accounts/:id`
**Actualizar cuenta**

**Nota:** Cambiar `initialBalance` recalcula `currentBalance`

---

### DELETE `/accounts/:id`
**Eliminar cuenta** (soft delete)

**Regla:** Falla si tiene movimientos (`409`)

---

### POST `/accounts/:id/recalculate`
**Recalcular balance desde movimientos** (admin/debug)

**Response 200:** `{ "success": true, "data": { "currentBalance": 1250 } }`

---

## 7. Endpoints de Presupuestos (`/budgets`)

### GET `/budgets`
**Listar presupuestos**

**Query:** `?year=2024&month=1` (default: mes actual)

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "categoryId": "...",
      "category": { "id": "...", "name": "Alimentación", "color": "#EF4444", "icon": "utensils" },
      "year": 2024,
      "month": 1,
      "amount": 400,
      "spent": 320,
      "percentage": 80,
      "remaining": 80,
      "alertLevel": "warning",
      "alertThresholds": { "warning": 80, "danger": 90, "critical": 100 }
    }
  ]
}
```

---

### POST `/budgets`
**Crear/actualizar presupuesto** (upsert por userId+categoryId+year+month)

**Request:**
```json
{
  "categoryId": "cat_id",
  "year": 2024,
  "month": 2,
  "amount": 450,
  "alertThresholds": { "warning": 75, "danger": 90, "critical": 100 }
}
```

**Response 201/200:** `{ "success": true, "data": { "budget": { ... } } }`

---

### GET `/budgets/:id`
**Obtener presupuesto**

---

### PUT `/budgets/:id`
**Actualizar presupuesto**

---

### DELETE `/budgets/:id`
**Eliminar presupuesto**

---

### GET `/budgets/stats/summary`
**Resumen de presupuestos del mes**

**Query:** `?year=2024&month=1`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalBudgeted": 2500,
    "totalSpent": 1950,
    "overallPercentage": 78,
    "byAlertLevel": { "normal": 3, "warning": 2, "danger": 1, "critical": 0 },
    "topOverBudget": [
      { "category": "Ocio", "budget": 200, "spent": 250, "percentage": 125 }
    ]
  }
}
```

---

## 8. Endpoints de Dashboard (`/dashboard`)

### GET `/dashboard/summary`
**Resumen principal para tarjetas del dashboard**

**Response 200:**
```json
{
  "success": true,
  "data": {
    "availableBalance": 3500,
    "monthlyIncome": 2500,
    "monthlyExpense": 1800,
    "monthlyBalance": 700,
    "expensePercentage": 72,
    "previousMonthComparison": {
      "income": { "current": 2500, "previous": 2400, "variation": 4.17 },
      "expense": { "current": 1800, "previous": 1700, "variation": 5.88 },
      "balance": { "current": 700, "previous": 700, "variation": 0 }
    },
    "recentMovements": [
      { "id": "...", "type": "expense", "description": "Supermercado", "amount": 85.50, "date": "2024-01-15", "category": { "name": "Alimentación", "color": "#EF4444" }, "account": { "name": "Efectivo" } }
    ],
    "accountsSummary": [
      { "id": "...", "name": "Efectivo", "type": "cash", "currentBalance": 500, "currency": "EUR" }
    ]
  }
}
```

---

### GET `/dashboard/charts`
**Datos para todos los gráficos**

**Query:** `?period=12m` (6m, 12m, 24m)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "incomeVsExpense": [
      { "month": "2023-02", "income": 2400, "expense": 1800 },
      { "month": "2023-03", "income": 2500, "expense": 1900 }
    ],
    "expenseDistribution": [
      { "categoryId": "...", "name": "Alimentación", "color": "#EF4444", "total": 600, "percentage": 33.3 },
      { "categoryId": "...", "name": "Transporte", "color": "#DC2626", "total": 300, "percentage": 16.7 }
    ],
    "balanceEvolution": [
      { "month": "2023-02", "balance": 600 },
      { "month": "2023-03", "balance": 600 }
    ],
    "topExpenseCategories": [
      { "categoryId": "...", "name": "Alimentación", "color": "#EF4444", "total": 600 },
      { "categoryId": "...", "name": "Transporte", "color": "#DC2626", "total": 300 }
    ]
  }
}
```

---

## 9. Endpoints de Reportes (`/reports`)

### GET `/reports/export`
**Exportar reporte (PDF/Excel)**

**Query Params:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| format | string | Sí | `pdf` o `excel` |
| year | integer | No | Año (default actual) |
| month | integer | No | Mes (default actual) |
| type | string | No | `income`, `expense`, `all` |
| categoryId | ObjectId | No | Filtrar categoría |
| accountId | ObjectId | No | Filtrar cuenta |
| startDate | ISO date | No | |
| endDate | ISO date | No | |

**Headers Response:**
```
Content-Type: application/pdf (o application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
Content-Disposition: attachment; filename="reporte-2024-01.pdf"
```

**Body:** Binary file stream

---

### GET `/reports/movements`
**Datos para reporte de movimientos (JSON, para preview)**

**Query:** Mismos filtros que export

**Response 200:** `{ "success": true, "data": { "movements": [], "summary": {}, "filters": {} } }`

---

## 10. Endpoints de Administración (`/admin`)

*Requieren rol `ADMIN`*

### GET `/admin/users`
**Listar usuarios**

**Query:** `?page=1&limit=20&search=&role=&active=`

**Response 200:** Lista de usuarios (sin passwordHash, sin tokens)

---

### GET `/admin/users/:id`
**Ver usuario**

---

### PUT `/admin/users/:id`
**Actualizar usuario (role, isActive)**

**Request:**
```json
{ "role": "ADMIN", "isActive": false }
```

---

### DELETE `/admin/users/:id`
**Desactivar usuario** (soft delete, no borrar)

---

### GET `/admin/stats`
**Estadísticas globales del sistema**

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "activeUsers": 142,
    "totalMovements": 45000,
    "movementsLast30Days": 3200,
    "dbSize": "12.5 MB"
  }
}
```

---

## 11. Códigos de Error Comunes

| Código | Message | Cuándo |
|--------|---------|--------|
| `VALIDATION_ERROR` | "Datos de entrada inválidos" | express-validator falla |
| `UNAUTHORIZED` | "Token inválido o expirado" | JWT malformado, expirado, firma inválida |
| `FORBIDDEN` | "No tienes permisos para esta acción" | RBAC falla |
| `NOT_FOUND` | "Recurso no encontrado" | ID no existe o no pertenece al usuario |
| `CONFLICT` | "El recurso ya existe" | Email duplicado, nombre único violado |
| `CATEGORY_HAS_MOVEMENTS` | "No se puede eliminar: tiene movimientos asociados" | DELETE category/account con movimientos |
| `ACCOUNT_HAS_MOVEMENTS` | "No se puede eliminar: tiene movimientos asociados" | DELETE account con movimientos |
| `CATEGORY_TYPE_MISMATCH` | "El tipo de categoría no coincide con el tipo de movimiento" | Crear gasto con categoría de ingreso |
| `INSUFFICIENT_CREDIT` | "Límite de crédito excedido" | Gasto en tarjeta supera límite (opcional) |
| `TOKEN_EXPIRED` | "El token de reset ha expirado" | Reset password token > 1h |
| `RATE_LIMIT_EXCEEDED` | "Demasiadas solicitudes, intenta más tarde" | Rate limiting |

---

## 12. Ejemplos de Uso (cURL)

```bash
# Login
curl -X POST https://api.ejemplo.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@ejemplo.com","password":"Segura123!"}'

# Crear movimiento (con token)
curl -X POST https://api.ejemplo.com/api/v1/movements \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"expense","description":"Comida","amount":25.50,"categoryId":"cat_id","accountId":"acc_id","date":"2024-01-20"}'

# Listar movimientos con filtros
curl -G "https://api.ejemplo.com/api/v1/movements" \
  -H "Authorization: Bearer $TOKEN" \
  -d page=1 -d limit=20 -d type=expense -d startDate=2024-01-01 -d endDate=2024-01-31

# Exportar PDF
curl -G "https://api.ejemplo.com/api/v1/reports/export" \
  -H "Authorization: Bearer $TOKEN" \
  -d format=pdf -d year=2024 -d month=1 \
  --output reporte-enero-2024.pdf
```

---

## 13. Versionado y Deprecación

- **v1**: Actual, estable
- **Cambios breaking**: Nueva versión `/api/v2/`
- **Deprecación**: Header `Sunset: Sat, 01 Jan 2025 00:00:00 GMT` + 6 meses aviso
- **Changelog**: `/api/changelog` o docs

---

## 14. OpenAPI/Swagger

Archivo: `backend/docs/openapi.yaml` (generar con swagger-jsdoc)

Endpoints documentados con:
- Descripción
- Parámetros (path, query, body)
- Request/Response schemas
- Códigos de respuesta
- Ejemplos
- Security schemes (BearerAuth)