# Especificación Funcional y Técnica - Dashboard de Finanzas Personales

## 1. Visión General

### 1.1 Propósito
Desarrollar una aplicación web completa para la gestión de finanzas personales que permita a los usuarios registrar, administrar, consultar y analizar sus ingresos y gastos, con una arquitectura preparada para evolución hacia modelo SaaS multi-tenant.

### 1.2 Alcance
- **Incluido**: Autenticación completa, dashboard financiero, CRUD de movimientos/categorías/cuentas, presupuestos, reportes, exportaciones, gráficos interactivos.
- **Excluido (Fase 1)**: Sincronización bancaria, facturación, impuestos, inversión, multi-moneda, app móvil nativa.

### 1.3 Usuarios Objetivo
- Usuarios individuales que buscan control financiero personal.
- Futuro: Núcleos familiares/organizaciones (preparación multi-tenant).

---

## 2. Requisitos Funcionales

### RF-01: Autenticación y Gestión de Usuarios
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-01.1 | Registro de usuario con email y contraseña | Alta |
| RF-01.2 | Inicio de sesión con JWT | Alta |
| RF-01.3 | Cierre de sesión | Alta |
| RF-01.4 | Recuperación de contraseña vía email (token temporal) | Alta |
| RF-01.5 | Restablecimiento de contraseña con validación de token | Alta |
| RF-01.6 | Contraseñas hasheadas con bcrypt (cost ≥ 12) | Alta |
| RF-01.7 | Validación de email único | Alta |
| RF-01.8 | Validación de contraseña segura (mín 8 chars, mayúscula, número, símbolo) | Alta |

### RF-02: Dashboard Financiero
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-02.1 | Mostrar saldo disponible (ingresos - gastos) | Alta |
| RF-02.2 | Total ingresos del mes actual | Alta |
| RF-02.3 | Total gastos del mes actual | Alta |
| RF-02.4 | Balance mensual (ingresos - gastos) | Alta |
| RF-02.5 | Porcentaje gastos/ingresos | Alta |
| RF-02.6 | Comparación con mes anterior (variación %) | Alta |
| RF-02.7 | Últimos 10 movimientos registrados | Alta |
| RF-02.8 | Distribución de gastos por categoría (gráfico) | Alta |
| RF-02.9 | Evolución mensual ingresos/gastos (últimos 12 meses) | Alta |
| RF-02.10 | Indicadores actualizados en tiempo real tras cada operación | Alta |

### RF-03: Gestión de Movimientos (Ingresos/Gastos)
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-03.1 | Crear movimiento (tipo, descripción, importe, categoría, cuenta, fecha, notas) | Alta |
| RF-03.2 | Listar movimientos con paginación | Alta |
| RF-03.3 | Obtener detalle de un movimiento | Alta |
| RF-03.4 | Actualizar movimiento | Alta |
| RF-03.5 | Eliminar movimiento (soft delete preferido) | Alta |
| RF-03.6 | Validar importe > 0 | Alta |
| RF-03.7 | Validar categoría pertenece al usuario y tipo coincide | Alta |
| RF-03.8 | Validar cuenta pertenece al usuario | Alta |

### RF-04: Categorías
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-04.1 | CRUD completo de categorías | Alta |
| RF-04.2 | Categoría: nombre, tipo (ingreso/gasto), color, icono | Alta |
| RF-04.3 | Categorías por defecto del sistema (seed) | Media |
| RF-04.4 | Impedir eliminación si tiene movimientos asociados (o reasignar) | Alta |
| RF-04.5 | Categorías propias del usuario + sistema | Alta |

### RF-05: Cuentas y Medios de Pago
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-05.1 | CRUD de cuentas | Alta |
| RF-05.2 | Tipos: efectivo, banco, ahorros, débito, crédito, otro | Alta |
| RF-05.3 | Campos: nombre, tipo, saldo inicial, estado (activa/inactiva) | Alta |
| RF-05.4 | Saldo calculado coherente con movimientos | Alta |

### RF-06: Historial y Filtros
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-06.1 | Tabla de movimientos con paginación (20 por página) | Alta |
| RF-06.2 | Búsqueda por descripción (texto parcial) | Alta |
| RF-06.3 | Filtro por tipo (ingreso/gasto) | Alta |
| RF-06.4 | Filtro por categoría | Alta |
| RF-06.5 | Filtro por cuenta | Alta |
| RF-06.6 | Filtro por rango de fechas | Alta |
| RF-06.7 | Ordenamiento por fecha e importe (asc/desc) | Alta |
| RF-06.8 | Filtros ejecutados en backend | Alta |

### RF-07: Presupuestos
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-07.1 | Crear presupuesto mensual por categoría | Alta |
| RF-07.2 | Campos: categoría, mes/año, importe establecido | Alta |
| RF-07.3 | Calcular importe gastado automáticamente | Alta |
| RF-07.4 | Mostrar porcentaje consumido y restante | Alta |
| RF-07.5 | Alertas visuales: 80% (amarillo), 90% (naranja), 100%+ (rojo) | Alta |
| RF-07.6 | Vista resumen de todos los presupuestos del mes | Alta |

