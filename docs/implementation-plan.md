# Plan de Implementación - Dashboard de Finanzas Personales

## 1. Metodología
- **SDD (Spec-Driven Development)**: Especificación → Arquitectura → Implementación fase a fase
- **Iterativo**: Cada fase entrega funcionalidad verificable
- **Tests First**: Tests críticos antes/durante implementación
- **Definition of Done**: Código + Tests + Docs + Lint pass

---

## 2. Fases de Desarrollo

### FASE 1: Análisis, Especificación y Arquitectura ✅ COMPLETADA
**Entregables:**
- [x] `docs/spec.md` - Especificación funcional y técnica
- [x] `docs/architecture.md` - Arquitectura del sistema
- [x] `docs/database.md` - Modelos MongoDB y relaciones
- [x] `docs/api.md` - Documentación endpoints REST
- [x] `docs/security.md` - Seguridad, JWT, RBAC, Multi-tenancy
- [x] `docs/implementation-plan.md` - Este documento

**Validación:** Revisión y aprobación del plan por stakeholder

---

### FASE 2: Configuración Backend y Conexión MongoDB Atlas
**Duración estimada:** 1-2 días

#### Tareas:
- [ ] 2.1 Inicializar proyecto backend (`npm init`, estructura directorios)
- [ ] 2.2 Instalar dependencias base: `express`, `mongoose`, `dotenv`, `cors`, `helmet`, `express-rate-limit`, `morgan`, `bcryptjs`, `jsonwebtoken`, `express-validator`, `nodemailer`, `uuid`
- [ ] 2.3 Instalar devDependencies: `jest`, `supertest`, `eslint`, `prettier`, `nodemon`, `cross-env`
- [ ] 2.4 Configurar `package.json` scripts: `dev`, `start`, `test`, `lint`, `format`
- [ ] 2.5 Crear `.env.example` con todas las variables requeridas
- [ ] 2.6 Configurar conexión MongoDB Atlas en `config/database.js`
- [ ] 2.7 Implementar `config/env.js` con validación (joi/zod) de variables obligatorias
- [ ] 2.8 Configurar `config/cors.js`, `config/helmet.js`, `config/rateLimit.js`
- [ ] 2.9 Crear `app.js` con middlewares globales y `server.js` entry point
- [ ] 2.10 Implementar health checks: `GET /health`, `GET /health/ready`
- [ ] 2.11 Configurar ESLint + Prettier (Airbnb base o similar)
- [ ] 2.12 Escribir test de integración: conexión DB, health checks
- [ ] 2.13 Ejecutar `npm run lint` y `npm test` → **PASS**

#### Criterios de Aceptación:
- `npm run dev` levanta servidor en puerto configurado
- Conexión MongoDB Atlas exitosa (logs muestran "Connected to MongoDB")
- `GET /health` retorna `{ status: 'ok', db: 'connected' }`
- Lint y tests pasan sin errores

---

### FASE 3: Modelos, Repositorios y Autenticación Básica
**Duración estimada:** 2-3 días

#### Tareas:
- [ ] 3.1 Crear modelos Mongoose: `User`, `Category`, `Account`, `Movement`, `Budget` (según `docs/database.md`)
- [ ] 3.2 Implementar índices, virtuals, methods, statics, hooks en cada modelo
- [ ] 3.3 Crear repositorios base: `BaseRepository` + específicos (`UserRepository`, `CategoryRepository`, `MovementRepository`, `AccountRepository`, `BudgetRepository`)
- [ ] 3.4 Implementar `AuthService`: `register`, `login`, `hashPassword`, `verifyPassword`, `generateToken`, `verifyToken`
- [ ] 3.5 Crear `AuthController` con endpoints: `POST /register`, `POST /login`, `GET /me`
- [ ] 3.6 Implementar `authMiddleware` (JWT verify + carga usuario)
- [ ] 3.7 Implementar validadores `authValidators` (express-validator)
- [ ] 3.8 Configurar rutas `authRoutes.js` con middlewares adecuados
- [ ] 3.9 Seed de categorías por defecto en `register` (llamar desde AuthService)
- [ ] 3.10 Tests unitarios: modelos (validaciones, virtuals), AuthService, repositorios
- [ ] 3.11 Tests integración: register → login → me flow
- [ ] 3.12 Ejecutar `npm run lint` y `npm test` → **PASS**

