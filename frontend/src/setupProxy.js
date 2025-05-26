const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
      pathRewrite: {
        '^/api': '/api'
      },
      onError: (err, req, res) => {
        console.error('Proxy Error:', err);
        res.status(500).json({ message: 'Proxy Error', error: err.message });
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('Proxy Response:', {
          status: proxyRes.statusCode,
          path: req.path,
          method: req.method
        });
      }
    })
  );
};
