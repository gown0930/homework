const { isBlacklisted } = require("../modules/blackList");
const jwt = require("jsonwebtoken");
const checkLogout = (req, res, next) => {
   const { token } = req.headers
   const result = {
      success: false,
      message: ""
   }
   try {
      if (token) {
         console.log("토큰" + token)
         throw new Error("token is already Exist")
      }
      if (isBlacklisted(token)) {
         throw new Error("blacklisted token");
      }
      next()
   } catch (err) {
      if (err.message === "token is already Exist") {
         result.message = "이미 로그인이 되어있습니다.";
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
module.exports = checkLogout