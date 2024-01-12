const connectToMongo = require("../modules/mongodb");

const logMiddleware = async (req, res, next) => {
   res.on('finish', async () => {
      try {
         // 클라이언트의 IP 주소
         const clientIP = req.ip || req.connection.remoteAddress;
         // userId
         const userId = req.session.user ? req.session.user.id : null;
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


         // 정보를 객체로 담기
         const requestInfo = {
            clientIP,
            userId,
            host,
            protocol,
            path,
            method,
            query,
            requestBody,
            response: res.locals.response, // 보낸값
            timestamp: new Date() // 시간
         };
         console.log(requestInfo);

         // MongoDB 연결 및 로그 삽입
         try {
            const conn = await connectToMongo();
            await conn.db("homework").collection("log").insertOne(requestInfo);
            console.log("업로드 성공");
         } catch (e) {
            console.error("MongoDB 연결 오류:", e.message);
            requestInfo.stackTrace = e.stack;//stack trace 추가
         }
      } catch (error) {
         console.error("오류 발생:", error.message);
         console.log(error);
         requestInfo.stackTrace = error.stack;//stack trace 추가
      }
   });
   next();
};

module.exports = logMiddleware;
