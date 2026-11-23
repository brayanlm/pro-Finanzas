# Arquitectura del Sistema - Dashboard de Finanzas Personales

## 1. Visión Arquitectónica

### 1.1 Estilo Arquitectónico
- **Patrón**: Arquitectura por capas (Layered Architecture) + Clean Architecture principles
- **Separación**: Frontend (SPA React) ↔ Backend (REST API) ↔ Database (MongoDB)
- **Comunicación**: HTTP/JSON sobre TLS
- **Despliegue**: Frontend (Vercel/Netlify/Vite build) + Backend (Node.js server) + MongoDB Atlas

### 1.2 Diagramas de Contexto

```
┌─────────────────┐     HTTPS/REST      ┌─────────────────┐     Mongoose      ┌──────────────┐
│   Frontend      │ ◄─────────────────► │    Backend      │ ◄────────────────► │  MongoDB     │
│   (React/Vite)  │   JWT + JSON        │  (Express.js)   │   ODM/Queries      │   Atlas      │
└─────────────────┘                     └─────────────────┘                    └──────────────┘
        │                                       │                                      │
        │                                       │                                      │
        ▼                                       ▼                                      ▼
   ┌─────────┐                            ┌─────────────┐                     ┌──────────────┐
   │ Browser │                            │  Node.js    │                     │  Replica Set │
   │  Local  │                            │  Process    │                     │  (3 nodes)   │
   │ Storage │                            │  (PM2/Docker)                       └──────────────┘
   └─────────┘                            └─────────────┘
```

---

## 2. Estructura de Directorios

### 2.1 Backend
```
backend/
├── src/
│   ├── config/           # Configuración centralizada
│   │   ├── database.js   # Conexión MongoDB
│   │   ├── env.js        # Validación variables entorno
│   │   ├── cors.js       # Config CORS
│   │   ├── helmet.js     # Config Helmet
│   │   └── rateLimit.js  # Config rate limiting
│   ├── controllers/      # Capa de presentación (HTTP)
│   │   ├── authController.js
│   │   ├── movementController.js
│   │   ├── categoryController.js
│   │   ├── accountController.js
│   │   ├── budgetController.js
│   │   ├── dashboardController.js
│   │   └── reportController.js
│   ├── services/         # Lógica de negocio
│   │   ├── authService.js
│   │   ├── movementService.js
│   │   ├── categoryService.js
│   │   ├── accountService.js
│   │   ├── budgetService.js
│   │   ├── dashboardService.js
│   │   └── reportService.js
│   ├── repositories/     # Acceso a datos
│   │   ├── userRepository.js
│   │   ├── movementRepository.js
│   │   ├── categoryRepository.js
│   │   ├── accountRepository.js
│   │   └── budgetRepository.js
│   ├── models/           # Modelos Mongoose
│   │   ├── User.js
│   │   ├── Movement.js
│   │   ├── Category.js
│   │   ├── Account.js
│   │   └── Budget.js
│   ├── routes/           # Definición de endpoints
│   │   ├── authRoutes.js
│   │   ├── movementRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── accountRoutes.js
│   │   ├── budgetRoutes.js
│   │   ├── dashboardRoutes.js
│   │   └── reportRoutes.js
│   ├── middlewares/      # Middlewares transversales
│   │   ├── authMiddleware.js
│   │   ├── rbacMiddleware.js
│   │   ├── validationMiddleware.js
│   │   ├── errorMiddleware.js
│   │   └── ownerFilterMiddleware.js
│   ├── validators/       # Reglas de validación (express-validator)
│   │   ├── authValidators.js
│   │   ├── movementValidators.js
│   │   ├── categoryValidators.js
│   │   ├── accountValidators.js
│   │   └── budgetValidators.js
│   ├── utils/            # Utilidades compartidas
│   │   ├── jwt.js
│   │   ├── password.js
│   │   ├── email.js
│   │   ├── date.js
│   │   ├── calculations.js
│   │   └── AppError.js
│   ├── templates/        # Plantillas email
│   │   └── resetPassword.html
│   ├── app.js            # Configuración Express
│   └── server.js         # Entry point
├── tests/                # Tests
│   ├── unit/
│   ├── integration/
│   └── setup.js
├── .env.example
├── .env                  # No commiteado
├── package.json
└── README.md
```

