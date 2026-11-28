# Dashboard de Finanzas Personales

Aplicación web completa para gestión de finanzas personales con arquitectura preparada para SaaS **multi-tenant** (aislamiento de datos por `userId`), seguridad reforzada y **precisión monetaria**. Proyecto académico; conserva **React + Vite + Tailwind**, **Node.js + Express** y **MongoDB**.

---

## 1. Tecnologías

### Frontend (`frontend/`)
- **React 18 + Vite 5**
- **Tailwind CSS** (diseño responsive, dark mode), `clsx`
- **React Router DOM v6** (rutas públicas + `PrivateRoute` protegidas)
- **Axios** (instancia única `services/api.js` con interceptores JWT)
- **Chart.js + react-chartjs-2**
- **React Hook Form + Zod** (formularios + validación)
- **SweetAlert2 + React Toastify**
- **Lucide React** (iconos; rutas con `React.lazy` + `Suspense`, código dividido por ruta)
- **Vitest + Testing Library**
- **Exportación PDF/XLSX vía backend** (`GET /api/v1/reports/export`; frontend no incluye `jspdf`/`xlsx`)

### Backend (`backend/`)
- **Node.js 18+ (Node 24 verificado) + Express 5** (ESM `"type":"module"`)
- **MongoDB + Mongoose 9** (Atlas `mongodb+srv` o local; **transacciones → replica set**)
- **JWT (`jsonwebtoken`, HS256)** + **bcryptjs** (hashing seguro)
- **Zod** (validación de entorno al arrancar) + **express-validator** + sanitización anti **NoSQL injection**
- **Helmet**, **CORS**, **express-rate-limit**, respuestas HTTP estandarizadas, manejo centralizado de errores
- **Nodemailer** (recuperación de contraseña por email; SMTP opcional)
- **Jest 30 + Supertest** (unit + integración; **ESM vía `--experimental-vm-modules`**)
- **`mongodb-memory-server` `MongoMemoryReplSet`** (integración sobre replica set efímero aislado; transacciones soportadas)

---

## 2. Arquitectura

Monorepo de dos paquetes independientes (sin workspaces de npm):

```
proyecto/
├── .gitignore
├── README.md
├── docs/                      # Especificación SDD (spec, architecture, database, api, security, implementation-plan)
├── backend/
│   ├── .env                   # local, IGNORADO por git
│   ├── .env.example           # plantilla sin secretos
│   ├── scripts/seed.js        # seed seguro e idempotente (no borra datos)
│   ├── src/
│   │   ├── app.js             # app Express (helmet/cors/morgan/rate-limit/sanitize/health/routes/error handler)
│   │   ├── server.js          # arranque + validación de env + graceful shutdown
│   │   ├── config/            # env.js (zod), database.js, cors, helmet, rateLimit
│   │   ├── routes/            # un router por recurso
│   │   ├── controllers/       # lógica HTTP + dominio (async/await → next(error))
│   │   ├── repositories/      # BaseRepository + acceso a Mongoose
│   │   ├── models/            # User, Account, Category, Movement, Budget
│   │   ├── middlewares/       # auth, rbac, ownerFilter, validation, error
│   │   ├── validators/        # express-validator
│   │   └── utils/             # AppError, jwt, password, money, calculations, date, email
│   └── tests/                 # unit/ + integration/ (setup.js aísla la DB de test)
└── frontend/
    ├── .env                   # local, IGNORADO por git
    ├── .env.example           # VITE_API_URL
    ├── vite.config.js         # proxy /api → localhost:3000, test Vitest
    └── src/
        ├── services/          # api.js + *Api.js (HTTP centralizado)
        ├── context/           # AuthContext, ToastContext
        ├── routes/            # AppRoutes (PrivateRoute/PublicRoute)
        ├── hooks/             # useMovements, useAccounts, ... (loading/error/refetch)
        ├── components/        # ui/ reutilizables + charts + layout
        ├── pages/             # dashboard, history, categories, accounts, budgets, reports, settings, auth
        ├── layouts/           # MainLayout, AuthLayout
        ├── validators/        # zod schemas
        └── styles/            # index.css + Tailwind
```

**Backend en capas:** `routes → middlewares (auth/validación) → controllers → repositories → models`. Errores con `AppError` + handler centralizado; respuestas `{ success, data | message, code?, details? }`.

**Frontend:** SPA; `api.js` pone `Authorization: Bearer`, maneja `401`, normaliza errores; `VITE_API_URL` + proxy Vite.

