# Seguridad, Autenticación, RBAC y Multi-Tenancy

## 1. Autenticación JWT

### 1.1 Estructura del Token
```json
// Header
{ "alg": "HS256", "typ": "JWT" }

// Payload
{
  "sub": "user_object_id",      // subject = userId
  "role": "USER",               // USER | ADMIN
  "iat": 1705680000,            // issued at
  "exp": 1705766400,            // expires at (24h)
  "jti": "unique_token_id"      // JWT ID para blacklist/revocación
}
```

### 1.2 Configuración
| Parámetro | Valor | Justificación |
|-----------|-------|---------------|
| Algoritmo | HS256 | Simétrico, suficiente para arquitectura monolítica |
| Expiración Access Token | 24 horas | Balance UX/seguridad |
| Expiración Refresh Token | 30 días | Si se implementa (fase 2) |
| Secret | 256-bit random | `openssl rand -base64 32` |
| Issuer | `finanzas-app` | Identificación |
| Audience | `finanzas-app-users` | Validación opcional |

### 1.3 Flujo de Autenticación
```
1. POST /auth/login {email, password}
       │
       ▼
2. Validar credenciales (bcrypt compare)
       │
       ▼
3. Generar JWT con claims: {sub: userId, role, iat, exp, jti}
       │
       ▼
4. Respuesta: { user: {...}, token: "jwt" }
       │
       ▼
5. Frontend: Guardar token en MEMORIA (React Context), NO localStorage
       │
       ▼
6. Requests subsiguientes: Authorization: Bearer <token>
```

### 1.4 Middleware de Autenticación
```javascript
// middlewares/authMiddleware.js
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('UNAUTHORIZED', 401, 'Token no proporcionado');
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'finanzas-app',
      audience: 'finanzas-app-users'
    });
    
    // Verificar blacklist (si se implementa Redis)
    // const isBlacklisted = await redis.exists(`blacklist:${decoded.jti}`);
    // if (isBlacklisted) throw new AppError('TOKEN_REVOKED', 401);
    
    // Cargar usuario (sin passwordHash)
    const user = await User.findById(decoded.sub).select('-passwordHash -emailVerificationToken -passwordResetToken');
    if (!user || !user.isActive) {
      throw new AppError('UNAUTHORIZED', 401, 'Usuario no encontrado o inactivo');
    }
    
    req.user = user;
    req.tokenPayload = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('UNAUTHORIZED', 401, 'Token inválido'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('TOKEN_EXPIRED', 401, 'Token expirado'));
    }
    next(error);
  }
};
```

---

## 2. Control de Acceso Basado en Roles (RBAC)

### 2.1 Definición de Roles
| Rol | Descripción | Permisos Base |
|-----|-------------|---------------|
| **USER** | Usuario estándar | CRUD propio: movimientos, categorías, cuentas, presupuestos. Ver dashboard, historial, exportar. |
| **ADMIN** | Administrador del sistema | Todo lo de USER + Gestión de usuarios (listar, ver, activar/desactivar, cambiar rol), estadísticas globales. **NO** acceso a datos financieros de otros usuarios. |

### 2.2 Matriz de Permisos
| Recurso | Acción | USER | ADMIN |
|---------|--------|------|-------|
| `/auth/*` | register, login, logout, me, password | ✓ | ✓ |
| `/movements` | CRUD propio | ✓ | ✓ |
| `/movements` | CRUD ajeno | ✗ | ✗ |
| `/categories` | CRUD propio | ✓ | ✓ |
| `/accounts` | CRUD propio | ✓ | ✓ |
| `/budgets` | CRUD propio | ✓ | ✓ |
| `/dashboard` | Read propio | ✓ | ✓ |
| `/reports` | Export propio | ✓ | ✓ |
| `/admin/users` | List, Read, Update (role, active) | ✗ | ✓ |
| `/admin/stats` | Read | ✗ | ✓ |

### 2.3 Middleware de Autorización
```javascript
// middlewares/rbacMiddleware.js
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('UNAUTHORIZED', 401, 'Autenticación requerida'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('FORBIDDEN', 403, 'No tienes permisos para esta acción'));
    }
    next();
  };
};

// Uso en rutas
router.get('/admin/users', authenticate, authorize('ADMIN'), adminController.listUsers);
router.get('/dashboard/summary', authenticate, dashboardController.getSummary); // USER y ADMIN
```