### 2.2 Frontend
```
frontend/
├── public/
├── src/
│   ├── assets/           # Imágenes, fuentes estáticas
│   ├── components/       # Componentes reutilizables
│   │   ├── ui/           # Componentes base (Button, Input, Modal, Card, Table, etc.)
│   │   ├── layout/       # Sidebar, Header, Footer, PageLayout
│   │   ├── charts/       # ChartBar, ChartDoughnut, ChartLine, ChartWrapper
│   │   ├── forms/        # FormField, Select, DatePicker, CurrencyInput
│   │   └── feedback/     # Toast, Alert, Skeleton, EmptyState, ConfirmDialog
│   ├── pages/            # Páginas (rutas principales)
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── ForgotPasswordPage.jsx
│   │   │   └── ResetPasswordPage.jsx
│   │   ├── dashboard/
│   │   │   └── DashboardPage.jsx
│   │   ├── history/
│   │   │   └── HistoryPage.jsx
│   │   ├── categories/
│   │   │   └── CategoriesPage.jsx
│   │   ├── accounts/
│   │   │   └── AccountsPage.jsx
│   │   ├── budgets/
│   │   │   └── BudgetsPage.jsx
│   │   └── settings/
│   │       └── SettingsPage.jsx
│   ├── layouts/          # Layouts de página
│   │   ├── AuthLayout.jsx
│   │   └── MainLayout.jsx
│   ├── hooks/            # Custom hooks
│   │   ├── useAuth.js
│   │   ├── useMovements.js
│   │   ├── useCategories.js
│   │   ├── useAccounts.js
│   │   ├── useBudgets.js
│   │   ├── useDashboard.js
│   │   └── useApi.js
│   ├── context/          # React Context
│   │   ├── AuthContext.jsx
│   │   └── ToastContext.jsx
│   ├── services/         # Cliente API
│   │   ├── api.js        # Axios instance + interceptors
│   │   ├── authApi.js
│   │   ├── movementApi.js
│   │   ├── categoryApi.js
│   │   ├── accountApi.js
│   │   ├── budgetApi.js
│   │   ├── dashboardApi.js
│   │   └── reportApi.js
│   ├── routes/           # Configuración React Router
│   │   ├── AppRoutes.jsx
│   │   ├── PrivateRoute.jsx
│   │   └── routeConfig.js
│   ├── utils/            # Utilidades frontend
│   │   ├── format.js     # formatCurrency, formatDate, etc.
│   │   ├── validation.js # Validaciones frontend
│   │   ├── constants.js  # Enums, constantes
│   │   └── helpers.js
│   ├── validators/       # Esquemas validación (Zod/Yup opcional)
│   ├── styles/           # Estilos globales
│   │   ├── index.css     # Tailwind imports + globals
│   │   └── variables.css
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example
└── README.md
```

---

## 3. Capas Arquitectónicas (Backend)

### 3.1 Flujo de Request
```
HTTP Request
    │
    ▼
┌─────────────────┐
│   Middlewares   │  ← Helmet, CORS, RateLimit, BodyParser
│   (Global)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Routes       │  ← Router Express, path matching
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Auth Middleware│  ← Validar JWT, adjuntar req.user
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  RBAC Middleware│  ← Verificar permisos (opcional por ruta)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Owner Filter   │  ← Inyectar userId en query params para repos
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Validators     │  ← express-validator rules
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Controller     │  ← HTTP handling, serialización, status codes
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Service       │  ← Business logic, orquestación, transacciones
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Repository     │  ← Data access, queries MongoDB, owner filtering
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Model        │  ← Mongoose schema, hooks, virtuals, methods
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MongoDB Atlas  │
└─────────────────┘
```

### 3.2 Responsabilidades por Capa

| Capa | Responsabilidad | No Debe |
|------|----------------|---------|
| **Controller** | HTTP protocol, request/response, status codes, serialization | Lógica de negocio, queries directas a BD |
| **Service** | Reglas de negocio, orquestación, transacciones, validaciones complejas | HTTP concerns, queries raw |
| **Repository** | Queries a BD, filtros de owner, paginación, proyecciones | Lógica de negocio, HTTP |
| **Model** | Schema, validaciones de esquema, hooks, virtuals, métodos de instancia | Queries complejas, lógica de aplicación |

---

## 4. Patrones de Diseño Aplicados

### 4.1 Repository Pattern
```javascript
// repositories/movementRepository.js
class MovementRepository {
  async findByUser(userId, filters = {}) { /* ... */ }
  async findByIdAndUser(id, userId) { /* ... */ }
  async create(data) { /* ... */ }
  async updateByIdAndUser(id, userId, data) { /* ... */ }
  async deleteByIdAndUser(id, userId) { /* ... */ }
  async getSummaryByUser(userId, period) { /* ... */ }
}
```