---

## 3. Requisitos

- **Node.js 18+** (recomendado **Node 24**) y **npm**. En Windows, **PowerShell**.
- **MongoDB** con soporte de **transacciones → replica set**:
  - **MongoDB Atlas** (M0 gratis ya es replica set) **o**
  - **MongoDB local** `mongod --replSet rs0` + `rs.initiate()`.
- **SMTP** opcional para emails de recuperación (Gmail app password, SendGrid, Ethereal, etc.).

> ⚠️ Los **movimientos usan transacciones** (`mongoose.startSession()` + `session.withTransaction(...)`, `session` propagada, `session.endSession()`, reintentos controlados `TransientTransactionError`/`UnknownTransactionCommitResult`, recompute-from-scratch idempotente). Un `mongod` **standalone** no soporta transacciones; usa **replica set** o **Atlas**. **No se permiten retiros (expense) superiores al saldo disponible** (`INSUFFICIENT_FUNDS` 422).

---

## 4. Instalación y configuración

```powershell
git clone <repo> proyecto
cd proyecto

# Backend
cd backend
npm install
Copy-Item .env.example .env        # si no existe .env

# Frontend (otra terminal)
cd ..\frontend
npm install
Copy-Item .env.example .env        # si no existe .env
```

### Backend `.env` (no subirlo a git)
```env
PORT=3000
NODE_ENV=development

# MongoDB Atlas: usuario con readWriteAnyDatabase@admin.
# authSource=admin es CLAVE para evitar "bad auth : authentication failed".
MONGODB_URI=mongodb+srv://USUARIO:PASSWORD@CLUSTER.mongodb.net/finanzas?retryWrites=true&w=majority&authSource=admin
# MongoDB local (replica set):
# MONGODB_URI=mongodb://127.0.0.1:27017/finanzas?replicaSet=rs0

# JWT — generar secreto criptográfico (mín. 32 chars):
JWT_SECRET=GENERA_UN_SECRETO_ALEATORIO
JWT_EXPIRES_IN=24h
JWT_ISSUER=finanzas-app
JWT_AUDIENCE=finanzas-app-users

FRONTEND_URL=http://localhost:5173

# Email (opcional)
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_USER=test@ethereal.email
EMAIL_PASSWORD=test
EMAIL_FROM=Finanzas App <noreply@finanzas.app>

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX=10
RATE_LIMIT_EXPORT_MAX=20
RATE_LIMIT_EXPORT_WINDOW_MS=3600000
```

Generar `JWT_SECRET` seguro (no se imprime en logs del proyecto; aquí lo muestras tú):
```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:3000/api/v1
```

### Variables de entorno de MongoDB Atlas (resumen)
1. **Database Access** → crear usuario (respeta mayúsculas), rol **Read and write to any database** (`readWriteAnyDatabase@admin`). Si la contraseña tiene `@ : / ? # [ ]`, **URL-encodearla**.
2. **Network Access** → **añadir tu IP** (o `0.0.0.0/0` solo para pruebas).
3. Cadena `mongodb+srv://USUARIO:PASSWORD@CLUSTER.mongodb.net/finanzas?retryWrites=true&w=majority&authSource=admin`.

---

## 5. Ejecutar

**Desarrollo** — dos terminales PowerShell:

```powershell
# Terminal 1 — Backend → http://localhost:3000  (API /api/v1, health /health, /health/ready)
cd backend
npm run dev

# Terminal 2 — Frontend → http://localhost:5173
cd frontend
npm run dev
```

- **Backend:** `http://localhost:3000`
- **Frontend:** `http://localhost:5173`
- **API base:** `http://localhost:3000/api/v1`
- **Health:** `http://localhost:3000/health` y `http://localhost:3000/health/ready` (`database: connected`)

**Producción:**
```powershell
cd backend; npm start
cd frontend; npm run build        # genera dist/ (vacía outDir)
# servir frontend/dist con Nginx/Vercel/Netlify + VITE_API_URL a la API en producción
# backend: PM2 o Docker; NODE_ENV=production
```

**Seed seguro** (no borra; crea categorías por defecto + cuenta "Efectivo" solo si faltan):
```powershell
cd backend; npm run db:seed
```

**Proxy Vite** (`frontend/vite.config.js`): `/api` → `http://localhost:3000`, puerto `5173`.

---

## 6. Scripts

