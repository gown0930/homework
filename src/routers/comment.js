const router = require("express").Router();
const postgresPool = require("../modules/connection");
const loginCheck = require("../middleware/loginCheck")
const createResult = require("../modules/result")
const validation = require("../modules/validation")
//=========댓글=============

//postIdx body로 받아오기

//댓글 쓰기
router.post("/", loginCheck, async (req, res) => {
   const result = createResult();

   try {
      const user = req.user;
      const { post_idx, content } = req.body;
      const user_idx = user.idx;

      validation.validateContent(content);
      const addCommentQuery = "INSERT INTO homework.comment (comment, user_idx, post_idx) VALUES ($1, $2, $3) RETURNING *";

      // 댓글 작성 쿼리 실행
      const { rows: addCommentResult } = await postgresPool.query(addCommentQuery, [content, user_idx, post_idx]);

      if (addCommentResult.length === 0) return res.status(500).send(createResult("댓글 작성 중 에러가 발생하였습니다."));

      return res.status(200).send(result);

   } catch (error) {
      console.error("댓글 작성 중 에러 발생:", error);
      result.message = error.message || "댓글 작성 중 에러가 발생하였습니다.";
      res.status(error.status || 500).send(result);
   }
});

//댓글 보기
router.get("/", loginCheck, async (req, res) => {
   const result = createResult();
   try {
      const { post_idx } = req.query;

      const getCommentsQuery = `
      SELECT 
        idx, 
        comment, 
        user_idx, 
        TO_CHAR(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH:MI AM') AS created_at
      FROM homework.comment 
      WHERE post_idx = $1 
      ORDER BY idx DESC
    `;

      // 댓글 조회 쿼리 실행
      const { rows: comments } = await postgresPool.query(getCommentsQuery, [post_idx]);

      result.comments = comments;
      res.status(200).send(result);
   } catch (error) {
      console.error("댓글 조회 중 에러 발생:", error);
      result.message = error.message || "댓글 조회 중 에러가 발생하였습니다.";
      res.status(error.status || 500).send(result);
   }
});

//댓글 수정
router.put("/:commentIdx", loginCheck, async (req, res) => {
   const commentIdx = req.params.commentIdx;
   const { post_idx, content } = req.body;
   const result = createResult();

   try {
      const user = req.user;
      validation.validateContent(content);
      const updateCommentQuery = "UPDATE homework.comment SET comment = $1, created_at = CURRENT_TIMESTAMP WHERE idx = $2 AND user_idx = $3 AND post_idx = $4";

      // 댓글 수정 쿼리 실행
      const { rowCount } = await postgresPool.query(updateCommentQuery, [content, commentIdx, user.idx, post_idx]);

      if (rowCount === 0) return res.status(403).send(createResult("댓글을 수정할 수 있는 권한이 없거나 댓글이 존재하지 않습니다."));

      return res.status(200).send(result);

   } catch (error) {
      console.error("댓글 수정 중 에러 발생:", error);
      result.message = error.message || "댓글 수정 중 에러가 발생하였습니다.";
      res.status(error.status || 500).send(result);
   }
});

//댓글 삭제
router.delete("/:commentIdx", loginCheck, async (req, res) => {
   const commentIdx = req.params.commentIdx;
   const { post_idx } = req.query;
   const result = createResult();

   try {
      const user = req.user;
      const deleteCommentQuery = "DELETE FROM homework.comment WHERE idx = $1 AND user_idx = $2 AND post_idx = $3";

      // 댓글 삭제 쿼리 실행
      const { rowCount } = await postgresPool.query(deleteCommentQuery, [commentIdx, user.idx, post_idx]);

      if (rowCount === 0) throw { status: 500, message: "댓글 삭제에 실패하였습니다. 권한이 없거나 댓글을 찾을 수 없습니다." };

      return res.status(200).send(result);

   } catch (error) {
      console.error("댓글 삭제 중 에러 발생:", error);
      result.message = error.message || "댓글 삭제 중 에러가 발생하였습니다.";
      res.status(error.status || 500).send(result);
   }
});


module.exports = router