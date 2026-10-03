import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('========================================================');
console.log('  STARTING VENDORGATE FULL-STACK DEMO ENVIRONMENT');
console.log('========================================================');

const server = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true,
});

const client = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit',
  shell: true,
});

process.on('SIGINT', () => {
  console.log('\nShutting down VendorGate services...');
  server.kill('SIGINT');
  client.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  server.kill('SIGTERM');
  client.kill('SIGTERM');
  process.exit(0);
});