### Backend
```powershell
npm run dev                 # nodemon desarrollo
npm start                   # producción
npm test                    # Jest unit + integración + coverage (ESM) + --runInBand
npm run test:unit
npm run test:integration    # integración en MongoMemoryReplSet efímero aislado; NUNCA Atlas producción
npm run test:watch
npm run lint
npm run lint:fix
npm run format
npm run db:seed
```

### Frontend
```powershell
npm run dev
npm run build
npm run preview
npm test                    # Vitest
npm run test:watch
npm run lint
npm run lint:fix
npm run format
```

---

## 7. Endpoints API (`/api/v1`)

| Recurso | Rutas |
|---|---|
| Health | `GET /health`, `GET /health/ready` |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `PUT /auth/me`, `PUT /auth/me/password`, `POST /auth/forgot-password`, `POST /auth/reset-password` |
| Categorías | `GET/POST /categories`, `GET/PUT/DELETE /categories/:id`, `POST /categories/seed-defaults` |
| Cuentas | `GET/POST /accounts`, `GET/PUT/DELETE /accounts/:id`, `POST /accounts/:id/recalculate` |
| Movimientos | `GET/POST /movements`, `GET/PUT/DELETE /movements/:id`, `GET /movements/stats/summary` |
| Presupuestos | `GET/POST /budgets`, `GET /budgets/stats/summary`, `GET/PUT/DELETE /budgets/:id` |
| Dashboard | `GET /dashboard/summary`, `GET /dashboard/charts` |
| Reportes | `GET /reports/export`, `GET /reports/movements` |
| Admin (ADMIN) | `GET /admin/users`, `GET /admin/users/:id`, `PUT /admin/users/:id`, `DELETE /admin/users/:id`, `GET /admin/stats` |

**Movimientos**: `{ type: 'income'|'expense', description, amount (>0, 2 dec), categoryId, accountId, date (ISO), notes?, idempotencyKey? }`. Respuesta `{ success, data }`. Saldo se **recalcula atómicamente**. `idempotencyKey` evita duplicados. Errores `{ success:false, message, code, details? }`. Auth `Authorization: Bearer <JWT>`. Todos los datos se filtran por `userId` del token (multi-tenant); `ADMIN` vía RBAC. Ver `docs/api.md`.

---

## 8. Seguridad

- **JWT**: HS256, `issuer`/`audience`, `expiresIn`, `algorithms:['HS256']`, verificación estricta; `JWT_SECRET` ≥32 criptográfico. Password reset token **sha256 + expiración + uso único**. Logout invalida cliente; (recomendado producción: blocklist/refresh).
- **Passwords**: `bcryptjs` (12 rounds), `passwordHash` `select:false`, nunca se devuelven secretos; validación de fortaleza.
- **CORS** restringido a `FRONTEND_URL`; **Helmet** (CSP, HSTS, noSniff, frameguard, referrer); **rate limiting** global + auth + export.
- **Validación**: `express-validator` + `zod`; sanitización **anti NoSQL injection** (`$`/dotted keys); `escapeRegExp` en `$regex`; `CastError`/`ValidationError` mapeados; no se refleja `value`.
- **Multi-tenant**: `req.user.id`, `ownerFilter`, `findByIdAndUser`, `userId` forzado; **RBAC** `USER/ADMIN`.
- **`.env`** ignorado; `.env.example` sin secretos; **secretos fuera de git** (rotar + purgar historial si se expuso).
- **Errores**: no se filtra info interna; logging sin credenciales; **no conectar tests a Atlas** (salvaguarda `NODE_ENV=test`).

### Precisión monetaria
`amount`/saldos `Number` con **redondeo a 2 decimales** (`utils/money.js`, `roundMoney`, `toCents`, `sumMoney`); **rechazo `NaN/Infinity`/≤0**; saldo **recalculado desde movimientos** (`recalculateBalance`, atómico en transacción); `spent` recalculado (`recalculateSpent`); **no `float` suelto**. Para garantía absoluta se recomienda migrar a **enteros en céntimos** o **`mongoose.Decimal128`** (requiere migración de datos; no se hizo para no alterar datos existentes).

### Integridad financiera / atomicidad
Transacciones MongoDB (`startSession`/`commitTransaction`/`abortTransaction`, `session` propagada); validación `amount>0`, `category.type===type`, propiedad multi-tenant de cuenta/categoría; **anti-duplicado `idempotencyKey`** (único parcial); saldos y presupuestos recalculados; soft delete (no se destruye historial); **nada se borra de la BD por estos cambios**.

---

