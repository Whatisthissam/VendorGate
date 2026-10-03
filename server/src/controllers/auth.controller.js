import { store } from '../data/store.js';

export function getDemoUsers(req, res) {
  const users = store.getUsers();
  res.json({
    success: true,
    data: users,
  });
}

export function loginDemoUser(req, res) {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required to authenticate demo user.',
    });
  }

  const user = store.getUserById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: `Demo user with ID '${userId}' not found.`,
    });
  }

  // Record audit log for demo session login
  store.addAuditLog({
    userName: user.name,
    userRole: user.role,
    action: 'USER_LOGIN',
    entityType: 'AUTHENTICATION',
    entityId: user.id,
    description: `User '${user.name}' logged in as [${user.role}]${user.approvalLevel ? ` (Approval Level ${user.approvalLevel})` : ''}.`,
  });

  res.json({
    success: true,
    message: `Logged in as ${user.name} (${user.role})`,
    data: user,
  });
}

export function getCurrentUser(req, res) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No active demo session.',
    });
  }
  res.json({
    success: true,
    data: req.user,
  });
}

export function resetDemoData(req, res) {
  store.reset();
  store.addAuditLog({
    userName: req.user ? req.user.name : 'System Admin',
    userRole: req.user ? req.user.role : 'ADMIN',
    action: 'DEMO_DATA_RESET',
    entityType: 'SYSTEM',
    entityId: 'SYS_RESET',
    description: 'Demo store restored to original seed state with all test cases and boundary conditions.',
  });

  res.json({
    success: true,
    message: 'Demo dataset successfully restored to original seed state.',
  });
}