### 2.4 Políticas de Autorización en Servicios (Capa de Negocio)
```javascript
// services/movementService.js
async function deleteMovement(userId, movementId, requestingUser) {
  // 1. Verificar ownership
  const movement = await movementRepo.findByIdAndUser(movementId, userId);
  if (!movement) {
    throw new AppError('NOT_FOUND', 404, 'Movimiento no encontrado');
  }
  
  // 2. Política: ADMIN no puede borrar movimientos de otros usuarios
  // (Solo el owner o un proceso sistemático)
  if (requestingUser.role === 'ADMIN' && requestingUser.id !== userId) {
    throw new AppError('FORBIDDEN', 403, 'Los administradores no pueden gestionar finanzas de otros usuarios');
  }
  
  // 3. Proceder con soft delete + recálculos
  return softDeleteWithRecalculation(movement, userId);
}
```

---

## 3. Aislamiento Multi-Tenant (Multi-Usuario)

### 3.1 Principio: Owner Filter Pattern
Todas las consultas a repositorios **DEBEN** filtrar por `userId` del JWT validado.

```javascript
// middlewares/ownerFilterMiddleware.js
const injectOwnerFilter = (req, res, next) => {
  // userId siempre viene del JWT, NUNCA del body/query/params
  const ownerId = req.user.id;
  
  // Para queries: inyectar en req.query para que repositorios lo usen
  req.query = { ...req.query, userId: ownerId };
  
  // Para body (creación): inyectar en req.body
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    req.body = { ...req.body, userId: ownerId };
  }
  
  // Para params anidados: /categories/:categoryId/movements
  if (req.params.categoryId) {
    req.query.categoryId = req.params.categoryId;
  }
  
  next();
};

// Aplicar en TODAS las rutas privadas
router.use('/movements', authenticate, injectOwnerFilter);
router.use('/categories', authenticate, injectOwnerFilter);
router.use('/accounts', authenticate, injectOwnerFilter);
router.use('/budgets', authenticate, injectOwnerFilter);
router.use('/dashboard', authenticate, injectOwnerFilter);
router.use('/reports', authenticate, injectOwnerFilter);
```

### 3.2 Repositorios: Filtro Automático
```javascript
// repositories/movementRepository.js
class MovementRepository {
  // TODOS los métodos reciben userId obligatorio
  async findByUser(userId, filters = {}) {
    const query = { userId, deletedAt: null, ...filters };
    return Movement.find(query).sort({ date: -1 }).lean();
  }
  
  async findByIdAndUser(id, userId) {
    return Movement.findOne({ _id: id, userId, deletedAt: null }).lean();
  }
  
  async create(data, session = null) {
    // data DEBE incluir userId (inyectado por middleware)
    const movement = new Movement(data);
    return movement.save({ session });
  }
  
  async updateByIdAndUser(id, userId, data, session = null) {
    return Movement.findOneAndUpdate(
      { _id: id, userId, deletedAt: null },
      data,
      { new: true, runValidators: true, session }
    );
  }
  
  async deleteByIdAndUser(id, userId, session = null) {
    return Movement.findOneAndUpdate(
      { _id: id, userId, deletedAt: null },
      { deletedAt: new Date() },
      { new: true, session }
    );
  }
  
  // Agregaciones SIEMPRE con match userId primero
  async getMonthlySummary(userId, year, month) {
    return Movement.aggregate([
      { $match: { userId: new Types.ObjectId(userId), deletedAt: null, ...dateRange(year, month) } },
      // ... resto pipeline
    ]);
  }
}
```

### 3.3 Validación de Pertenencia (Cross-Reference)
Al crear/actualizar movimientos, validar que categoría y cuenta pertenecen al usuario:

```javascript
// services/movementService.js - validación interna
async function validateOwnership(userId, categoryId, accountId) {
  const [category, account] = await Promise.all([
    Category.findOne({ _id: categoryId, userId, deletedAt: null }).lean(),
    Account.findOne({ _id: accountId, userId, deletedAt: null }).lean()
  ]);
  
  if (!category) throw new AppError('CATEGORY_NOT_FOUND', 404, 'Categoría no encontrada o no te pertenece');
  if (!account) throw new AppError('ACCOUNT_NOT_FOUND', 404, 'Cuenta no encontrada o no te pertenece');
  
  return { category, account };
}
```