## 9. Git

`.gitignore` excluye `.env`/`.env.*`, `node_modules/`, `dist/`, `build/`, `coverage/`, `out/`, `.next/`, `.vite/`, `.cache/`, `tmp/`, `temp/`, logs, `*.log`, `.DS_Store`, `Thumbs.db`, `Desktop.ini`, `.idea/`, `.vscode/*`…, conserva `.env.example`. `backend/.env`, `node_modules`, `frontend/dist` **no se trackean** (`git rm --cached`, sin borrar físicamente). **No commits automáticos.** **No `push --force`, no reescribir historial.**

**Si se commitearon secretos:** rotar secretos, `git rm --cached`, añadir `.gitignore`, y purgar historial (consentimiento del equipo + backup):
```powershell
git filter-repo --invert-paths --path backend/.env     # o BFG: java -jar bfg.jar --delete-files .env
# git push --force (SOLO con autorización + equipo + backup)
```
Detección de secretos en historial **sin imprimir valores** (recomendado `gitleaks`/`trufflehog`).

---

## 10. Solución de problemas frecuentes

| Síntoma | Causa / Solución |
|---|---|
| `MongoDB connection error: bad auth : authentication failed` (code 8000 `AtlasError`) | Credenciales. **Añadir `&authSource=admin`.** Usuario con `readWriteAnyDatabase@admin`. Respetar mayúscula `Finanzas`. Revisar `Network Access`. URL-encodear contraseña con caracteres especiales. Confirmar cluster `mongodb+srv://...tpu9jse...`. |
| `querySrv ENOTFOUND` / `Could not connect to any servers` | DNS/SRV o Network Access. `mongodb+srv`. `Resolve-DnsName <cluster> -Type SRV`. Añadir IP. |
| `Transaction numbers are only allowed on a replica set member or mongos` | `mongod` standalone. Usa **replica set** o **Atlas**. |
| `Must use import to load ES Module` (Jest) | Proyecto ESM + Jest. El script `test` usa **`node --experimental-vm-modules node_modules/jest/bin/jest.js`**. |
| `Cannot find module 'dayjs'` | Dependencia declarada en `backend/package.json`. `npm install`. |
| `npm run db:seed` | `backend/scripts/seed.js` existe; requiere `MONGODB_URI`. No borra datos. |
| `Invalid environment configuration` | Faltan/ inválidas vars `.env`. `MONGODB_URI` (`mongodb*`), `JWT_SECRET` (≥32), `FRONTEND_URL`, `EMAIL_*`, `PORT`. |
| `npm audit` (moderate/high) | Revisar antes de `npm audit fix`. **No `audit fix --force`.** `frontend audit; `xlsx`/`jspdf` frontend removidos; backend Excel con `exceljs`; `nodemon` devDep. Ver sección `npm audit`. |
| `/health` ok pero `/health/ready` 503 | `mongoose.connection.readyState!==1`. Revisar `MONGODB_URI`/red. |
| Frontend no llama API | `VITE_API_URL=http://localhost:3000/api/v1`. Backend `FRONTEND_URL`. Proxy Vite. `npm run dev` ambos. |
| `vitest` no encuentra tests / JSX en `.js` | `test.include` `src/**/*.test` + `tests/**/*.test`; JSX solo en `.jsx`. |

---

## 11. `npm audit`

Ejecutado **sin** `--force`, sin `audit fix --force`, sin `npm audit fix` destructivo.

**Resultado real:**
- **Backend producción** (`npm audit --omit=dev`): **0 vulnerabilidades**.
- **Backend completo**: **19 moderate, solo devDependencies** (`glob`/`minimatch` ← `jest@30`, `nodemon`, `test-exclude`, `babel-jest`); requiere `--force` (`jest@29.7.0`/`nodemon@3.1.11` **breaking**) → **no aplicado**. Dev-only.
- **Frontend** (`npm audit` + `--omit=dev`): **0 vulnerabilidades** tras actualizar `zod@4.6.7`, `@hookform/resolvers@7`, `react-router-dom@7.18.7`, `vite@8.4.0`, `vitest@5.1.2`, `@vitejs/plugin-react@6`, remover `xlsx`/`jspdf`/`jspdf-autotable`, y `overrides`.

**Exportación:** PDF (`pdfkit`) + Excel restaurado con **`exceljs`**; **`xlsx`/SheetJS removido**; no se incluye información de otros usuarios.