### 4.2 Service Layer con Transacciones
```javascript
// services/movementService.js
async function createMovement(userId, data) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const movement = await movementRepo.create({ ...data, userId }, session);
    await accountService.updateBalance(data.accountId, data.amount, data.type, session);
    await budgetService.updateSpent(data.categoryId, data.amount, session);
    await session.commitTransaction();
    return movement;
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
}
```

### 4.3 Middleware de Filtro de Propietario (Multi-tenancy)
```javascript
// middlewares/ownerFilterMiddleware.js
const ownerFilter = (req, res, next) => {
  // Inyectar userId en query para que repositorios filtren automáticamente
  req.query.userId = req.user.id;
  // Para rutas anidadas: /api/categories/:id/movements
  if (req.params.id && !req.query.categoryId) {
    req.query.categoryId = req.params.id;
  }
  next();
};
```

### 4.4 Error Handling Centralizado
```javascript
// middlewares/errorMiddleware.js
const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Error interno del servidor';
  // Log solo errores no operacionales
  if (!err.isOperational) logger.error(err);
  res.status(status).json({ success: false, message, ...(err.details && { details: err.details }) });
};
```

---

## 5. Seguridad en Arquitectura

### 5.1 Defense in Depth
```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENTE (Browser)                       │
│  - Validación UX                                            │
│  - Sanitización inputs                                      │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS + JWT (Authorization header)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    EDGE / REVERSE PROXY                     │
│  - Rate Limiting (nginx/Cloudflare)                         │
│  - WAF rules                                                │
│  - SSL Termination                                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  EXPRESS APP (Backend)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │  Helmet  │ │   CORS   │ │RateLimit │ │  Body Parser │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘   │
│       │            │            │             │             │
│       ▼            ▼            ▼             ▼             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              AUTH MIDDLEWARE (JWT Verify)            │   │
│  └──────────────────────────┬───────────────────────────┘   │
│                             │                                │
│                             ▼                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            RBAC + OWNER FILTER MIDDLEWARE            │   │
│  └──────────────────────────┬───────────────────────────┘   │
│                             │                                │
│                             ▼                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              VALIDATORS (express-validator)          │   │
│  └──────────────────────────┬───────────────────────────┘   │
│                             │                                │
│                             ▼                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │               CONTROLLER → SERVICE → REPO            │   │
│  │         (Owner filtering automático en Repo)         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Principios de Seguridad Aplicados
- **Zero Trust**: No confiar en `userId` del frontend, siempre del JWT.
- **Principio de Menor Privilegio**: USER solo accede a sus recursos.
- **Fail Secure**: Errores de auth/permiso → 401/403, no 500.
- **Audit Trail**: Logs de acciones sensibles (login, password change, delete).

---

## 6. Comunicación Frontend-Backend

### 6.1 Contrato API
- **Base URL**: `/api/v1`
- **Autenticación**: `Authorization: Bearer <JWT>`
- **Content-Type**: `application/json`
- **Respuesta Estándar**:
```json
// Éxito
{ "success": true, "data": {}, "meta": {} }

// Error
{ "success": false, "message": "", "details": [] }

