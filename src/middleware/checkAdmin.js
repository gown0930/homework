const checkAdmin = (req, res, next) => {
   const user = req.session.user;
   if (!user) {
      res.status(200).send("세션이 없습니다");
   }
   // 사용자가 관리자 권한을 가지고 있는지 확인
   if (user && user.isAdmin) {
      // 권한이 있는 경우 다음 미들웨어로 이동
      next();
   } else {
      // 권한이 없는 경우 에러 응답
      res.status(403).send("권한이 없습니다." + user.isAdmin);
   }
};
module.exports = checkAdmin