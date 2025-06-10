module.exports = {
  apps: [
    {
      name: 'bowen-tattoo-backend',
      script: 'dist/server.js',
      cwd: './',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
    },
    {
      name: 'bowen-tattoo-frontend', 
      script: 'npm',
      args: 'start',
      cwd: './',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
    }
  ]
}; 