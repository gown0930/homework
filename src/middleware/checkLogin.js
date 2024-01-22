const { isBlacklisted } = require("../modules/blackList");
const jwt = require("jsonwebtoken");
const checkLogout = (req, res, next) => {
   const { token } = req.headers;
   const result = {
      success: false,
      message: ""
   };

   try {
      if (isBlacklisted(token)) {
         const error = new Error("blacklisted token");
         error.status = 401;
         throw error;
      }
      if (!token) {
         const error = new Error("no token");
         error.status = 400;
         throw error;
      }
      req.decoded = jwt.verify(token, process.env.SECRET_KEY)
      next(); // 에러가 발생하지 않으면 다음 미들웨어로 이동
   } catch (err) {
      if (err.message === "no token") {
         result.message = "로그인이 필요합니다";
      } else if (err.message === "jwt expired") {
         result.message = "토큰이 만료되었습니다.";
      } else if (err.message === "invalid token") {
         result.message = "유효하지 않은 토큰입니다.";
      } else if (err.message === "blacklisted token") {
         result.message = "로그아웃 된 토큰입니다.";
      } else {
         result.message = err.message;
      }

      res.send(result)
   }
}

module.exports = checkLogout;

