const express = require("express");
require("dotenv").config()
const logMiddleware = require('./src/middleware/logMiddleware');
const createResult = require("./src/modules/result");

const accountApi = require("./src/routers/account");
const postApi = require("./src/routers/post");
const commentApi = require("./src/routers/comment");
const logListApi = require("./src/routers/logList");

const cron = require('node-cron');
const { uploadCountToPostgres } = require('./src/modules/uploadToPostgres');

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
   await uploadCountToPostgres();
});

// 웹 서버 실행
app.listen(port, () => {
   console.log(`${port}번에서 HTTP 웹 서버 실행`);
});



