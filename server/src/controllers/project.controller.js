import { store } from '../data/store.js';

export function getProjectOverview(req, res) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: The Academic Project Overview (59-Day CPM) is restricted to Administrator access only.',
    });
  }

  const metadata = store.getProjectMetadata();
  res.json({
    success: true,
    data: metadata,
  });
}