// Paginación
{ "success": true, "data": [], "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }
```

### 6.2 Manejo de Tokens en Frontend
- **Access Token**: En memoria (variable React context), NO en localStorage.
- **Refresh Token**: HttpOnly Cookie (opcional, fase 2) o renovación silenciosa.
- **Interceptores Axios**: Adjuntar token, manejar 401 → logout automático.

---

## 7. Decisiones Técnicas Clave

| Decisión | Justificación |
|----------|---------------|
| **MongoDB + Mongoose** | Flexibilidad esquema, agregaciones potentes para dashboard, escalabilidad horizontal |
| **JWT Stateless** | Escalabilidad horizontal sin sticky sessions, simple para SPA |
| **bcrypt cost 12** | Balance seguridad/rendimiento (≈250ms/hash) |
| **Express-validator** | Validación declarativa, middleware nativo Express |
| **Tailwind CSS** | Utility-first, consistencia, bundle pequeño, dark mode nativo |
| **Chart.js + react-chartjs-2** | Maduro, tree-shakable, buena API React, tipos TypeScript |
| **Axios + Interceptors** | Cancelación, timeouts, interceptores request/response |
| **Vite** | Dev server rápido, HMR, build optimizado, plugin React oficial |
| **Owner filter middleware** | DRY: aislamiento multi-tenant en un solo lugar |
| **Service layer con transacciones** | Consistencia financiera (movimiento + saldo + presupuesto atómicos) |

---

## 8. Escalabilidad Futura

### 8.1 Multi-tenant (Organizaciones/Familias)
- Añadir `tenantId` a todos los modelos (índice compuesto: `tenantId + userId`).
- Middleware `tenantResolver` desde subdominio/header/JWT claim.
- Row-level security a nivel aplicación (ya implementado via owner filter).

### 8.2 Caching
- Redis para: sesiones, rate limiting distribuido, cache de dashboard (TTL 5min).

### 8.3 Background Jobs
- BullMQ/Redis para: emails, reportes programados, recálculos masivos.

### 8.4 Microservicios (Fase 3+)
- Separar: Auth Service, Transaction Service, Reporting Service, Notification Service.
- API Gateway (Kong/Express Gateway).
- Event-driven con RabbitMQ/Kafka.

---

## 9. Diagramas de Secuencia Clave

### 9.1 Crear Movimiento (con consistencia)
```
User → Frontend: Submit form
Frontend → API: POST /api/movements {type, amount, categoryId, accountId, ...}
API → AuthMiddleware: Verify JWT → req.user = {id, role}
API → OwnerFilter: req.query.userId = req.user.id
API → Validators: Validate input
API → MovementController: create(req, res)
Controller → MovementService: createMovement(userId, data)
Service → MovementRepo: create({...data, userId}, session)
Service → AccountService: updateBalance(accountId, amount, type, session)
Service → BudgetService: updateSpent(categoryId, amount, session)
Service → Session: commitTransaction
Service → Controller: movement
Controller → Frontend: 201 {success: true, data: movement}
Frontend → User: Toast success, update UI
```

### 9.2 Dashboard Load
```
User → Frontend: Navigate /dashboard
Frontend → API: Parallel requests
  ├─ GET /api/dashboard/summary
  ├─ GET /api/dashboard/charts?period=12m
  └─ GET /api/movements?limit=10&sort=-date
API → DashboardService: getSummary(userId), getChartsData(userId), getRecent(userId)
Service → Repositories: Aggregations + queries
API → Frontend: 3 responses
Frontend → User: Render cards, charts, table (skeleton → data)
```

---

## 10. Convenciones de Código

### 10.1 Backend
- **Archivos**: PascalCase para clases (`MovementService.js`), camelCase para funciones (`authMiddleware.js`)
- **Variables**: camelCase, descriptivas (`userId`, `movementData`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_PAGE_SIZE`, `JWT_EXPIRES_IN`)
- **Async/await** obligatorio, try/catch en controllers
- **JSDoc** en funciones públicas de services/repositories

### 10.2 Frontend
- **Componentes**: PascalCase (`MovementForm.jsx`, `ChartBar.jsx`)
- **Hooks**: camelCase con prefijo `use` (`useMovements.js`)
- **Servicios API**: camelCase con sufijo `Api` (`movementApi.js`)
- **Contextos**: PascalCase con sufijo `Context` (`AuthContext.jsx`)
- **Estilos**: Tailwind utility classes, `@apply` solo en `index.css`

---

## 11. Observabilidad

### 11.1 Logging (Winston/Pino)
- Niveles: error, warn, info, http, debug
- Formato JSON para agregación
- Correlation ID (request-id) en todos los logs

### 11.2 Métricas Clave
- Latencia p50/p95/p99 por endpoint
- Error rate por tipo (4xx vs 5xx)
- Active users, movements/day
- DB query performance (slow queries > 100ms)

### 11.3 Health Checks
- `GET /health` → `{ status: 'ok', db: 'connected', uptime: 12345 }`
- `GET /health/ready` → Verifica DB conexión pool

---

## 12. CI/CD Pipeline (Referencia)

```yaml
# .github/workflows/ci.yml
stages:
  - lint: eslint + prettier
  - typecheck: tsc --noEmit (si TypeScript) / jshint
  - test:unit: jest --coverage
  - test:integration: jest --testPathPattern=integration
  - build:frontend: npm run build
  - build:backend: npm run build (si aplica)
  - docker:build+push
  - deploy:staging
  - test:e2e: cypress
  - deploy:production (manual approval)
```

---

## 13. Checklist de Revisión Arquitectónica

- [ ] Separación estricta Controller/Service/Repository
- [ ] Owner filter middleware en todas las rutas privadas
- [ ] Validación en backend (no solo frontend)
- [ ] Transacciones para operaciones multi-entidad
- [ ] Índices MongoDB definidos en modelos
- [ ] Error handling centralizado
- [ ] Rate limiting en auth y API
- [ ] CORS restringido a FRONTEND_URL
- [ ] Helmet configurado
- [ ] Variables de entorno validadas al inicio
- [ ] Health checks implementados
- [ ] Logging estructurado
- [ ] Documentación API (OpenAPI/Swagger)