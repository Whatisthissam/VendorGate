import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { authMiddleware } from './middleware/auth.middleware.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';

import authRoutes from './routes/auth.routes.js';
import vendorRoutes from './routes/vendor.routes.js';
import documentRoutes from './routes/document.routes.js';
import poRoutes from './routes/po.routes.js';
import auditRoutes from './routes/audit.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import projectRoutes from './routes/project.routes.js';

const app = express();

// Global Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-role'],
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(authMiddleware);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'VendorGate API',
    timestamp: new Date().toISOString(),
    environment: 'Academic Prototype / Demo',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', authRoutes); // supports POST /api/admin/reset
app.use('/api/vendors', vendorRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/purchase-orders', poRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/project', projectRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
