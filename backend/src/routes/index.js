import authRoutes from './authRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import accountRoutes from './accountRoutes.js';
import movementRoutes from './movementRoutes.js';
import budgetRoutes from './budgetRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import reportRoutes from './reportRoutes.js';
import adminRoutes from './adminRoutes.js';

export const setupRoutes = (app) => {
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/categories', categoryRoutes);
  app.use('/api/v1/accounts', accountRoutes);
  app.use('/api/v1/movements', movementRoutes);
  app.use('/api/v1/budgets', budgetRoutes);
  app.use('/api/v1/dashboard', dashboardRoutes);
  app.use('/api/v1/reports', reportRoutes);
  app.use('/api/v1/admin', adminRoutes);
};