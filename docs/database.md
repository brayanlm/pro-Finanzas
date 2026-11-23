# Modelos de Datos - MongoDB Atlas

## 1. Visión General

### 1.1 Convenciones de Nomenclatura
- **Colecciones**: plural, camelCase (`users`, `movements`, `categories`, `accounts`, `budgets`)
- **Campos**: camelCase (`createdAt`, `userId`, `accountId`)
- **IDs**: `ObjectId` nativo de MongoDB (no UUID salvo casos específicos)
- **Timestamps**: `createdAt`, `updatedAt` automáticos via Mongoose `timestamps: true`
- **Soft Delete**: Campo `deletedAt` (Date, null = activo) en entidades principales
- **Índices**: Definidos en schema con `index: true` o `schema.index()`

### 1.2 Multi-tenancy Preparation
Todos los modelos principales incluyen:
- `userId: { type: ObjectId, ref: 'User', required: true, index: true }`
- Futuro: `tenantId: { type: ObjectId, ref: 'Tenant', index: true }` (índice compuesto `{ tenantId: 1, userId: 1 }`)

---

## 2. Modelos Principales

### 2.1 User
```javascript
// models/User.js
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 255,
    index: true
  },
  passwordHash: {
    type: String,
    required: true,
    select: false // Nunca incluir en queries por defecto
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  role: {
    type: String,
    enum: ['USER', 'ADMIN'],
    default: 'USER',
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  lastLoginAt: {
    type: Date
  },
  preferences: {
    currency: { type: String, default: 'EUR' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    language: { type: String, default: 'es' }
  }
}, {
  timestamps: true,
  versionKey: false
});

// Índices compuestos
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, isActive: 1 });

// Virtuals
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Methods
userSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    email: this.email,
    name: this.name,
    role: this.role,
    isActive: this.isActive,
    emailVerified: this.emailVerified,
    preferences: this.preferences,
    createdAt: this.createdAt,
    lastLoginAt: this.lastLoginAt
  };
};

// Pre-save hook para normalizar email
userSchema.pre('save', function(next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
```

### 2.2 Category
```javascript
// models/Category.js
const categorySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true,
    index: true
  },
  color: {
    type: String,
    required: true,
    match: /^#[0-9A-Fa-f]{6}$/ // Hex color
  },
  icon: {
    type: String,
    required: true,
    maxlength: 50 // Nombre icono Lucide: 'shopping-cart', 'salary', etc.
  },
  isDefault: {
    type: Boolean,
    default: false,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  versionKey: false
});

// Índices
categorySchema.index({ userId: 1, type: 1, isActive: 1 });
categorySchema.index({ userId: 1, name: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

// Virtual: contador de movimientos (poblado bajo demanda)
categorySchema.virtual('movementCount', {
  ref: 'Movement',
  localField: '_id',
  foreignField: 'categoryId',
  count: true
});

// Static: categorías por defecto del sistema
categorySchema.statics.getDefaultCategories = function() {
  return [
    // Ingresos
    { name: 'Salario', type: 'income', color: '#10B981', icon: 'briefcase', isDefault: true, sortOrder: 1 },
    { name: 'Freelance', type: 'income', color: '#059669', icon: 'laptop', isDefault: true, sortOrder: 2 },
    { name: 'Inversiones', type: 'income', color: '#047857', icon: 'trending-up', isDefault: true, sortOrder: 3 },
    { name: 'Otros ingresos', type: 'income', color: '#065F46', icon: 'plus-circle', isDefault: true, sortOrder: 4 },
    // Gastos
    { name: 'Alimentación', type: 'expense', color: '#EF4444', icon: 'utensils', isDefault: true, sortOrder: 10 },
    { name: 'Transporte', type: 'expense', color: '#DC2626', icon: 'car', isDefault: true, sortOrder: 11 },
    { name: 'Vivienda', type: 'expense', color: '#B91C1C', icon: 'home', isDefault: true, sortOrder: 12 },
    { name: 'Servicios', type: 'expense', color: '#991B1B', icon: 'zap', isDefault: true, sortOrder: 13 },
    { name: 'Ocio', type: 'expense', color: '#F97316', icon: 'gamepad-2', isDefault: true, sortOrder: 14 },
    { name: 'Salud', type: 'expense', color: '#EC4899', icon: 'heart-pulse', isDefault: true, sortOrder: 15 },
    { name: 'Educación', type: 'expense', color: '#8B5CF6', icon: 'graduation-cap', isDefault: true, sortOrder: 16 },
    { name: 'Otros gastos', type: 'expense', color: '#6B7280', icon: 'more-horizontal', isDefault: true, sortOrder: 17 }
  ];
};

// Pre-delete: verificar movimientos asociados
categorySchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  const Movement = mongoose.model('Movement');
  const count = await Movement.countDocuments({ categoryId: this._id, deletedAt: null });
  if (count > 0) {
    const err = new Error('CATEGORY_HAS_MOVEMENTS');
    err.details = { movementCount: count };
    return next(err);
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
```

