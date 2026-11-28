// Seed seguro e idempotente. NO borra ni sobrescribe datos existentes.
// - Crea categorías por defecto solo para usuarios que no tengan ninguna.
// - Crea la cuenta "Efectivo" inicial solo si el usuario no tiene ninguna cuenta.
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/database.js';
import { loadConfig } from '../src/config/env.js';
import User from '../src/models/User.js';
import Category from '../src/models/Category.js';
import Account from '../src/models/Account.js';

const run = async () => {
  loadConfig(); // valida variables de entorno al iniciar
  await connectDB();

  const users = await User.find({}, { _id: 1, preferences: 1 }).lean();
  let categoriesCreated = 0;
  let accountsCreated = 0;

  for (const user of users) {
    const userId = user._id;

    const catCount = await Category.countDocuments({ userId });
    if (catCount === 0) {
      const docs = Category.getDefaultCategories().map((c) => ({ ...c, userId, isDefault: true }));
      await Category.insertMany(docs, { ordered: false });
      categoriesCreated += docs.length;
    }

    const accCount = await Account.countDocuments({ userId });
    if (accCount === 0) {
      await Account.create({
        userId,
        name: 'Efectivo',
        type: 'cash',
        initialBalance: 0,
        currentBalance: 0,
        currency: user.preferences?.currency || 'EUR'
      });
      accountsCreated += 1;
    }
  }

  console.log(
    `Seed completado. Usuarios=${users.length} categoríasCreadas=${categoriesCreated} cuentasCreadas=${accountsCreated}`
  );
};

run()
  .catch((err) => {
    console.error('Seed fallido:', err?.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
    await mongoose.disconnect();
  });