#### Criterios de Aceptación:
- Usuario puede registrarse (email único, password hasheado, categorías seed creadas)
- Usuario puede loguearse (retorna JWT + user data)
- `GET /me` con JWT válido retorna usuario sin passwordHash
- JWT expira en 24h, algoritmo HS256
- Tests cobertura ≥ 80% en auth

---

### FASE 4: Seguridad, JWT, RBAC y Multi-Tenancy
**Duración estimada:** 1-2 días

#### Tareas:
- [ ] 4.1 Implementar `rbacMiddleware.js` (`authorize(...roles)`)
- [ ] 4.2 Implementar `ownerFilterMiddleware.js` (inyecta `userId` en query/body)
- [ ] 4.3 Implementar `errorMiddleware.js` (centralizado, AppError class)
- [ ] 4.4 Implementar `validationMiddleware.js` (express-validator result handler)
- [ ] 4.5 Aplicar middlewares en orden correcto en `app.js`:
  ```
  helmet → cors → rateLimit → bodyParser → routes → 
  authenticate → ownerFilter → validators → controllers → errorHandler
  ```
- [ ] 4.6 Configurar rate limiting diferenciado: auth (10/min), api (100/min), export (20/h)
- [ ] 4.7 Implementar `forgot-password` y `reset-password` en AuthService/Controller
  - Token crypto.randomBytes(32), hash almacenado, expiración 1h
  - Nodemailer con plantilla HTML
  - Rate limit 3/hora por email/IP