### 2.3 Account
```javascript
// models/Account.js
const ACCOUNT_TYPES = ['cash', 'bank', 'savings', 'debit_card', 'credit_card', 'other'];

const accountSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  type: {
    type: String,
    enum: ACCOUNT_TYPES,
    required: true,
    index: true
  },
  initialBalance: {
    type: Number,
    required: true,
    default: 0,
    validate: {
      validator: Number.isFinite,
      message: 'Saldo inicial debe ser un número válido'
    }
  },
  currentBalance: {
    type: Number,
    default: 0,
    validate: {
      validator: Number.isFinite,
      message: 'Saldo actual debe ser un número válido'
    }
  },
  currency: {
    type: String,
    default: 'EUR',
    uppercase: true,
    maxlength: 3
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  // Para tarjetas de crédito
  creditLimit: {
    type: Number,
    validate: {
      validator: function(v) {
        return this.type !== 'credit_card' || (v !== undefined && v > 0);
      },
      message: 'Límite de crédito requerido para tarjetas de crédito'
    }
  },
  // Para cuentas bancarias
  bankName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  lastFourDigits: {
    type: String,
    match: /^\d{4}$/,
    maxlength: 4
  }
}, {
  timestamps: true,
  versionKey: false
});

// Índices
accountSchema.index({ userId: 1, isActive: 1 });
accountSchema.index({ userId: 1, name: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

// Virtual: movimientos asociados
accountSchema.virtual('movements', {
  ref: 'Movement',
  localField: '_id',
  foreignField: 'accountId'
});

// Method: recalcular balance desde movimientos
accountSchema.methods.recalculateBalance = async function(session = null) {
  const Movement = mongoose.model('Movement');
  const agg = await Movement.aggregate([
    { $match: { accountId: this._id, deletedAt: null } },
    { $group: {
      _id: null,
      income: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
      expense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } }
    }},
    { $project: { balance: { $subtract: ['$income', '$expense'] } } }
  ]).session(session);
  
  const calculatedBalance = this.initialBalance + (agg[0]?.balance || 0);
  this.currentBalance = calculatedBalance;
  await this.save({ session });
  return calculatedBalance;
};

// Static: tipos de cuenta con labels
accountSchema.statics.getAccountTypes = function() {
  return [
    { value: 'cash', label: 'Efectivo', icon: 'banknote' },
    { value: 'bank', label: 'Cuenta bancaria', icon: 'building-2' },
    { value: 'savings', label: 'Cuenta de ahorros', icon: 'piggy-bank' },
    { value: 'debit_card', label: 'Tarjeta de débito', icon: 'credit-card' },
    { value: 'credit_card', label: 'Tarjeta de crédito', icon: 'credit-card' },
    { value: 'other', label: 'Otro', icon: 'wallet' }
  ];
};

module.exports = mongoose.model('Account', accountSchema);
```

