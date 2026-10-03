import { store } from '../data/store.js';

export function getAuditLogs(req, res) {
  // Vendors cannot inspect internal audit logs
  if (req.user?.role === 'VENDOR') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Audit logs are reserved for internal compliance and governance personnel.',
    });
  }

  const { entityType, userRole, search } = req.query;
  const logs = store.getAuditLogs({ entityType, userRole, search });

  res.json({
    success: true,
    count: logs.length,
    data: logs,
  });
}
