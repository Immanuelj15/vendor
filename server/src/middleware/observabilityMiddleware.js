import crypto from 'crypto';

export const observabilityMiddleware = (req, res, next) => {
  req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('x-request-id', req.requestId);

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;

    // Filter sensitive info from query string / path
    let safeUrl = originalUrl;
    if (safeUrl.includes('password') || safeUrl.includes('token') || safeUrl.includes('secret')) {
      safeUrl = safeUrl.split('?')[0] + '? [SENSITIVE DATA FILTERED]';
    }

    console.log(
      `[${new Date().toISOString()}] [reqId:${req.requestId}] ${method} ${safeUrl} Status:${statusCode} - ${duration}ms`
    );
  });

  next();
};