### 2.4 Movement
```javascript
// models/Movement.js
const movementSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'El importe debe ser mayor a 0'],
    validate: {
      validator: Number.isFinite,
      message: 'El importe debe ser un número válido'
    }
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  accountId: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  // Para gastos recurrentes (futuro)
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringConfig: {
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
    endDate: Date,
    nextDate: Date
  },
  deletedAt: {
    type: Date,
    default: null,
    index: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// Índices compuestos para queries frecuentes
movementSchema.index({ userId: 1, date: -1 });
movementSchema.index({ userId: 1, type: 1, date: -1 });
movementSchema.index({ userId: 1, categoryId: 1, date: -1 });
movementSchema.index({ userId: 1, accountId: 1, date: -1 });
movementSchema.index({ userId: 1, deletedAt: 1, date: -1 }); // Para listados excluyendo borrados
movementSchema.index({ userId: 1, type: 1, categoryId: 1, date: -1 }); // Presupuestos

// Virtual: categoría poblada
movementSchema.virtual('category', {
  ref: 'Category',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true
});

// Virtual: cuenta poblada
movementSchema.virtual('account', {
  ref: 'Account',
  localField: 'accountId',
  foreignField: '_id',
  justOne: true
});

// Query helper: solo activos
movementSchema.query.active = function() {
  return this.where({ deletedAt: null });
};

// Static: agregación para resumen mensual
movementSchema.statics.getMonthlySummary = async function(userId, year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  
  return this.aggregate([
    { $match: { userId: new Schema.Types.ObjectId(userId), date: { $gte: start, $lte: end }, deletedAt: null } },
    { $group: {
      _id: '$type',
      total: { $sum: '$amount' },
      count: { $sum: 1 }
    }},
    { $project: { type: '$_id', total: 1, count: 1, _id: 0 } }
  ]);
};

// Static: agregación para evolución mensual (últimos N meses)
movementSchema.statics.getMonthlyEvolution = async function(userId, months = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months + 1);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);
  
  return this.aggregate([
    { $match: { userId: new Schema.Types.ObjectId(userId), date: { $gte: startDate }, deletedAt: null } },
    { $group: {
      _id: {
        year: { $year: '$date' },
        month: { $month: '$date' },
        type: '$type'
      },
      total: { $sum: '$amount' }
    }},
    { $group: {
      _id: { year: '$_id.year', month: '$_id.month' },
      income: { $sum: { $cond: [{ $eq: ['$_id.type', 'income'] }, '$total', 0] } },
      expense: { $sum: { $cond: [{ $eq: ['$_id.type', 'expense'] }, '$total', 0] } }
    }},
    { $project: {
      _id: 0,
      year: '$_id.year',
      month: '$_id.month',
      income: { $ifNull: ['$income', 0] },
      expense: { $ifNull: ['$expense', 0] },
      balance: { $subtract: [{ $ifNull: ['$income', 0] }, { $ifNull: ['$expense', 0] }] }
    }},
    { $sort: { year: 1, month: 1 } }
  ]);
};

// Static: distribución por categoría (para gráficos)
movementSchema.statics.getCategoryDistribution = async function(userId, type, startDate, endDate) {
  return this.aggregate([
    { $match: { 
      userId: new Schema.Types.ObjectId(userId), 
      type, 
      date: { $gte: startDate, $lte: endDate }, 
      deletedAt: null 
    }},
    { $group: { _id: '$categoryId', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' },
    { $project: { _id: 0, categoryId: '$_id', name: '$category.name', color: '$category.color', icon: '$category.icon', total: 1, count: 1 } },
    { $sort: { total: -1 } }
  ]);
};

module.exports = mongoose.model('Movement', movementSchema);
```

### 2.5 Budget
```javascript
// models/Budget.js
const budgetSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2050
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'El presupuesto debe ser mayor a 0'],
    validate: { validator: Number.isFinite, message: 'Presupuesto debe ser un número válido' }
  },
  spent: {
    type: Number,
    default: 0,
    validate: { validator: Number.isFinite, message: 'Gastado debe ser un número válido' }
  },
  alertThresholds: {
    warning: { type: Number, default: 80 },    // %
    danger: { type: Number, default: 90 },     // %
    critical: { type: Number, default: 100 }   // %
  }
}, {
  timestamps: true,
  versionKey: false
});

// Índice único: un presupuesto por categoría por mes por usuario
budgetSchema.index({ userId: 1, categoryId: 1, year: 1, month: 1 }, { unique: true });
budgetSchema.index({ userId: 1, year: 1, month: 1 });

// Virtual: porcentaje gastado
budgetSchema.virtual('percentage').get(function() {
  if (this.amount === 0) return 0;
  return Math.round((this.spent / this.amount) * 100 * 100) / 100; // 2 decimales
});

// Virtual: estado de alerta
budgetSchema.virtual('alertLevel').get(function() {
  const pct = this.percentage;
  if (pct >= this.alertThresholds.critical) return 'critical';
  if (pct >= this.alertThresholds.danger) return 'danger';
  if (pct >= this.alertThresholds.warning) return 'warning';
  return 'normal';
});

// Virtual: restante
budgetSchema.virtual('remaining').get(function() {
  return Math.max(0, this.amount - this.spent);
});

// Virtual: categoría poblada
budgetSchema.virtual('category', {
  ref: 'Category',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true
});

// Static: obtener/crear presupuesto del mes actual para categoría
budgetSchema.statics.getOrCreateForMonth = async function(userId, categoryId, year, month) {
  let budget = await this.findOne({ userId, categoryId, year, month });
  if (!budget) {
    budget = await this.create({ userId, categoryId, year, month, amount: 0 });
  }
  return budget;
};

// Static: recalcular gastado para un presupuesto
budgetSchema.statics.recalculateSpent = async function(budgetId, session = null) {
  const Movement = mongoose.model('Movement');
  const budget = await this.findById(budgetId).session(session);
  if (!budget) return null;
  
  const start = new Date(budget.year, budget.month - 1, 1);
  const end = new Date(budget.year, budget.month, 0, 23, 59, 59, 999);
  
  const result = await Movement.aggregate([
    { $match: { 
      userId: budget.userId, 
      categoryId: budget.categoryId, 
      type: 'expense',
      date: { $gte: start, $lte: end }, 
      deletedAt: null 
    }},
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]).session(session);
  
  budget.spent = result[0]?.total || 0;
  await budget.save({ session });
  return budget;
};

// Method: actualizar gastado incrementalmente
budgetSchema.methods.incrementSpent = async function(amount, session = null) {
  this.spent = (this.spent || 0) + amount;
  await this.save({ session });
  return this;
};

budgetSchema.methods.decrementSpent = async function(amount, session = null) {
  this.spent = Math.max(0, (this.spent || 0) - amount);
  await this.save({ session });
  return this;
};

module.exports = mongoose.model('Budget', budgetSchema);
```

