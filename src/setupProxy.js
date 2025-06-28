const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://spssapi-hxfzbchrcafgd2hg.southeastasia-01.azurewebsites.net',
      changeOrigin: true,
      secure: true,
      logLevel: 'debug',
      onProxyReq: function(proxyReq, req, res) {
        console.log('Proxying request:', req.method, req.url);
      },
      onError: function(err, req, res) {
        console.error('Proxy error:', err);
      }
    })
  );
}; 