### RF-08: Reportes y Exportaciones
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-08.1 | Exportar a PDF (jsPDF + autotable) | Alta |
| RF-08.2 | Exportar a Excel (SheetJS/xlsx) | Alta |
| RF-08.3 | Reportes respetan filtros aplicados | Alta |
| RF-08.4 | Incluir: resumen ingresos, gastos, balance, historial, distribución categorías, periodo | Alta |

### RF-09: Gráficos Interactivos
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-09.1 | Barras: ingresos vs gastos mensual (12 meses) | Alta |
| RF-09.2 | Doughnut: distribución gastos por categoría | Alta |
| RF-09.3 | Líneas: evolución balance mensual | Alta |
| RF-09.4 | Barras: gastos por categoría (top 10) | Alta |
| RF-09.5 | Comparativo mensual con indicadores de variación | Alta |
| RF-09.6 | Actualización dinámica al cambiar filtros | Alta |

---

## 3. Requisitos No Funcionales

### 3.1 Seguridad
| ID | Requisito |
|----|-----------|
| RNF-01 | JWT con expiración ≤ 24h, refresh token opcional |
| RNF-02 | Rate limiting: 10 req/min en auth, 100 req/min en API general |
| RNF-03 | Helmet para headers de seguridad |
| RNF-04 | CORS restringido a FRONTEND_URL |
| RNF-05 | Validación de entrada en backend (express-validator) |
| RNF-06 | Sanitización contra NoSQL injection |
| RNF-07 | Passwords nunca en logs |
| RNF-08 | Tokens JWT con claims mínimos (userId, role, iat, exp) |

### 3.2 Rendimiento
| ID | Requisito |
|----|-----------|
| RNF-10 | Tiempo de respuesta API < 500ms (p95) |
| RNF-11 | Dashboard carga inicial < 2s |
| RNF-12 | Paginación obligatoria en listados > 50 registros |
| RNF-13 | Índices en MongoDB para consultas frecuentes |

### 3.3 Escalabilidad y Multi-tenancy
| ID | Requisito |
|----|-----------|
| RNF-15 | Modelo de datos con `userId` en todas las entidades principales |
| RNF-16 | Preparado para `tenantId` futuro (índice compuesto) |
| RNF-17 | Aislamiento estricto: repositorios filtran por owner automáticamente |
| RNF-18 | Middleware de autorización centralizado |

### 3.4 Usabilidad y UX
| ID | Requisito |
|----|-----------|
| RNF-20 | Responsive: desktop (≥1024px), tablet (768-1023px), móvil (<768px) |
| RNF-21 | Skeleton loaders en datos asíncronos |
| RNF-22 | Estados vacíos con call-to-action |
| RNF-23 | Confirmaciones SweetAlert2 en acciones destructivas |
| RNF-24 | Notificaciones Toastify (éxito, error, info) |
| RNF-25 | Accesibilidad: contraste AA, focus visible, labels en forms |

### 3.5 Mantenibilidad
| ID | Requisito |
|----|-----------|
| RNF-30 | Arquitectura por capas: Controller → Service → Repository |
| RNF-31 | Separación frontend/backend |
| RNF-32 | Variables de entorno para configuración |
| RNF-33 | Documentación OpenAPI/Swagger |
| RNF-34 | Tests unitarios e integración ≥ 80% cobertura crítica |

---

## 4. Reglas de Negocio

### BN-01: Aislamiento de Datos
- Todo movimiento, categoría, cuenta, presupuesto pertenece a un `userId`.
- Ninguna consulta retorna datos de otro usuario.
- El `userId` se obtiene exclusivamente del JWT validado, nunca del body/query.

### BN-02: Consistencia Financiera
- Saldo de cuenta = saldo_inicial + Σ(ingresos) - Σ(gastos) de esa cuenta.
- Eliminar movimiento recalcula saldos afectados.
- Presupuesto gastado = Σ(gastos de esa categoría en ese mes).

### BN-03: Categorías por Defecto
- Al registrar usuario, crear categorías semilla (ingresos: Salario, Freelance, Inversiones, Otros; gastos: Alimentación, Transporte, Vivienda, Servicios, Ocio, Salud, Educación, Otros).

### BN-04: Eliminación de Categorías
- Si categoría tiene movimientos: impedir eliminación o permitir reasignar a otra categoría antes.

### BN-05: Presupuestos
- Un presupuesto por categoría por mes por usuario.
- Al crear gasto, actualizar presupuesto correspondiente en tiempo real.

### BN-06: Roles y Permisos
| Acción | USER | ADMIN |
|--------|------|-------|
| Gestionar sus finanzas | ✓ | ✓ |
| Ver usuarios | ✗ | ✓ |
| Gestionar usuarios | ✗ | ✓ |
| Ver finanzas de otros | ✗ | ✗ |
| Configuración sistema | ✗ | ✓ |

