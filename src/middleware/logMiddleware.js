const connectToMongo = require("../modules/mongodb");

const logMiddleware = async (req, res, next) => {
   res.on('finish', async () => {
      try {
         // 클라이언트의 IP 주소
         const clientIP = req.ip || req.connection.remoteAddress;
         // userId
         const userId = req.decoded ? req.decoded.id : null;
         // 클라이언트가 요청한 호스트
         const host = req.get('host');
         // 프로토콜 (HTTP 또는 HTTPS)
         const protocol = req.protocol;
         // 요청된 경로
         const path = req.path;
         // REST 방식 (GET, POST 등)
         const method = req.method;
         // Query parameters
         const query = req.query;
         // 요청 바디
         const requestBody = req.body;
         //오류 로그 출력
         const status = res.locals.error ? res.locals.error.status : res.statusCode;
         const stackTrace = res.locals.error ? res.locals.error.stack : null;
         const message = res.locals.error ? res.locals.error.message : null;

         let clientErrorInfo = null;
         if (status >= 400 && status < 600 && !message) {
            const errors = res.locals.error ? res.locals.error.errors : null;
            console.log('Client Error:', errors);
            clientErrorInfo = { errors: errors || "Unknown client error" };
         }

         const requestInfo = {
            clientIP,
            userId,
            host,
            protocol,
            path,
            method,
            query,
            requestBody,
            response: res.locals.response,
            timestamp: new Date(),
            status,
            stackTrace,
            message,
            clientErrorInfo
         };
         console.log(requestInfo);

         // MongoDB 연결 및 로그 삽입
         try {
            const conn = await connectToMongo();
            await conn.db("homework").collection("log").insertOne(requestInfo);
            console.log("업로드 성공");
         } catch (e) {
            console.error("MongoDB 연결 오류:", e.message);
         }
      } catch (error) {
         console.error("오류 발생:", error.message);
         console.log(error);
      }
   });
   next();
};

module.exports = logMiddleware;
