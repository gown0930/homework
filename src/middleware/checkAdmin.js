const jwt = require('jsonwebtoken');

const checkAdmin = (req, res, next) => {
   const { token } = req.headers;

   if (!token) {
      const error = new Error("인증되지 않은 사용자입니다");
      error.status = 401;
      return next(error); // 에러를 next()로 전달
   }

   try {
      const decodedToken = jwt.verify(token, process.env.SECRET_KEY);

      if (decodedToken.isAdmin) {
         next();
      } else {
         const error = new Error("권한이 없습니다.");
         error.status = 403;
         return next(error); // 에러를 next()로 전달
      }
   } catch (error) {
      const invalidTokenError = new Error("토큰이 유효하지 않습니다");
      invalidTokenError.status = 401;
      return next(invalidTokenError); // 에러를 next()로 전달
   }
};

module.exports = checkAdmin;