**Nota**: ADMIN no ve datos financieros privados de otros usuarios.

---

## 5. Casos de Uso Principales

### UC-01: Registrar Usuario
1. Usuario accede a /register
2. Completa formulario (email, password, confirmPassword)
3. Validación frontend + backend
4. Backend: hashear password, crear usuario, crear categorías por defecto
5. Retornar JWT + user data
6. Redirigir a /dashboard

### UC-02: Iniciar Sesión
1. Usuario accede a /login
2. Completa email + password
3. Backend: validar credenciales, generar JWT
4. Retornar JWT + user data
5. Guardar token en memoria (no localStorage por seguridad)
6. Redirigir a /dashboard

### UC-03: Crear Gasto
1. Usuario en dashboard/historial clic "Nuevo gasto"
2. Modal: selecciona categoría (gasto), cuenta, importe, fecha, descripción, notas
3. Validación: importe > 0, categoría tipo gasto, cuenta propia
4. Backend: crear movimiento, actualizar saldo cuenta, actualizar presupuesto si aplica
5. Toast éxito, cerrar modal, actualizar dashboard

### UC-04: Ver Dashboard
1. Usuario autenticado accede a /dashboard
2. Frontend: llamadas paralelas a /api/dashboard/summary, /api/dashboard/charts, /api/movements/recent
3. Renderizar tarjetas, gráficos, tabla últimos movimientos
4. Loading states durante carga

### UC-05: Exportar Reporte
1. Usuario en historial aplica filtros
2. Clic "Exportar PDF" o "Exportar Excel"
3. Frontend: llama /api/reports/export?format=pdf&filters=...
4. Backend: genera archivo, retorna blob
5. Frontend: descarga archivo

---

## 6. Matriz de Trazabilidad

| Requisito | Componente Backend | Componente Frontend | Test |
|-----------|-------------------|---------------------|------|
| RF-01.1-01.8 | AuthController, AuthService, UserRepository | RegisterPage, LoginPage, AuthContext | auth.test.js |
| RF-02.1-02.10 | DashboardController, DashboardService | DashboardPage, DashboardCards, Charts | dashboard.test.js |
| RF-03.1-03.8 | MovementController, MovementService, MovementRepository | MovementForm, MovementTable, HistoryPage | movement.test.js |
| RF-04.1-04.5 | CategoryController, CategoryService | CategoryManager, CategoryModal | category.test.js |
| RF-05.1-05.4 | AccountController, AccountService | AccountManager, AccountModal | account.test.js |
| RF-06.1-06.8 | MovementController (list) | HistoryPage, FiltersComponent | history.test.js |
| RF-07.1-07.6 | BudgetController, BudgetService | BudgetPage, BudgetCard | budget.test.js |
| RF-08.1-08.4 | ReportController, ReportService | ExportButtons | report.test.js |
| RF-09.1-09.6 | DashboardController (charts) | ChartComponents (Bar, Doughnut, Line) | charts.test.js |

---

## 7. Supuestos y Dependencias

### Supuestos
- MongoDB Atlas cluster disponible y accesible.
- Servicio SMTP para emails (Nodemailer).
- Usuario tiene conocimientos básicos de finanzas personales.
- Navegadores modernos (últimas 2 versiones).

### Dependencias Externas
- MongoDB Atlas (base de datos)
- Proveedor SMTP (Gmail, SendGrid, Mailgun, etc.)
- CDN para fuentes/iconos (Google Fonts, Lucide)
- Chart.js CDN o npm

---

## 8. Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Fuga de datos entre usuarios | Media | Crítico | Tests de aislamiento, middleware owner-filter, revisiones de código |
| Inconsistencia saldos | Media | Alto | Transacciones MongoDB, tests de consistencia, recálculo bajo demanda |
| Tokens JWT robados | Media | Alto | HttpOnly cookies opcional, expiración corta, refresh tokens |
| Performance consultas agregadas | Media | Medio | Índices compuestos, paginación, caching Redis futuro |
| Complejidad multi-tenant futuro | Alta | Medio | Diseño con tenantId desde inicio, índices preparados |

---

## 9. Criterios de Aceptación Generales

1. ✅ Usuario puede registrarse, loguearse, recuperar password.
2. ✅ Dashboard muestra datos reales calculados desde BD.
3. ✅ CRUD movimientos/categorías/cuentas funcional y validado.
4. ✅ Filtros en historial funcionan en backend.
5. ✅ Presupuestos calculan gasto real y alertan.
6. ✅ Gráficos se actualizan con datos reales.
7. ✅ Exportación PDF/Excel respeta filtros.
8. ✅ Usuario A no ve datos de Usuario B.
9. ✅ Responsive en 3 breakpoints.
10. ✅ Tests críticos pasan.
11. ✅ Documentación actualizada.