const connectedUsers = new Set();

const finish = (req, res, next) => {

   const userIdx = req.decoded ? req.decoded.idx : null;
   const username = req.decoded ? req.decoded.name : null;
   console.log(userIdx + "," + username)
   // 중복 로그인 확인
   if (connectedUsers.has(userIdx)) {
      return res.status(200).send({ message: `이미 로그인된 사용자입니다. 현재 누적 접속자 수: ${connectedUsers.size}` });
   }

   // 새로운 로그인 시, 접속자 수 증가, 사용자 추가
   connectedUsers.add(userIdx);
   res.status(200).send({ message: `${username}님, 환영합니다! 현재 누적 접속자 수: ${connectedUsers.size}` });

   // 로그인 완료 후 동작 실행
   console.log(`${username}님의 로그인이 완료되었습니다.`);
   // 추가로 실행할 로직을 여기에 추가

   next(); // 다음 미들웨어로 이동
};

module.exports = {
   handleLogin: finish,
   getTotalConnectedUsers: () => connectedUsers.size,
};
