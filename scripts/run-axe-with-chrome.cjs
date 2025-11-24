const { spawn } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
// If localhost isn't reachable from headless tools, use a network address Vite reported.
// Update this IP if your machine's network interface differs.
const devHost = process.env.DEV_HOST || 'http://192.168.1.17:3000';
const script = path.join(__dirname, 'axe-playwright.mjs');

console.log('Using CHROME_PATH =', chromePath);
console.log('Using BASE_URL =', devHost);

const child = spawn(process.execPath, [script], {
  env: Object.assign({}, process.env, { CHROME_PATH: chromePath, BASE_URL: devHost }),
  stdio: 'inherit',
});

child.on('close', code => {
  console.log('Child exited with code', code);
  process.exit(code);
});
