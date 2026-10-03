import app from './app.js';

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`  VENDORGATE BACKEND REST API SERVER ONLINE`);
  console.log(`  Port: ${PORT}`);
  console.log(`  URL:  http://localhost:${PORT}`);
  console.log(`  API Health: http://localhost:${PORT}/api/health`);
  console.log('====================================================');
});