- [ ] 4.8 Tests de seguridad:
  - Usuario A no accede a datos de Usuario B
  - RBAC: USER no accede /admin/*, ADMIN sí
  - Owner filter inyecta userId correctamente
  - Rate limiting bloquea tras límite
  - JWT expirado/inválido → 401
  - Reset password flow completo
- [ ] 4.9 Ejecutar `npm run lint` y `npm test` → **PASS**

#### Criterios de Aceptación:
- Aislamiento multi-usuario verificado por tests automatizados
- RBAC funcional: 403 en accesos no autorizados
- Rate limiting activo y probado
- Recuperación de contraseña end-to-end funcional (email mock en tests)
- Error handling consistente: formato estándar en todos los errores

---

### FASE 5: CRUD Categorías, Cuentas y Movimientos
**Duración estimada:** 3-4 días

#### Tareas:
- [ ] 5.1 **Categorías**: Service + Controller + Routes + Validators
  - CRUD completo
  - Validación: nombre único por usuario (activo), type enum, color hex
  - DELETE: validar sin movimientos asociados (409 si tiene)
  - POST `/categories/seed-defaults` idempotente
- [ ] 5.2 **Cuentas**: Service + Controller + Routes + Validators
  - CRUD completo
  - Tipos: cash, bank, savings, debit_card, credit_card, other
  - Validación: creditLimit requerido si credit_card
  - `currentBalance` calculado, método `recalculateBalance()`
  - DELETE: validar sin movimientos (409)
- [ ] 5.3 **Movimientos**: Service + Controller + Routes + Validators
  - CRUD completo con **transacciones MongoDB**
  - Validaciones cruzadas: category.type === movement.type, category/account pertenecen a user
  - Crear: actualiza Account.currentBalance + Budget.spent (si expense)
  - Actualizar: recalcula deltas en Account y Budget afectados
  - Eliminar (soft): revierte Account.currentBalance y Budget.spent
  - Listar con filtros: type, categoryId, accountId, date range, search, sort, pagination
  - GET `/movements/stats/summary` para dashboard
- [ ] 5.4 **Presupuestos**: Service + Controller + Routes + Validators
  - Upsert por userId+categoryId+year+month (unique index)
  - Virtuals: percentage, remaining, alertLevel
  - Static `recalculateSpent(budgetId)` desde movimientos
  - GET `/budgets/stats/summary` para alertas dashboard
- [ ] 5.5 Tests unitarios: services (lógica negocio, transacciones), validators
- [ ] 5.6 Tests integración: flujos CRUD completos, consistencia saldos/presupuestos
- [ ] 5.7 Tests de consistencia: crear→actualizar→eliminar movimiento verifica saldos
- [ ] 5.8 Ejecutar `npm run lint` y `npm test` → **PASS**

#### Criterios de Aceptación:
- CRUD completo funcional para 4 entidades
- Transacciones atómicas: movimiento + saldo cuenta + presupuesto
- Filtros y paginación en listados
- Soft delete implementado
- Consistencia financiera verificada: saldos = inicial + ingresos - gastos
- Tests cubren casos edge: categoría con movimientos, cuenta con movimientos, presupuestos

---

### FASE 6: Frontend - Configuración, Navegación y Diseño Visual
**Duración estimada:** 3-4 días

#### Tareas:
- [ ] 6.1 Inicializar frontend: `npm create vite@latest frontend -- --template react`
- [ ] 6.2 Instalar dependencias:
  - Core: `react-router-dom`, `axios`, `dayjs`
  - UI: `tailwindcss`, `postcss`, `autoprefixer`, `lucide-react`
  - Charts: `chart.js`, `react-chartjs-2`
  - Forms/Feedback: `react-hook-form`, `zod` + `@hookform/resolvers`, `sweetalert2`, `react-toastify`
  - Export: `xlsx`, `jspdf`, `jspdf-autotable`
  - Utils: `clsx`, `date-fns` (opcional)
- [ ] 6.3 Configurar Tailwind: `tailwind.config.js` (colores, fuentes, breakpoints, darkMode: 'class')
- [ ] 6.4 Estructura carpetas `src/` según `docs/architecture.md`
- [ ] 6.5 Configurar `axios` instance en `services/api.js`:
  - Base URL desde `import.meta.env.VITE_API_URL`
  - Interceptors: adjuntar token (desde AuthContext), manejar 401 → logout, errores estandarizados
- [ ] 6.6 **AuthContext**: `useAuth()` provee `user`, `token`, `login`, `register`, `logout`, `refreshUser`
- [ ] 6.7 **ToastContext**: `useToast()` para notificaciones globales
- [ ] 6.8 **Layouts**: `AuthLayout` (login/register), `MainLayout` (sidebar, header, outlet)
- [ ] 6.9 **Componentes UI Base** (en `components/ui/`):
  - Button, Input, Select, Textarea, Label, Card, Modal, Table, Pagination
  - Badge, Avatar, Dropdown, Tabs, Tooltip, Skeleton, EmptyState
  - ConfirmDialog (SweetAlert2 wrapper), LoadingSpinner
- [ ] 6.10 **Componentes Form**: FormField, CurrencyInput, DatePicker, CategorySelect, AccountSelect
- [ ] 6.11 **Rutas**: `AppRoutes.jsx` con `PrivateRoute` (protege con AuthContext)
  - Rutas auth: `/login`, `/register`, `/forgot-password`, `/reset-password/:token`
  - Rutas app: `/dashboard`, `/history`, `/categories`, `/accounts`, `/budgets`, `/settings`
- [ ] 6.12 **Páginas Auth**: LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage
  - Validación react-hook-form + zod
  - Estados loading, errores, toast feedback
- [ ] 6.13 **Diseño Visual** (Tailwind):
  - Paleta: slate/gray backgrounds, white surfaces, indigo primary, green income, red expense, amber warning
  - Sidebar colapsible, header con avatar/menú usuario
  - Responsive: sidebar drawer en móvil (<768px), tabla scroll horizontal
  - Dark mode: class strategy, persistir en localStorage + preferencias usuario
- [ ] 6.14 Tests componentes: render, interacciones básicas (vitest + testing-library)
- [ ] 6.15 Ejecutar `npm run lint` y `npm test` → **PASS**

#### Criterios de Aceptación:
- App arranca en `npm run dev` (Vite + React)
- Navegación entre páginas funcional
- Auth flow: register → login → dashboard → logout
- Protected routes redirigen a login si no autenticado
- UI responsive en 3 breakpoints (mobile, tablet, desktop)
- Dark/light mode toggle funcional
- Componentes base reutilizables y consistentes
- Lint y tests pasan

---

### FASE 7: Integración API y Gestión de Estados
**Duración estimada:** 2-3 días

#### Tareas:
- [ ] 7.1 **Custom Hooks** para cada dominio:
  - `useMovements(filters)`: list, create, update, delete, invalidate
  - `useCategories(type?)`: list, create, update, delete
  - `useAccounts()`: list, create, update, delete, recalculate
  - `useBudgets(month, year)`: list, upsert, delete
  - `useDashboard()`: summary, charts, recent
  - `useApi()`: wrapper genérico para peticiones
- [ ] 7.2 **Services API** (`services/*Api.js`): funciones tipadas para cada endpoint
- [ ] 7.3 **Estado Global**: React Context para datos compartidos (categorías, cuentas para selects)
- [ ] 7.4 **Página Historial** (`HistoryPage`):
  - Tabla con columnas: fecha, tipo, descripción, categoría, cuenta, importe, acciones
  - Filtros: search, type, category, account, date range (con DatePicker range)
  - Paginación, ordenamiento (click en headers)
  - Modal crear/editar movimiento (Form con CategorySelect, AccountSelect, CurrencyInput)
  - ConfirmDialog para eliminar
  - Skeleton loaders durante fetch
- [ ] 7.5 **Página Categorías** (`CategoriesPage`):
  - Tabs: Ingresos / Gastos
  - Lista con color, icono, contador movimientos
  - Modal crear/editar (color picker, icon picker Lucide)
  - Eliminar con validación (mostrar contador movimientos)
- [ ] 7.6 **Página Cuentas** (`AccountsPage`):
  - Grid de tarjetas: nombre, tipo, saldo actual, banco/últimos 4 dígitos
  - Modal crear/editar (campos condicionales según tipo)
  - Botón "Recalcular balance" (llama endpoint POST /accounts/:id/recalculate)
- [ ] 7.7 **Página Presupuestos** (`BudgetsPage`):
  - Selector mes/año
  - Lista tarjetas: categoría, budgeted, spent, remaining, progress bar
  - Colores progress: green <80%, yellow 80-89%, orange 90-99%, red ≥100%
  - Modal crear/editar presupuesto
- [ ] 7.8 Manejo de errores global: toast error con mensaje legible, retry en queries
- [ ] 7.9 Tests integración frontend: flujos CRUD contra API mock (MSW)
- [ ] 7.10 Ejecutar `npm run lint` y `npm test` → **PASS**

#### Criterios de Aceptación:
- Todas las páginas CRUD conectadas a API real
- Filtros, paginación, ordenamiento funcionan
- Modales crear/editar con validación client-side
- Estados loading, error, empty implementados
- Confirmaciones antes de eliminar
- Dark mode persistido
- Tests de integración pasan

---

### FASE 8: Dashboard y Gráficos Financieros
**Duración estimada:** 2-3 días

#### Tareas:
- [ ] 8.1 **Componentes Gráficos** (`components/charts/`):
  - `ChartWrapper`: responsive container, loading, error, empty states
  - `BarChart`: ingresos vs gastos mensual (agrupado)
  - `DoughnutChart`: distribución gastos por categoría
  - `LineChart`: evolución balance mensual
  - `HorizontalBarChart`: top 10 categorías gasto
  - Configuración común: colores tema, tooltips formateados, legendas, responsive
- [ ] 8.2 **DashboardPage**:
  - Grid responsivo: 4 tarjetas KPI (saldo, ingresos, gastos, balance)
  - Tarjeta comparativa mes anterior (flechas verde/rojo, % variación)
  - Fila gráficos: BarChart (12m) + DoughnutChart (mes actual)
  - Fila gráficos: LineChart (balance 12m) + HorizontalBarChart (top gastos)
  - Últimos 10 movimientos (tabla compacta, link a historial)
  - Selector período: mes actual / último mes / últimos 3m / 6m / 12m / personalizado
  - Actualización automática tras cambios (invalidar queries)
- [ ] 8.3 **Hook `useDashboard(period)`**: fetch paralelo summary + charts + recent
- [ ] 8.4 **Formateo**: `utils/format.js` → `formatCurrency`, `formatDate`, `formatPercent`, `formatCompactNumber`
- [ ] 8.5 Tests: render gráficos con datos mock, responsive, tooltips
- [ ] 8.6 Ejecutar `npm run lint` y `npm test` → **PASS**

#### Criterios de Aceptación:
- Dashboard carga en < 2s (skeleton → datos)
- 5 gráficos renderizados correctamente con datos reales
- Selector período actualiza todos los gráficos
- Tarjetas KPI muestran cálculos correctos (validar contra API)
- Colores semánticos: verde ingresos, rojo gastos, ámbar alertas
- Responsive: gráficos se redimensionan, tabla scroll en móvil
- Tooltips informativos en hover

---

### FASE 9: Presupuestos Avanzados y Reportes
**Duración estimada:** 1-2 días

#### Tareas:
- [ ] 9.1 **Presupuestos - Mejoras**:
  - Alertas visuales en dashboard (tarjeta "Presupuestos en alerta")
  - Notificación toast al crear gasto que dispara umbral 80/90/100%
  - Vista detalle presupuesto: movimientos de esa categoría en el mes
- [ ] 9.2 **Página Reportes** (`ReportsPage`):
  - Filtros idénticos a Historial (compartir hook `useReportFilters`)
  - Preview tabla movimientos filtrados
  - Resumen: ingresos, gastos, balance, top categorías
  - Botones: "Exportar PDF", "Exportar Excel"
  - Loading durante generación
- [ ] 9.3 Tests: alertas presupuestos, preview reportes
- [ ] 9.4 Ejecutar `npm run lint` y `npm test` → **PASS**

#### Criterios de Aceptación:
- Alertas presupuestos funcionan en tiempo real
- Página reportes muestra preview correcto
- Filtros sincronizados entre Historial y Reportes

---

### FASE 10: Exportación PDF y Excel
**Duración estimada:** 1-2 días

#### Tareas:
- [ ] 10.1 **Backend - ReportController/Service**:
  - `GET /reports/export?format=pdf|excel&filters...`
  - Generar PDF con `jsPDF` + `autotable`:
    - Portada: título, período, usuario, fecha generación
    - Resumen ejecutivo (KPIs)
    - Tabla movimientos (paginada en PDF)
    - Gráficos: opcional (requiere chartjs-to-image o similar, fase 2)
  - Generar Excel con `xlsx`:
    - Hoja 1: Resumen
    - Hoja 2: Movimientos (columnas completas)
    - Hoja 3: Por categoría
  - Streaming response (no guardar en disco)
- [ ] 10.2 **Frontend - Export Buttons**:
  - En ReportsPage y HistoryPage
  - `blob` download con filename `reporte-YYYY-MM.pdf/xlsx`
  - Toast éxito/error
- [ ] 10.3 Tests: generar PDF/Excel con datos, verificar estructura básica
- [ ] 10.4 Ejecutar `npm run lint` y `npm test` → **PASS**

#### Criterios de Aceptación:
- PDF descargable, legible, con datos correctos
- Excel descargable, 3 hojas, datos correctos
- Filtros aplicados en exportación
- Filename con fecha/período
- No archivos temporales en servidor

---

### FASE 11: Recuperación de Contraseña y Notificaciones
**Duración estimada:** 1 día

#### Tareas:
- [ ] 11.1 **Backend** (completar si pendiente de Fase 4):
  - `POST /auth/forgot-password` → genera token, envía email (Nodemailer)
  - `POST /auth/reset-password` → valida token, actualiza password, invalida sesiones
  - Plantilla email HTML responsive (`templates/resetPassword.html`)
  - Rate limiting específico
- [ ] 11.2 **Frontend**:
  - `ForgotPasswordPage`: formulario email, feedback "revisa tu email"
  - `ResetPasswordPage`: leer token de query params, formulario nueva contraseña
  - Validación fuerza contraseña (zod schema compartido)
  - Redirigir a login con mensaje éxito
- [ ] 11.3 Configurar variables email en `.env`: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM`
- [ ] 11.4 Tests: flow completo con email mock (nodemailer-mock o ethereal)
- [ ] 11.5 Ejecutar `npm run lint` y `npm test` → **PASS**

#### Criterios de Aceptación:
- Usuario puede solicitar reset → recibe email (mock en test)
- Token expira en 1h, un solo uso
- Nueva contraseña válida → login funciona
- Rate limiting previene abuso

---

### FASE 12: Pruebas Integrales, Corrección de Errores y Documentación Final
**Duración estimada:** 2-3 días

#### Tareas:
- [ ] 12.1 **Tests E2E Críticos** (Cypress o Playwright):
  - Flujo completo: Register → Login → Dashboard → Crear movimiento → Historial → Presupuesto → Exportar → Logout
  - Multi-usuario: Usuario A crea datos, Usuario B no los ve
  - RBAC: ADMIN accede panel admin, USER no
  - Responsive: mobile, tablet, desktop
- [ ] 12.2 **Pruebas de Carga Básicas** (opcional, k6/artillery):
  - 50 usuarios concurrentes, 100 req/s en endpoints principales
  - Verificar latencia p95 < 500ms, 0% errores 5xx
- [ ] 12.3 **Revisión de Seguridad**:
  - Audit dependencies: `npm audit` → fix critical/high
  - Verificar headers Helmet en producción
  - Verificar CORS, rate limiting, JWT validation
  - Penetration testing básico: IDOR, NoSQLi, XSS
- [ ] 12.4 **Corrección de Bugs**: Priorizar P0 (blockers), P1 (major), P2 (minor)
- [ ] 12.5 **Documentación Final**:
  - Actualizar `docs/*.md` con decisiones finales
  - `README.md` root: setup, scripts, env, deploy
  - `backend/README.md`: arquitectura, scripts, testing
  - `frontend/README.md`: estructura, hooks, componentes, theming
  - OpenAPI spec: `backend/docs/openapi.yaml` (swagger-jsdoc)
- [ ] 12.6 **Build Producción**:
  - `frontend`: `npm run build` → dist/ optimizado
  - `backend`: verificar `NODE_ENV=production`
  - Dockerfile opcional para cada servicio
- [ ] 12.7 **Checklist Final** (todos ✅):
  - [ ] Frontend funcional
  - [ ] Backend funcional
  - [ ] MongoDB Atlas almacena datos
  - [ ] Registro/Login funcionan
  - [ ] JWT protege rutas privadas
  - [ ] RBAC funciona
  - [ ] Aislamiento multi-usuario comprobado
  - [ ] CRUDs conectados a API
  - [ ] Filtros funcionan
  - [ ] Dashboard calcula datos reales
  - [ ] Gráficos dinámicos
  - [ ] Presupuestos funcionan
  - [ ] Exportación PDF funciona
  - [ ] Exportación Excel funciona
  - [ ] Recuperación password funciona
  - [ ] Diseño responsive
  - [ ] Tests principales pasan
  - [ ] Documentación actualizada

---

## 3. Dependencias Entre Fases

```
FASE 1 (Specs) 
    │
    ▼
FASE 2 (Backend Setup) 
    │
    ▼
FASE 3 (Models + Auth) ◄──┐
    │                     │
    ▼                     │
FASE 4 (Security/RBAC) ───┤ (paralelo posible)
    │                     │
    ▼                     │
FASE 5 (CRUD Backend) ────┘
    │
    ▼
FASE 6 (Frontend Setup + UI) 
    │
    ▼
FASE 7 (Frontend Integration) ◄──┐
    │                             │
    ▼                             │
FASE 8 (Dashboard/Charts) ────────┤ (paralelo posible)
    │                             │
    ▼                             │
FASE 9 (Budgets/Reports) ─────────┘
    │
    ▼
FASE 10 (Export PDF/Excel)
    │
    ▼
FASE 11 (Password Reset)
    │
    ▼
FASE 12 (Testing + Docs + Polish)
```

---

## 4. Estimación de Esfuerzo Total

| Fase | Días | Acumulado |
|------|------|-----------|
| 1. Specs | 1 | 1 |
| 2. Backend Setup | 2 | 3 |
| 3. Models + Auth | 3 | 6 |
| 4. Security/RBAC | 2 | 8 |
| 5. CRUD Backend | 4 | 12 |
| 6. Frontend Setup + UI | 4 | 16 |
| 7. Frontend Integration | 3 | 19 |
| 8. Dashboard/Charts | 3 | 22 |
| 9. Budgets/Reports | 2 | 24 |
| 10. Export PDF/Excel | 2 | 26 |
| 11. Password Reset | 1 | 27 |
| 12. Testing + Docs | 3 | 30 |

**Total estimado: ~30 días laborables (6 semanas)**

---

## 5. Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Complejidad transacciones MongoDB | Media | Alto | Tests exhaustivos, patrones probados, revisión código |
| Gráficos Chart.js responsive | Media | Medio | Usar ChartWrapper probado, testear breakpoints |
| Email delivery en producción | Baja | Medio | Usar proveedor transaccional (SendGrid), logs, reintentos |
| Performance agregaciones dashboard | Media | Medio | Índices compuestos, paginación, caching futuro |
| Cambios de requisitos en marcha | Alta | Medio | SDD: specs firmes, cambios = nueva fase documentada |
| Inconsistencia frontend/backend | Media | Alto | Contrato API compartido (OpenAPI), tests integración |

---

## 6. Definición de Done (Por Fase)

Una fase se considera **DONE** cuando:
1. ✅ Código implementado según specs
2. ✅ Tests unitarios + integración pasan (cobertura ≥ 80% código nuevo)
3. ✅ `npm run lint` sin errores
4. ✅ `npm run build` (frontend) / `npm start` (backend) funcionan
5. ✅ Funcionalidad verificada manualmente en navegador
6. ✅ Documentación actualizada (`docs/` + READMEs)
7. ✅ Commits atómicos con mensajes convencionales (feat/fix/docs/test/chore)
8. ✅ Push a rama feature, PR aprobado (si aplica workflow)

---

## 7. Próximos Pasos Inmediatos

Tras aprobación de este plan:

1. **Iniciar FASE 2**: Configuración backend
2. **Setup repositorio Git**: `git init`, `.gitignore`, ramas `main` + `develop`
3. **CI/CD básico**: GitHub Actions con lint + test en PR
4. **MongoDB Atlas**: Crear cluster, usuario, IP whitelist, connection string
5. **Variables entorno**: Crear `.env` local (no commit), validar con `config/env.js`

---

## 8. Notas para el Equipo

- **No saltar fases**: Cada fase construye sobre la anterior
- **Tests no negociables**: Código sin tests no se mergea
- **Commits pequeños**: Facilita revisión y rollback
- **Pair programming**: Recomendado en Fases 3, 5, 8 (lógica compleja)
- **Code review**: Obligatorio en PRs, checklist seguridad
- **Daily standup**: 15min, sincronizar bloqueos
- **Retro semanal**: Mejorar proceso continuo