### 3.4 Protección contra IDOR (Insecure Direct Object References)
- **Nunca** confiar en IDs del frontend para autorización
- **Siempre** verificar ownership en service/repository
- **Pruebas**: Tests automatizados intentando acceder a recursos de otro usuario

---

## 4. Preparación para Multi-Tenant (Organizaciones/Familias)

### 4.1 Extensión del Modelo
```javascript
// En todos los modelos principales
tenantId: {
  type: Schema.Types.ObjectId,
  ref: 'Tenant',
  index: true,
  // required: false (fase 1), required: true (fase 2+)
}

// Índice compuesto para queries tenant-aware
schema.index({ tenantId: 1, userId: 1 });
schema.index({ tenantId: 1, userId: 1, date: -1 }); // movements
```

### 4.2 Middleware Tenant Resolution (Futuro)
```javascript
// middlewares/tenantMiddleware.js
const resolveTenant = async (req, res, next) => {
  // Opción A: Subdominio (org1.app.com)
  // const subdomain = req.hostname.split('.')[0];
  // const tenant = await Tenant.findOne({ subdomain });
  
  // Opción B: Header (para API)
  // const tenantId = req.headers['x-tenant-id'];
  
  // Opción C: Claim en JWT (preferido)
  const tenantId = req.tokenPayload?.tenantId;
  
  if (tenantId) {
    req.tenantId = tenantId;
    req.query.tenantId = tenantId;
    if (req.body) req.body.tenantId = tenantId;
  }
  next();
};
```

### 4.3 Reglas de Aislamiento Futuro
1. `tenantId` + `userId` en todas las queries
2. Usuario pertenece a un solo tenant (o múltiples con roles por tenant)
3. ADMIN de tenant solo ve usuarios de su tenant
4. SUPER_ADMIN (plataforma) ve todo

---

## 5. Seguridad de Contraseñas

### 5.1 Hashing con bcrypt
```javascript
// utils/password.js
const BCRYPT_ROUNDS = 12; // ~250ms en CPU actual

export const hashPassword = async (plainPassword) => {
  return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
};

export const verifyPassword = async (plainPassword, hash) => {
  return bcrypt.compare(plainPassword, hash);
};

// Validación fuerza contraseña
export const validatePasswordStrength = (password) => {
  const errors = [];
  if (password.length < 8) errors.push('Mínimo 8 caracteres');
  if (!/[A-Z]/.test(password)) errors.push('Al menos una mayúscula');
  if (!/[a-z]/.test(password)) errors.push('Al menos una minúscula');
  if (!/[0-9]/.test(password)) errors.push('Al menos un número');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('Al menos un símbolo');
  return { valid: errors.length === 0, errors };
};
```

### 5.2 Políticas de Contraseña
- Mínimo 8 caracteres, máximo 128
- Requiere: mayúscula, minúscula, número, símbolo
- Bloquear contraseñas comunes (lista top 10k)
- No reutilizar últimas 5 contraseñas (historial hash)
- Expiración opcional: 90 días (configurable)

---

## 6. Recuperación de Contraseña (Segura)

### 6.1 Flujo
```
1. POST /auth/forgot-password {email}
       │
       ▼
2. Si usuario existe y está activo:
   - Generar token crypto.randomBytes(32).toString('hex')
   - Guardar hash(token) en user.passwordResetToken
   - Guardar expiración: Date.now() + 1 hora en user.passwordResetExpires
   - Enviar email con enlace: https://app.com/reset-password?token=<token>
       │
       ▼
3. Usuario hace clic → Frontend valida token format
       │
       ▼
4. POST /auth/reset-password {token, password, confirmPassword}
       │
       ▼
5. Backend:
   - Buscar usuario con passwordResetToken = hash(token) Y passwordResetExpires > now
   - Si encontrado: hashear nueva password, limpiar tokens, invalidar sesiones (blacklist JWTs)
   - Responder éxito
```

### 6.2 Token de Reset
- 32 bytes hex (64 chars), entropía 256-bit
- Hash almacenado (bcrypt o SHA-256), nunca plaintext
- Expiración: 1 hora
- Un solo uso: se invalida tras uso
- Rate limit: 3 solicitudes/hora por email/IP

---

## 7. Protección de Headers HTTP (Helmet)