---

## 3. Relaciones y Población

### 3.1 Diagrama Entidad-Relación
```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │  Category   │       │   Account   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ _id (PK)    │◄──────│ userId (FK) │       │ userId (FK) │
│ email       │       │ _id (PK)    │◄──────│ _id (PK)    │
│ passwordHash│       │ name        │       │ name        │
│ name        │       │ type        │       │ type        │
│ role        │       │ color       │       │ initialBal  │
│ preferences │       │ icon        │       │ currentBal  │
└─────────────┘       │ isDefault   │       └──────┬──────┘
                      └──────┬──────┘              │
                             │                     │
                             │                     │
                      ┌──────▼──────┐       ┌──────▼──────┐
                      │  Movement   │       │   Budget    │
                      ├─────────────┤       ├─────────────┤
                      │ userId (FK) │       │ userId (FK) │
                      │ categoryId(FK)│──────►│ categoryId(FK)│
                      │ accountId(FK)│──────►│             │
                      │ type        │       │ year/month  │
                      │ amount      │       │ amount      │
                      │ date        │       │ spent       │
                      │ description │       └─────────────┘
                      └─────────────┘
```

### 3.2 Población Típica (Backend)
```javascript
// En repositories/services
// Movimiento con categoría y cuenta
const movement = await Movement.findById(id)
  .populate('category', 'name type color icon')
  .populate('account', 'name type');

// Presupuesto con categoría
const budgets = await Budget.find({ userId, year, month })
  .populate('category', 'name type color icon')
  .sort({ 'category.name': 1 });

// Dashboard summary - sin población, solo agregaciones
```

---

## 4. Índices Resumen

| Colección | Índices |
|-----------|---------|
| **users** | `{email:1}` unique, `{role:1, isActive:1}` |
| **categories** | `{userId:1, type:1, isActive:1}`, `{userId:1, name:1}` unique partial |
| **accounts** | `{userId:1, isActive:1}`, `{userId:1, name:1}` unique partial |
| **movements** | `{userId:1, date:-1}`, `{userId:1, type:1, date:-1}`, `{userId:1, categoryId:1, date:-1}`, `{userId:1, accountId:1, date:-1}`, `{userId:1, deletedAt:1, date:-1}`, `{userId:1, type:1, categoryId:1, date:-1}` |
| **budgets** | `{userId:1, categoryId:1, year:1, month:1}` unique, `{userId:1, year:1, month:1}` |

---

## 5. Migración de Datos / Seed

### 5.1 Seed Categorías por Defecto (al registrar usuario)
```javascript
// services/categoryService.js
async function seedDefaultCategories(userId) {
  const defaults = Category.getDefaultCategories();
  const docs = defaults.map(c => ({ ...c, userId, isDefault: true }));
  await Category.insertMany(docs, { ordered: false }); // continue on duplicate key
}
```

### 5.2 Seed Usuario Demo (opcional, solo desarrollo)
```javascript
// scripts/seedDemo.js
// Usuario: demo@example.com / Demo123!
// Con movimientos de ejemplo para 12 meses
```

---

