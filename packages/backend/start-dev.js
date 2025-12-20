console.log("🚀 Starting CRM Backend in development mode...");
require('child_process').spawn('node', ['--loader', 'tsx', 'src/app.ts'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' }
});