**Actualizaciones aplicadas:** `npm update` (semver seguro) + ajustes de API (`returnDocument`, `manualChunks(id)`, `import.meta.dirname`, React Router 7, Vite 8/rolldown, Zod 4, Vitest 5). **No `audit fix --force`, no breaking no verificado.** Re-verificar lint+tests+build tras actualizar.

---

## 12. Documentación SDD

Ver `docs/`: `spec.md`, `architecture.md`, `database.md`, `api.md`, `security.md`, `implementation-plan.md`.

## Licencia

Proyecto académico — Dashboard de Finanzas Personales.


---

## 13. Entorno de pruebas aislado + protección obligatoria contra datos reales

**Objetivo:** las pruebas **nunca** tocan producción (`finanzas`/Atlas). No se borran datos/índices de Atlas. No hay fallback a `.env` de producción.

### Aislamiento
- **Jest**: `setupFilesAfterEnv: tests/setup.js`, `globalSetup`/`globalTeardown`, `testEnvironment: node`, `testMatch`, `testTimeout`, y **`--runInBand`** en `npm test` + `test:integration`.
- **`tests/globalSetup.js`**: `mongodb-memory-server` **`MongoMemoryReplSet`** (replica set 1 nodo, `wiredTiger`, db `finanzas_test`; transacciones OK) **efímero**; publica URI en **archivo temporal EXCLUSIVO por ejecución** (`mkdtempSync`, `pid`, `TEST_MONGO_URI_FILE`); `process.env` propagado a workers; `globalTeardown` cierra `replSet.stop()`, `mongoose.disconnect()`, `session.endSession()`, limpia temporales.
- **Sin memoria para unitarios**: pruebas unitarias que no necesitan BD no inician MongoDB en memoria; sin BD de test no se usa producción.
- **Instancia independiente** opcional `TEST_MONGODB_URI` (BD `finanzas_test`, no producción).
- **`tests/setup.js`**: síncrono antes de importar app/conectar; `NODE_ENV=test`, limpia herencia `MONGODB_URI`, no carga `.env` prod (`env.js` usa `.env.test`, `override:false`), secretos **dummy**, rate-limit altos en test (protección intacta en dev/prod).
- **`.env.test`** opcional; **`.env.test.example`** sin secretos; **`.env.example`** sin secretos. `.env*` ignorado por git excepto `*.example`. `node_modules`, `dist`, `build`, `coverage`, `out`, `tmp`, `temp`, logs ignorados. No se commitea nada.

### `src/config/dbSafety.js` (obligatorio; no se confía solo en `NODE_ENV=test`)
- `PRODUCTION_DB_NAMES` (`finanzas`, `finanzas_prod`, `finanzas_production`, `production`, `prod`, `PRODUCTION_DB_NAMES`); reservados `admin/local/config`.
- **Allowlist** `authorizedTestDbNames()` (`finanzas_test`, `TEST_DB_ALLOWLIST`); producción no autorizable.
- `assertSafeTestConnectionUri` (pre-conexión) + `assertTestDatabaseIsolated(mongoose)` (post-conexión): `readyState===1`, **nombre REAL conectado**, no prod, allowlist, host no `mongodb+srv`/`*.mongodb.net`/Atlas, no reutilizar `MONGODB_URI` de producción, **no fallback producción**; `connectDB` desconecta + `throw` si no cumple.
- `tests/helpers/safeClean.js` `safeCleanTestDatabase(mongoose, cols)`: re-verifica aislamiento; solo `deleteMany` en BD de test; **nunca `dropDatabase`, `dropIndex`, `syncIndexes`, `drop`**; solo colecciones de app; **no toca índices ni datos reales**.
- `.env.test.example` documenta todo.

### `.env` producción
No se modifican credenciales. Testing usa env **dummy** (`JWT_SECRET` test, `EMAIL_*`, `FRONTEND_URL`, `mongodb://127.0.0.1:*`/memoria `finanzas_test`).

### Concurrencia
Varias ejecuciones de Jest simultáneas no colisionan (dir temp exclusivo por ejecución; `--runInBand`; no comparten estado de rate limiting). Ejecutar `lint → test:unit → test:integration → npm test` **secuencialmente**.

### Verificación real
`npm run lint`, `npm run test:unit`, `npm run test:integration`, `npm test` (backend, seq.); `npm run lint`, `npm test`, `npm run build` (frontend); `GET /health`; `localhost:3000` + `localhost:5173`; Atlas conectado en desarrollo; Nodemon estable. **No producción en pruebas.**