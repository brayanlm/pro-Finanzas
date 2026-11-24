export const injectOwnerFilter = (req, res, next) => {
  if (!req.user) {
    return next();
  }

  const ownerId = req.user.id;

  // No mutar req.query (getter en Express 5)
  req.ownerFilter = { userId: ownerId };

  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    req.body = { ...req.body, userId: ownerId };
  }

  // Agregar params como filtros
  if (req.params.categoryId) {
    req.ownerFilter.categoryId = req.params.categoryId;
  }
  if (req.params.accountId) {
    req.ownerFilter.accountId = req.params.accountId;
  }
  if (req.params.budgetId) {
    req.ownerFilter.budgetId = req.params.budgetId;
  }

  next();
};