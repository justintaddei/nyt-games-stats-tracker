module.exports = {
  apps: [
    {
      name: 'nyt-games',
      exec_mode: 'fork',
      instances: 1,
      script: './dist/index.js',
      env: { NODE_OPTIONS: '--max-old-space-size=256' },
    },
  ],
};
