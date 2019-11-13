    module.exports = [
      {
        path: '/v1',
        rule: { target: 'http://localhost:8010/',
          changeOrigin: true }
      }
    ]
