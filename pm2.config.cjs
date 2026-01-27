module.exports = {
  apps: [
    {
      name: 'surreal',
      script: 'surreal',
      args: 'start --user root --pass root --bind 0.0.0.0:8080 ./.open-context/database/surrealdb',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      error_file: './.open-context/logs/surreal-error.log',
      out_file: './.open-context/logs/surreal-out.log',
      log_file: './.open-context/logs/surreal-combined.log',
      time: true
    }
  ]
};
