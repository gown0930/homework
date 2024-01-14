const express = require("express");
const session = require("express-session");
require("dotenv").config()
const logMiddleware = require('./src/middleware/logMiddleware');
const createResult = require("./src/modules/result");

const accountApi = require("./src/routers/account");
const postApi = require("./src/routers/post");
const commentApi = require("./src/routers/comment");
const logListApi = require("./src/routers/logList");

const app = express();
const port = 8000;

app.use(express.json());

app.use(logMiddleware);

app.use("/account", accountApi);
app.use("/post", postApi);
app.use("/comment", commentApi);
app.use("/logList", logListApi);

// error handler
app.use((err, req, res) => {
   console.error(err.stack);
   res.status(err.status || 500).send(createResult(err.message || '에러가 발생했습니다.'));
});

// 웹 서버 실행
app.listen(port, () => {
   console.log(`${port}번에서 HTTP 웹 서버 실행`);
});



