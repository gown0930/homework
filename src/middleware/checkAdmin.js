const jwt = require('jsonwebtoken');

const checkAdmin = (req, res, next) => {
   // 토큰이 요청 헤더에 있는지 확인
   const { token } = req.headers;
   if (!token) {
      res.status(401).send("인증되지 않은 사용자입니다");
      return;
   }

   try {
      // 토큰을 검사하고 해독
      const decodedToken = jwt.verify(token, process.env.SECRET_KEY);

      // 사용자가 관리자 권한을 가지고 있는지 확인
      if (decodedToken.isAdmin) {
         next();
      } else {
         // 권한이 없는 경우 에러 응답
         res.status(403).send("권한이 없습니다. " + decodedToken.isAdmin);
      }
   } catch (error) {
      // 토큰이 유효하지 않은 경우 에러 응답
      res.status(401).send("토큰이 유효하지 않습니다");
   }
};

module.exports = checkAdmin;
