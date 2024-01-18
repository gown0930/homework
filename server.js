const express = require("express");
require("dotenv").config()
const logMiddleware = require('./src/middleware/logMiddleware');
const createResult = require("./src/modules/result");

const accountApi = require("./src/routers/account");
const postApi = require("./src/routers/post");
const commentApi = require("./src/routers/comment");
const logListApi = require("./src/routers/logList");

const redis = require("redis").createClient();
const cron = require('node-cron');
const { queryDatabase } = require("./src/modules/connection");

const app = express();
const port = 8000;

app.use(express.json());

app.use(logMiddleware);

app.use("/account", accountApi);
app.use("/post", postApi);
app.use("/comment", commentApi);
app.use("/logList", logListApi);

// error handler
app.use((err, req, res, next) => {
   console.error(err.stack);
   res.locals.error = err;
   res.status(err.status || 500).send(createResult(err.message || '에러가 발생했습니다.'));
});
// cron job 설정 (매 1분에 실행하는거 : '*/1 * * * *' )
cron.schedule('0 * * * *', async () => {
   try {
      await redis.connect();

      // 현재 접속자 수 가져오기
      const count = await redis.SCARD(`countLogin`);

      // PostgreSQL에 삽입할 쿼리 작성
      const insertQuery = `
      INSERT INTO homework.count (count)
      VALUES ($1)
    `;

      // PostgreSQL에 삽입
      await queryDatabase(insertQuery, [count]);
      // 동시 사용자 수를 0으로 초기화
      await redis.DEL(`countLogin`);

      console.log(`PostgreSQL에 접속자 업로드 완료: ${count}`);
   } catch (error) {
      console.error('에러:', error);
   } finally {
      redis.disconnect();
   }
});

// 웹 서버 실행
app.listen(port, () => {
   console.log(`${port}번에서 HTTP 웹 서버 실행`);
});



