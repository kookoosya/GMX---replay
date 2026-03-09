module.exports = {
  apps: [
    {
      name: "gmxreply-backend",
      script: "index.js",
      cwd: __dirname,
      interpreter: "node",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      restart_delay: 4000,
      min_uptime: "10s",
      max_restarts: 20,
      exp_backoff_restart_delay: 200,
      out_file: "logs/pm2-out.log",
      error_file: "logs/pm2-error.log",
      merge_logs: true,
      env: {
        NODE_ENV: process.env.NODE_ENV || "production"
      }
    }
  ]
};
