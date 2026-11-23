export const injectOwnerFilter = (req, res, next) => {
  if (!req.user) {
    return next();
  }

  const ownerId = req.user.id;

  req.query = { ...req.query, userId: ownerId };

  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    req.body = { ...req.body, userId: ownerId };
  }

  if (req.params.categoryId) {
    req.query.categoryId = req.params.categoryId;
  }
  if (req.params.accountId) {
    req.query.accountId = req.params.accountId;
  }
  if (req.params.budgetId) {
    req.query.budgetId = req.params.budgetId;
  }

  next();
};