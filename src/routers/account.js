const router = require("express").Router()
const { queryDatabase } = require("../modules/connection");
const createResult = require("../modules/result");
const createValidationMiddleware = require('../middleware/validate');
const checkIdDuplicate = require('../middleware/checkIdDuplicate');
const checkPhoneDuplicate = require('../middleware/checkPhoneDuplicate');
const checkPasswordMatch = require('../middleware/checkPasswordMatch');

const checkLogin = require("../middleware/checkLogin")
const checkLogout = require("../middleware/checkLogout")
const { addToBlacklist } = require("../modules/blackList");

const redis = require("redis").createClient();
const jwt = require("jsonwebtoken");
//===========로그인 & 회원가입 ===============
// 로그인
router.post('/login', checkLogout, createValidationMiddleware(['id', 'pw']), async (req, res, next) => {
   const { id, pw } = req.body;
   const result = createResult();

   try {
      // 로그인 처리
      const sql = `SELECT * FROM homework.user WHERE id = $1 AND password = $2`;
      const rows = await queryDatabase(sql, [id, pw]);

      if (!rows || rows.length === 0) {
         const error = new Error('아이디 또는 비밀번호가 일치하지 않습니다.');
         error.status = 401;
         throw error;
      }

      const login = rows[0];

      await redis.connect();

      await redis.SADD(`countLogin`, login.id)
      console.log("추가됨")
      const token = jwt.sign({
         idx: login.idx,
         id: login.id,
         name: login.name,
         phone_num: login.phone_num,
         email: login.email,
         isAdmin: login.isadmin

      }, process.env.SECRET_KEY, {
         issuer: "haeju",
         expiresIn: "30m"
      });
      result.data.token = token;

      // Redis에 expire time 설정 넉넉하게 2시간
      await redis.EXPIRE(`countLogin`, 7200);

      const count = await redis.SCARD(`countLogin`);
      result.data.count = `누적 접속자 수: ${count}`;
      console.log(count)
      res.locals.response = result;
      res.status(200).send(result);
   } catch (error) {
      next(error);
   } finally {
      redis.disconnect()
   }
});

// 로그아웃
router.post("/logout", (req, res, next) => {
   const result = createResult();

   try {
      const { token } = req.headers;

      // 블랙리스트에 토큰 추가
      addToBlacklist(token);

      // 클라이언트에서 토큰을 삭제하도록 응답
      result.message = '로그아웃이 완료되었습니다.';
      res.status(200).json(result);
   } catch (error) {
      next(error)
   }
});

// 회원가입
router.post("/signup",
   checkLogout,
   createValidationMiddleware(['id', 'pw', 'name', 'phone_num', 'email']),
   checkIdDuplicate,
   checkPhoneDuplicate,
   checkPasswordMatch,
   async (req, res) => {
      const { id, pw, name, phone_num, email, isadmin } = req.body;
      const result = createResult();

      try {
         // 회원가입 처리
         const insertUserSql = "INSERT INTO homework.user (id, password, name, phone_num, email, isadmin) VALUES ($1, $2, $3, $4, $5, $6)";
         await queryDatabase(insertUserSql, [id, pw, name, phone_num, email, isadmin]);
         res.locals.response = result;
         return res.status(200).send(result);
      } catch (error) {
         next(error);
      }
   });

// 아이디 찾기
router.get("/find-id", checkLogout, createValidationMiddleware(['name', 'phone_num', 'email']), async (req, res, next) => {
   const { name, phone_num, email } = req.query;
   const result = createResult();

   try {

      // db 처리로 id 가져오기
      const findIdSql = "SELECT id FROM homework.user WHERE name = $1 AND phone_num = $2 AND email = $3";
      const results = await queryDatabase(findIdSql, [name, phone_num, email]);

      if (results.length === 0) {
         return res.status(200).send(createResult('일치하는 사용자가 없습니다.'));
      }

      // 결과에서 아이디 추출
      const foundId = results[0].id;
      result.data = { foundId };
      res.locals.response = result;
      return res.status(200).send(result);
   } catch (error) {
      next(error);
   }
});

// 비밀번호 찾기
router.get("/find-pw", checkLogout, createValidationMiddleware(['id', 'name', 'phone_num', 'email']), async (req, res, next) => {
   const { id, name, phone_num, email } = req.query;
   const result = createResult();

   try {

      // 비밀번호를 가져오기 위한 쿼리
      const getPasswordSql = "SELECT password FROM homework.user WHERE id = $1 AND name = $2 AND phone_num = $3 AND email = $4";
      const results = await queryDatabase(getPasswordSql, [id, name, phone_num, email]);

      if (results.length === 0) return res.status(200).send(createResult('일치하는 사용자가 없습니다.'));

      // 결과에서 비밀번호 추출
      const foundPassword = results[0].password;
      result.data = { foundPassword };
      res.locals.response = result;
      return res.status(200).send(result);
   } catch (error) {
      next(error);
   }
});

//============내 정보================
// 내 정보 보기
router.get("/", checkLogin, async (req, res, next) => {
   const result = createResult();
   try {
      const { idx } = req.decoded;

      // 사용자 정보를 조회하는 쿼리
      const getUserInfoQuery = `
         SELECT * FROM homework.user
         WHERE idx = $1
      `;
      // queryDatabase 함수를 사용하여 쿼리 실행
      const userInfo = await queryDatabase(getUserInfoQuery, [idx]);

      // 조회된 사용자 정보를 결과에 추가
      result.data = userInfo;

      // 응답 전송
      res.locals.response = result;
      res.status(200).send(result);
   } catch (error) {
      next(error);
   }
});

// 내 정보 수정
router.put("/",
   checkLogin,
   checkPhoneDuplicate,
   createValidationMiddleware(['pw', 'name', 'phone_num', 'email']),
   async (req, res, next) => {
      const result = createResult();

      try {
         const { idx } = req.decoded;
         const { name, phone_num, email, pw } = req.body;

         // DB 통신 - 사용자 정보 수정
         const updateUserSql = "UPDATE homework.user SET password = $1, phone_num = $2, email = $3, name = $4 WHERE idx = $5";
         await queryDatabase(updateUserSql, [pw, phone_num, email, name, idx]);
         res.locals.response = result;
         return res.status(200).send(result);
      } catch (error) {
         next(error);
      }
   });

// 회원 탈퇴
router.delete("/", checkLogin, async (req, res, next) => {
   const result = createResult();

   try {
      const { idx } = req.decoded;

      const deleteSql = "DELETE FROM homework.user WHERE idx = $1";
      await queryDatabase(deleteSql, [idx]);
      res.locals.response = result;
      return res.status(200).send(result);
   } catch (error) {
      next(error);
   }
});




module.exports = router