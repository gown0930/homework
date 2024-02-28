const router = require("express").Router();
const { queryDatabase } = require("../modules/connection");
const checkLogin = require("../middleware/checkLogin")
const createResult = require("../modules/result")
const createValidationMiddleware = require('../middleware/validate');

//=========댓글=============

//postIdx body로 받아오기

// 댓글 쓰기
router.post("/", checkLogin, createValidationMiddleware(['content']), async (req, res, next) => {
   const result = createResult();

   try {
      const { idx } = req.decoded;
      const { post_idx, content } = req.body;

      const addCommentQuery = "INSERT INTO homework.comment (comment, user_idx, post_idx) VALUES ($1, $2, $3) RETURNING *";

      // 댓글 작성 쿼리 실행
      const addCommentResult = await queryDatabase(addCommentQuery, [content, idx, post_idx]);

      if (!addCommentResult || addCommentResult.length === 0) {
         return res.status(500).send(createResult("댓글 작성 중 에러가 발생하였습니다."));
      }


      const addNotificationQuery = `WITH post_user AS (
                                       SELECT user_idx 
                                       FROM homework.post 
                                       WHERE idx = $1
                                    )
                                    INSERT INTO homework.notification (user_idx, content)
                                    SELECT user_idx, $2 AS content
                                    FROM post_user`;
      await queryDatabase(addNotificationQuery, [post_idx, `새로운 댓글이 작성되었습니다: ${content}`]);



      res.locals.response = result;
      return res.status(200).send(result);

   } catch (error) {
      next(error);
   }
});

// 본인의 알람 목록 출력하는 API
router.get("/notifications", checkLogin, async (req, res, next) => {
   const result = createResult();

   try {
      const { idx } = req.decoded;

      // 사용자의 알람 조회 쿼리 실행
      const getNotificationsQuery = "SELECT * FROM homework.notification WHERE user_idx = $1";
      const notifications = await queryDatabase(getNotificationsQuery, [idx]);

      if (!notifications || notifications.length === 0) {
         return res.status(404).send(createResult(idx + "알람이 없습니다."));
      }

      result.notifications = notifications;
      res.locals.response = result;
      res.status(200).send(result);


   } catch (error) {
      next(error);
   }
});

// 댓글 보기
router.get("/", checkLogin, async (req, res, next) => {
   const result = createResult();
   try {
      const { post_idx } = req.query;

      const getCommentsQuery = `
         SELECT 
            c.idx, 
            c.comment, 
            c.user_idx, 
            TO_CHAR(c.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH:MI AM') AS created_at,
            u.id as user_id
         FROM 
            homework.comment c
         JOIN 
            homework.user u ON c.user_idx = u.idx
         WHERE 
            c.post_idx = $1 
         ORDER BY 
            c.idx DESC
      `;

      // 댓글 조회 쿼리 실행
      const comments = await queryDatabase(getCommentsQuery, [post_idx]);

      result.comments = comments;
      res.locals.response = result;
      res.status(200).send(result);
   } catch (error) {
      next(error);
   }
});


// 댓글 수정
router.put("/:commentIdx", checkLogin, createValidationMiddleware(['content']), async (req, res, next) => {
   const commentIdx = req.params.commentIdx;
   const { post_idx, content } = req.body;
   const result = createResult();
   const { idx } = req.decoded;
   try {
      const user = req.user;
      validation.validateContent(content);
      const updateCommentQuery = "UPDATE homework.comment SET comment = $1, created_at = CURRENT_TIMESTAMP WHERE idx = $2 AND user_idx = $3 AND post_idx = $4";

      // 댓글 수정 쿼리 실행
      const { rowCount } = await queryDatabase(updateCommentQuery, [content, commentIdx, idx, post_idx]);

      if (rowCount === 0) return res.status(403).send(createResult("댓글을 수정할 수 있는 권한이 없거나 댓글이 존재하지 않습니다."));
      res.locals.response = result;
      return res.status(200).send(result);

   } catch (error) {
      next(error);
   }
});

// 댓글 삭제
router.delete("/:commentIdx", checkLogin, async (req, res, next) => {
   const commentIdx = req.params.commentIdx;
   const { post_idx } = req.query;
   const result = createResult();
   const { idx } = req.decoded;

   try {
      const user = req.user;
      const deleteCommentQuery = "DELETE FROM homework.comment WHERE idx = $1 AND user_idx = $2 AND post_idx = $3";

      // 댓글 삭제 쿼리 실행
      const { rowCount } = await queryDatabase(deleteCommentQuery, [commentIdx, idx, post_idx]);

      if (rowCount === 0) throw { status: 500, message: "댓글 삭제에 실패하였습니다. 권한이 없거나 댓글을 찾을 수 없습니다." };
      res.locals.response = result;
      return res.status(200).send(result);

   } catch (error) {
      next(error);
   }
});



module.exports = router