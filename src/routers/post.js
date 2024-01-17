const express = require("express");
const router = express.Router();
const { queryDatabase } = require("../modules/connection");
const checkLogin = require("../middleware/checkLogin")
const createResult = require("../modules/result")
const createValidationMiddleware = require('../middleware/validate');

//=========게시글==========

// 게시글 쓰기
router.post("/", checkLogin, createValidationMiddleware(['title', 'content']), async (req, res, next) => {
   const result = createResult();
   const { idx } = req.decoded;
   const { title, content } = req.body;
   try {



      const saveSql = "INSERT INTO homework.post (title, content, user_idx) VALUES ($1, $2, $3)";

      // 게시글 작성 쿼리 실행
      await queryDatabase(saveSql, [title, content, idx]);
      res.locals.response = result;
      return res.status(200).send(result);
   } catch (error) {
      next(error);
   }
});

// 게시판 보기
router.get("/", checkLogin, async (req, res, next) => {
   const result = createResult();
   try {
      const getAllPostsQuery = `
         SELECT 
            p.idx, 
            p.title, 
            TO_CHAR(p.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH:MI AM') AS created_at,
            u.id as user_id
         FROM 
            homework.post p
         JOIN 
            homework.user u ON p.user_idx = u.idx
         ORDER BY 
            p.idx DESC
      `;

      const posts = await queryDatabase(getAllPostsQuery);
      result.posts = posts;
      console.log(posts);
      res.locals.response = result;
      res.status(200).send(result);
   } catch (error) {
      next(error);
   }
});

// 제목으로 검색하기
router.get("/search", checkLogin, async (req, res, next) => {
   const result = createResult();
   try {
      const { title } = req.body;

      const getPostQuery = `
         SELECT 
            p.title, 
            p.content, 
            TO_CHAR(p.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH:MI AM') AS created_at,
            u.id as user_id
         FROM 
            homework.post p
         JOIN 
            homework.user u ON p.user_idx = u.idx
         WHERE 
             LOWER(p.title) LIKE LOWER($1)
      `;
      const posts = await queryDatabase(getPostQuery, [`%${title}%`]);

      result.posts = posts;
      res.locals.response = result;
      res.status(200).send(result);
   } catch (error) {
      next(error);
   }
});

// 게시글 자세히 보기
router.get("/:idx", checkLogin, async (req, res, next) => {
   const result = createResult();
   try {
      const postIdx = req.params.idx;

      const getPostQuery = `
         SELECT 
            p.title, 
            p.content, 
            TO_CHAR(p.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH:MI AM') AS created_at,
            u.id as user_id
         FROM 
            homework.post p
         JOIN 
            homework.user u ON p.user_idx = u.idx
         WHERE 
            p.idx = $1
      `;

      const posts = await queryDatabase(getPostQuery, [postIdx]);

      result.posts = posts;
      res.locals.response = result;
      res.status(200).send(result);
   } catch (error) {
      next(error);
   }
});

// 게시글 수정하기
router.put("/:idx", checkLogin, createValidationMiddleware(['title', 'content']), async (req, res, next) => {
   const result = createResult();
   try {
      const postIdx = req.params.idx;
      const { title, content } = req.body;
      const { idx } = req.decoded;

      validation.validateContent(title);
      validation.validateContent(content);

      const updatePostQuery = "UPDATE homework.post SET title = $1, content = $2 WHERE idx = $3 AND user_idx = $4 RETURNING *";
      const updateResults = await queryDatabase(updatePostQuery, [title, content, postIdx, idx]);

      if (updateResults.length === 0) {
         return res.status(403).send(createResult("게시글을 수정할 수 있는 권한이 없거나 게시글이 존재하지 않습니다."));
      }
      res.locals.response = result;
      return res.status(200).send(result);

   } catch (error) {
      next(error);
   }
});

// 게시글 삭제하기
router.delete("/:idx", checkLogin, async (req, res, next) => {
   const result = createResult();
   try {
      const postIdx = req.params.idx;
      const { idx } = req.decoded;

      const deletePostQuery = "DELETE FROM homework.post WHERE idx = $1 AND user_idx = $2 RETURNING *";
      const deleteResults = await queryDatabase(deletePostQuery, [postIdx, idx]);

      if (deleteResults.length === 0) return res.status(403).send(createResult("게시글을 삭제할 수 있는 권한이 없거나 게시글이 존재하지 않습니다."));
      res.locals.response = result;
      return res.status(200).send(result);

   } catch (error) {
      next(error);
   }
});


module.exports = router