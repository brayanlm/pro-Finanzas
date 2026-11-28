import mongoose from 'mongoose';
import { roundMoney } from '../utils/money.js';

const ACCOUNT_TYPES = ['cash', 'bank', 'savings', 'debit_card', 'credit_card', 'other'];

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
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
    set: (v) => (v === undefined || v === null ? v : (Number.isFinite(Number(v)) ? roundMoney(v) : v)),
    validate: {
      validator: Number.isFinite,
      message: 'Saldo inicial debe ser un número válido'
    }
  },
  currentBalance: {
    type: Number,
    default: 0,
    set: (v) => (v === undefined || v === null ? v : (Number.isFinite(Number(v)) ? roundMoney(v) : v)),
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
  creditLimit: {
    type: Number,
    validate: {
      validator: function(v) {
        return this.type !== 'credit_card' || (v !== undefined && v > 0);
      },
      message: 'Límite de crédito requerido para tarjetas de crédito'
    }
  },
  bankName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  lastFourDigits: {
    type: String,
    match: /^\d{4}$/,
    maxlength: 4
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

accountSchema.index({ userId: 1, isActive: 1 });
accountSchema.index({ userId: 1, name: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

accountSchema.virtual('movements', {
  ref: 'Movement',
  localField: '_id',
  foreignField: 'accountId'
});

accountSchema.methods.recalculateBalance = async function(session = null) {
  const Movement = mongoose.model('Movement');
  const agg = await Movement.aggregate([
    { $match: { accountId: this._id, userId: this.userId, deletedAt: null } },
    { $group: {
      _id: null,
      income: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
      expense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } }
    }},
    { $project: { balance: { $subtract: ['$income', '$expense'] } } }
  ]).session(session);

  const calculatedBalance = roundMoney(this.initialBalance + (agg[0]?.balance || 0));
  this.currentBalance = calculatedBalance;
  await this.save({ session });
  return calculatedBalance;
};

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

export default mongoose.model('Account', accountSchema);