## 6. Validaciones a Nivel de Modelo

| Modelo | Validaciones Clave |
|--------|-------------------|
| **User** | Email único, formato email, passwordHash presente, role enum |
| **Category** | Nombre único por usuario (activo), tipo enum, color hex, userId requerido |
| **Account** | Nombre único por usuario (activo), tipo enum, saldos numéricos, creditLimit si credit_card |
| **Movement** | Amount > 0, tipo enum, categoryId/accountId existen y pertenecen a userId, date válida |
| **Budget** | Único por userId+categoryId+year+month, amount > 0, spent >= 0, month 1-12 |

---

## 7. Soft Delete Pattern

Todas las entidades principales (Movement, Category, Account, Budget) usan `deletedAt`:
- **Query default**: `.where({ deletedAt: null })` via query helper o middleware
- **Eliminar**: `updateOne({ _id }, { deletedAt: new Date() })`
- **Restaurar**: `updateOne({ _id }, { deletedAt: null })`
- **Purga real**: Job programado (30 días) o admin manual

```javascript
// Middleware global para excluir borrados
mongoose.Query.prototype.where = function(...args) {
  if (this.model.modelName !== 'User' && args.length === 0) {
    return this.where({ deletedAt: null });
  }
  return Schema.Query.prototype.where.apply(this, args);
};
```

---

## 8. Consistencia y Transacciones

### 8.1 Operaciones Atómicas Críticas
| Operación | Entidades Afectadas | Transacción |
|-----------|-------------------|-------------|
| Crear movimiento | Movement + Account (balance) + Budget (spent) | ✅ Sí |
| Actualizar movimiento (cambio importe/cuenta/categoría) | Movement + Account(s) + Budget(s) | ✅ Sí |
| Eliminar movimiento | Movement + Account + Budget | ✅ Sí |
| Crear/actualizar presupuesto | Budget | No (single doc) |
| Recalcular balance cuenta | Account + Movements (read) | No (read-only agg) |

### 8.2 Ejemplo Transacción (Service)
```javascript
// services/movementService.js
async function createMovement(userId, data) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // 1. Validar categoría y cuenta pertenecen al usuario
    const [category, account] = await Promise.all([
      Category.findOne({ _id: data.categoryId, userId, deletedAt: null }).session(session),
      Account.findOne({ _id: data.accountId, userId, deletedAt: null }).session(session)
    ]);
    if (!category) throw new AppError('CATEGORY_NOT_FOUND', 404);
    if (!account) throw new AppError('ACCOUNT_NOT_FOUND', 404);
    if (category.type !== data.type) throw new AppError('CATEGORY_TYPE_MISMATCH', 400);

    // 2. Crear movimiento
    const movement = await Movement.create([{ ...data, userId }], { session });
    
    // 3. Actualizar balance cuenta
    const amountChange = data.type === 'income' ? data.amount : -data.amount;
    account.currentBalance += amountChange;
    await account.save({ session });

    // 4. Actualizar presupuesto si es gasto
    if (data.type === 'expense') {
      const budget = await Budget.findOneAndUpdate(
        { userId, categoryId: data.categoryId, year: new Date(data.date).getFullYear(), month: new Date(data.date).getMonth() + 1 },
        { $inc: { spent: data.amount } },
        { new: true, upsert: true, session }
      );
    }

    await session.commitTransaction();
    return movement[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

---

## 9. Agregaciones Clave para Dashboard

### 9.1 Resumen Mensual
```javascript
// Input: userId, year, month
// Output: { income, expense, balance, incomeCount, expenseCount }
```

### 9.2 Evolución 12 Meses
```javascript
// Output: [{ year, month, income, expense, balance }, ...]
```

### 9.3 Top Categorías Gasto
```javascript
// Output: [{ categoryId, name, color, icon, total, count }, ...] (limit 10)
```

### 9.4 Comparativa Mes Anterior
```javascript
// Output: { current: {income, expense}, previous: {income, expense}, variation: {incomePct, expensePct} }
```

---

## 10. Consideraciones de Rendimiento

1. **Paginación obligatoria**: `limit` máximo 100, default 20
2. **Proyección**: `select('name color icon')` en poblaciones
3. **Índices cubiertos**: Queries frecuentes usan índices compuestos
4. **Agregaciones en servidor**: No traer documentos completos para cálculos
5. **Conexión pooling**: `maxPoolSize: 10` en URI MongoDB
6. **Read preference**: `secondaryPreferred` para reportes (futuro replica set)