// =============================================================================
// PM2 PRODUCTION CONFIGURATION FOR EXAM PLATFORM
// =============================================================================
// This ecosystem file configures PM2 for production deployment
// Usage:
//   pm2 start ecosystem.config.js --env production
//   pm2 reload ecosystem.config.js --env production
//   pm2 save (to persist configuration)
// =============================================================================

module.exports = {
  apps: [
    {
      // Application name
      name: "examsJeff",

      // Application entry point
      script: "node_modules/next/dist/bin/next",
      args: "start",

      // Working directory
      cwd: process.env.HOME + "/examsJeff",

      // Instances (cluster mode for better performance)
      // Set to 0 or 'max' to spawn as many instances as CPU cores
      // For exam platform: use 2-4 instances to balance load and memory
      instances: 2,
      exec_mode: "cluster",

      // Environment variables
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },

      // Process management
      autorestart: true,
      watch: false, // Don't watch files in production
      max_memory_restart: "500M", // Restart if memory exceeds 500MB
      min_uptime: "10s", // Minimum uptime before considered successful
      max_restarts: 10, // Max restarts within 1 minute
      restart_delay: 4000, // Delay between restarts (ms)

      // Logging
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: process.env.HOME + "/examsJeff/logs/pm2-error.log",
      out_file: process.env.HOME + "/examsJeff/logs/pm2-out.log",
      merge_logs: true,
      log_type: "json",

      // Advanced features
      listen_timeout: 10000, // Time to wait for app to be ready (ms)
      kill_timeout: 5000, // Time to wait before force killing (ms)
      wait_ready: false, // Don't wait for process.send('ready')

      // Source map support
      source_map_support: true,

      // Instance variables (accessible in app via process.env)
      instance_var: "INSTANCE_ID",

      // Graceful shutdown
      shutdown_with_message: false,

      // Cron restart (optional: restart every day at 4 AM)
      // cron_restart: "0 4 * * *",

      // Health monitoring
      pmx: true,

      // Crash analysis
      post_update: ["npm install", "npm run build"],
    },
  ],

  // Deployment configuration (optional)
  deploy: {
    production: {
      user: "ubuntu",
      host: "exams.jeff.az",
      ref: "origin/main",
      repo: "git@github.com:yourusername/aimentor.git",
      path: process.env.HOME + "/examsJeff",
      "post-deploy":
        "npm ci && npx prisma generate && npx prisma migrate deploy && npm run build && pm2 reload ecosystem.config.js --env production",
      env: {
        NODE_ENV: "production",
      },
    },
  },
};
