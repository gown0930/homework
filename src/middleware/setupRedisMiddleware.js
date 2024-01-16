const redis = require('redis');
const setupRedisMiddleware = (req, res, next) => {
   req.redis = redis.createClient();

   req.redis.on('connect', () => {
      console.log('Redis에 연결되었습니다.');
      next();
   });
   req.redis.on('error', (err) => {
      console.error(`Redis 연결 오류: ${err}`);
      next(err);
   });
};

module.exports = { setupRedisMiddleware };