```javascript
// config/helmet.js
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Vite HMR en dev
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "https://api.ejemplo.com", "ws://localhost:5173"], // Vite WS
      frameAncestors: ["'none'"],
      formAction: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Para compatibilidad
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  noSniff: true,
  xssFilter: true,
  frameguard: { action: 'deny' }
};
```

---

## 8. CORS (Cross-Origin Resource Sharing)

```javascript
// config/cors.js
const corsOptions = {
  origin: process.env.FRONTEND_URL, // 'https://app.ejemplo.com'
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition'], // Para descargas PDF/Excel
  credentials: true, // Si usamos cookies HttpOnly para refresh token
  maxAge: 86400 // 24h preflight cache
};
```

---

## 9. Rate Limiting

```javascript
// config/rateLimit.js
const rateLimitConfigs = {
  // Auth endpoints: estricto
  auth: {
    windowMs: 60 * 1000, // 1 minuto
    max: 10,             // 10 requests
    message: 'Demasiados intentos, intenta en 1 minuto',
    standardHeaders: true,
    legacyHeaders: false
  },
  // API general
  api: {
    windowMs: 60 * 1000,
    max: 100,
    message: 'Límite de requests excedido'
  },
  // Exportaciones: más permisivo pero controlado
  export: {
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 20,
    message: 'Máximo 20 exportaciones por hora'
  }
};
```

---

## 10. Validación y Sanitización de Entrada

### 10.1 Express-Validator en Rutas
```javascript
// validators/movementValidators.js
const { body, param, query } = require('express-validator');
const { ObjectId } = require('mongoose').Types;

export const createMovementValidators = [
  body('type').isIn(['income', 'expense']).withMessage('Tipo inválido'),
  body('description').trim().isLength({ min: 1, max: 200 }).withMessage('Descripción requerida (1-200 chars)'),
  body('amount').isFloat({ gt: 0 }).withMessage('Importe debe ser > 0'),
  body('categoryId').custom(value => ObjectId.isValid(value)).withMessage('ID categoría inválido'),
  body('accountId').custom(value => ObjectId.isValid(value)).withMessage('ID cuenta inválido'),
  body('date').isISO8601().toDate().withMessage('Fecha inválida'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notas máx 1000 chars'),
  // Sanitización
  body('description').escape(),
  body('notes').escape()
];

export const listMovementsValidators = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sort').optional().isIn(['date', '-date', 'amount', '-amount', 'createdAt', '-createdAt']),
  query('type').optional().isIn(['income', 'expense']),
  query('categoryId').optional().custom(value => ObjectId.isValid(value)),
  query('accountId').optional().custom(value => ObjectId.isValid(value)),
  query('startDate').optional().isISO8601().toDate(),
  query('endDate').optional().isISO8601().toDate(),
  query('search').optional().trim().isLength({ max: 100 }).escape()
];
```

### 10.2 Middleware de Validación Centralizado
```javascript
// middlewares/validationMiddleware.js
const { validationResult } = require('express-validator');

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map(e => ({ field: e.path, message: e.msg }));
    throw new AppError('VALIDATION_ERROR', 422, 'Datos de entrada inválidos', details);
  }
  next();
};
```

---

## 11. Prevención de Inyección NoSQL

```javascript
// utils/sanitize.js
// Eliminar operadores MongoDB de objetos
export const sanitizeMongoQuery = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = Array.isArray(obj) ? [] : {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$') || key.includes('.')) continue; // Skip $operators y dot notation
    sanitized[key] = sanitizeMongoQuery(value);
  }
  return sanitized;
};

// Middleware para sanitizar query params
export const sanitizeQueryMiddleware = (req, res, next) => {
  req.query = sanitizeMongoQuery(req.query);
  req.body = sanitizeMongoQuery(req.body);
  next();
};
```

**Nota**: Mongoose ODM ya protege en gran medida, pero sanitizar query params evita operadores en filtros.

---

## 12. Gestión de Sesiones y Tokens

### 12.1 Access Token (JWT)
- Almacenamiento: **Memoria** (React Context/Variable), **NUNCA** localStorage/sessionStorage
- Expiración: 24h
- Renovación: Silent refresh antes de expirar (fase 2) o re-login

