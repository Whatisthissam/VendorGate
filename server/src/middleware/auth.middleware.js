import { store } from '../data/store.js';

export function authMiddleware(req, res, next) {
  // Demo authentication: clients can pass 'x-user-id' header or body/query param
  const userId = req.headers['x-user-id'] || req.query.userId || (req.body && req.body.currentUserId);

  if (userId) {
    const user = store.getUserById(userId);
    if (user) {
      req.user = user;
    }
  }

  // If no user found via id, check if fallback role is provided (e.g. 'x-user-role')
  if (!req.user && req.headers['x-user-role']) {
    const role = req.headers['x-user-role'];
    const matchedUser = store.getUsers().find(u => u.role === role);
    if (matchedUser) {
      req.user = matchedUser;
    }
  }

  next();
}

/**
 * Role-based permission guard
 * @param  {...string} allowedRoles 
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please select or log in as a demo user.',
      });
    }

    if (!allowedRoles.includes(req.user.role) && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' lacks permission for this action. Allowed: [${allowedRoles.join(', ')}]`,
      });
    }

    next();
  };
}