### 12.2 Refresh Token (Opcional, Fase 2)
- Almacenamiento: **HttpOnly Cookie** (Secure, SameSite=Strict)
- Expiración: 30 días
- Rotación: Nuevo refresh token en cada uso, invalidar anterior
- Revocación: Blacklist en Redis por `jti`

### 12.3 Logout Seguro
```javascript
// POST /auth/logout
// 1. Agregar JTI del access token a blacklist (Redis) con TTL = tiempo restante del token
// 2. Si refresh token en cookie: invalidar en BD/Redis
// 3. Limpiar cookie refresh token
// 4. Frontend: limpiar contexto React
```

---

## 13. Auditoría y Logging de Seguridad

### 13.1 Eventos a Loggear
| Evento | Nivel | Datos |
|--------|-------|-------|
| Login exitoso | info | userId, ip, userAgent |
| Login fallido | warn | email, ip, userAgent, reason |
| Logout | info | userId |
| Password change | info | userId, ip |
| Password reset request | info | email, ip |
| Password reset complete | info | userId, ip |
| Token revoked | info | userId, jti, reason |
| Unauthorized access | warn | ip, path, tokenPayload (sin secret) |
| Forbidden access | warn | userId, path, requiredRole |
| Admin action | info | adminId, action, targetUserId |

### 13.2 Formato Log (JSON Structurado)
```json
{
  "timestamp": "2024-01-20T10:30:00.123Z",
  "level": "warn",
  "event": "LOGIN_FAILED",
  "userId": null,
  "email": "user@ejemplo.com",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "reason": "INVALID_PASSWORD",
  "requestId": "req_abc123"
}
```

---

## 14. Checklist de Seguridad (Pre-Producción)

### Autenticación
- [ ] JWT secret rotado, 256-bit, en vault/secret manager
- [ ] Access token ≤ 24h, refresh token HttpOnly cookie
- [ ] Rate limiting en /auth/* (10/min)
- [ ] bcrypt cost ≥ 12
- [ ] Password policy enforced
- [ ] Reset token: 1h expiry, single-use, hashed storage

### Autorización
- [ ] Middleware authenticate en todas las rutas privadas
- [ ] Middleware authorize('ADMIN') en rutas admin
- [ ] Owner filter middleware inyecta userId en TODAS las rutas de recursos
- [ ] Services validan ownership antes de operaciones mutativas
- [ ] ADMIN no puede acceder a datos financieros de otros usuarios

### Datos
- [ ] Índices unique en email, nombre categoría/cuenta por usuario
- [ ] Soft delete implementado (deletedAt)
- [ ] Transacciones MongoDB para operaciones multi-entidad
- [ ] Validación de tipos (Category.type === Movement.type)

### Transporte
- [ ] HTTPS obligatorio (HSTS)
- [ ] CORS restringido a FRONTEND_URL exacto
- [ ] Helmet configurado (CSP, HSTS, XSS, frameguard)
- [ ] Cookies Secure, HttpOnly, SameSite=Strict

### Entrada/Salida
- [ ] express-validator en TODOS los endpoints
- [ ] Sanitización NoSQL en query/body
- [ ] Escape HTML en outputs (frontend)
- [ ] Content-Type: application/json enforced

### Monitoreo
- [ ] Logs estructurados JSON
- [ ] Correlation ID (request-id) propagado
- [ ] Alertas en: login fallidos > 10/min, 401/403 spikes, 5xx errors
- [ ] Health checks: /health, /health/ready

---

## 15. Respuesta a Incidentes

### 15.1 Compromiso de Credenciales
1. Rotar JWT_SECRET inmediatamente
2. Invalidar todos los tokens (blacklist masiva o cambiar secret)
3. Forzar logout global
4. Notificar usuarios afectados
5. Revisar logs de accesos anómalos

### 15.2 Fuga de Datos
1. Contención: revocar tokens, desactivar cuentas comprometidas
2. Análisis: alcance, vectores, datos expuestos
3. Notificación: usuarios, autoridades (GDPR 72h)
4. Remediación: parchear vulnerabilidad, rotar secretos
5. Post-mortem: documento, mejoras

---

## 16. Referencias de Seguridad
- OWASP Top 10 2021
- OWASP JWT Cheat Sheet
- OWASP Authentication Cheat Sheet
- NIST SP 800-63B (Digital Identity Guidelines)
- GDPR Art. 32 (Security of processing)