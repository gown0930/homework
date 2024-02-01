const express = require("express");
const router = express.Router();
const { queryDatabase } = require("../modules/connection");
const checkLogin = require("../middleware/checkLogin")
const createResult = require("../modules/result")
const createValidationMiddleware = require('../middleware/validate');

const redis = require("redis").createClient();

const uploadS3 = require('../middleware/uploadS3');
const upload = require('../middleware/uploadServer');

//이미지 s3업로드
router.post("/imageS3",
   checkLogin,
   uploadS3.array('image', 5),
   async (req, res, next) => {
      try {
         const uploadFiles = req.files;

         if (!uploadFiles.length) {
            return res.status(400).send({ message: "업로드 된 파일이 없습니다" });
         }
         return res.status(200).send({
            data: {
               files: uploadFiles.map(file => file.location)
            }
         });
      } catch (error) {
         next(error);
      }
   });

// 이미지 서버 업로드
router.post("/imageServer",
   checkLogin,
   upload.array('image', 5),
   async (req, res, next) => {
      try {
         const images = req.files; // 배열로 받아옴
         if (!images.length) {
            return res.status(400).send({ message: "업로드 된 파일이 없습니다" });
         }
         return res.status(200).send({
            data: {
               files: images.map(file => '/uploads/' + file.filename)
            }
         });
      } catch (error) {
         next(error);
      }
   });

// 게시글 쓰기
router.post("/", checkLogin, createValidationMiddleware(['title', 'content']), async (req, res, next) => {
   const result = createResult();
   const { idx } = req.decoded;
   const { title, content, imageUrls } = req.body;

   try {
      const savePostSql = "INSERT INTO homework.post (title, content, user_idx) VALUES ($1, $2, $3) RETURNING idx";
      const postResult = await queryDatabase(savePostSql, [title, content, idx]);

      const postId = postResult[0].idx;

      if (imageUrls.length) {
         // 이미지를 저장하는 쿼리
         const saveImageSql = "INSERT INTO homework.images (post_idx, image_url, user_idx) VALUES ($1, $2, $3)";

         // 각 이미지 URL을 데이터베이스에 저장
         for (const imageUrl of imageUrls) {
            await queryDatabase(saveImageSql, [postId, imageUrl, idx]);
         }
         console.log('이미지 db저장 성공');
      }
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
router.get("/search", checkLogin, createValidationMiddleware(['title']), async (req, res, next) => {
   const result = createResult();
   const { idx } = req.decoded;
   try {
      await redis.connect();
      const { title } = req.body;

      const timestamp = Date.now();


      redis.ZADD(`recent_search${idx}`, {
         score: timestamp,
         value: title
      }, function (err) {
         if (err) {
            console.log(error);
         }
      });
      const setSize = await redis.ZCARD(`recent_search${idx}`);
      const maxSize = 5;
      if (setSize > maxSize) {
         // ZREMRANGEBYRANK 명령어로 초과한 원소를 제거
         await redis.ZREMRANGEBYRANK(`recent_search${idx}`, 0, setSize - maxSize - 1);
      }

      // Redis에 expire time 설정
      await redis.EXPIRE(`recent_search${idx}`, 86400);

      //출력 순서 바꾸기
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
         ORDER BY
            p.idx DESC;
         `;
      const posts = await queryDatabase(getPostQuery, [`%${title}%`]);

      result.posts = posts;
      res.locals.response = result;
      res.status(200).send(result);
   } catch (error) {
      next(error);
   } finally {
      redis.disconnect()
   }
});

//최근 검색어 5개 가져오기
router.get("/recent-search", checkLogin, async (req, res, next) => {
   const result = createResult();
   const { idx } = req.decoded;
   try {
      await redis.connect()
      const numMembersToPop = 5; // 가져올 멤버의 개수
      const poppedMembers = await redis.ZRANGE(`recent_search${idx}`, 0, - 1, 'WITHSCORES');//recent_search{idx}로 해주고, 변수 값 처리
      const reversedMembers = poppedMembers.reverse();
      console.log(reversedMembers);
      result.data.count = reversedMembers
      res.locals.response = result;
      res.status(200).send(result);
   } catch (err) {
      next(err)
   } finally {
      redis.disconnect()
   }
})

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
      // 게시글에 대한 이미지들 조회 쿼리
      const getImagesQuery = `
         SELECT image_url
         FROM homework.images
         WHERE post_idx = $1
         ORDER BY idx
      `;

      // 해당 게시글에 대한 이미지들 조회
      const images = await queryDatabase(getImagesQuery, [postIdx]);

      // 결과에 이미지들 추가
      result.posts = posts;
      result.images = images;

      res.locals.response = result;
      res.status(200).send(result);
   } catch (error) {
      next(error);
   }
});

// 게시글 및 이미지 수정하기
router.put("/:idx", checkLogin, createValidationMiddleware(['title', 'content']), async (req, res, next) => {
   const result = createResult();
   try {
      const postIdx = req.params.idx;
      const { title, content, imageUrls } = req.body;
      const { idx } = req.decoded;

      const updatePostQuery = "UPDATE homework.post SET title = $1, content = $2 WHERE idx = $3 AND user_idx = $4 RETURNING *";
      const updateResults = await queryDatabase(updatePostQuery, [title, content, postIdx, idx]);

      if (updateResults.length === 0) {
         return res.status(403).send(createResult("게시글을 수정할 수 있는 권한이 없거나 게시글이 존재하지 않습니다."));
      }

      const deleteImageUrlSql = "DELETE FROM homework.images WHERE post_idx = $1 RETURNING *"
      const getImageUrlResults = await queryDatabase(deleteImageUrlSql, [postIdx]);
      console.log(getImageUrlResults);
      for (const imageInfo of getImageUrlResults) {
         const imageUrlToDelete = imageInfo.image_url;

         const deleteParams = {
            Bucket: bucketName,
            Key: imageUrlToDelete.split('/').pop(),
         };

         // S3에서 이미지 삭제
         await s3.deleteObject(deleteParams).promise();
         console.log("이미지 삭제 완료:", imageUrlToDelete);
      }
      if (imageUrls.length) {
         const saveImageSql = "INSERT INTO homework.images (post_idx, image_url, user_idx) VALUES ($1, $2, $3)";
         for (const imageUrl of imageUrls) {
            await queryDatabase(saveImageSql, [postIdx, imageUrl, idx]);
         }
         console.log('이미지 db저장 성공');
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

      //이미지 지우기
      const getImageQuery = "DELETE FROM homework.images WHERE post_idx = $1 AND user_idx = $2 RETURNING *";
      const getImageResults = await queryDatabase(getImageQuery, [postIdx, idx]);
      if (getImageResults.length != 0) {
         const deleteImageQuery = "DELETE FROM homework.images WHERE post_idx = $1 AND user_idx = $2 RETURNING *";
         const deleteImageResults = await queryDatabase(deleteImageQuery, [postIdx, idx]);

         if (deleteImageResults.length === 0) return res.status(403).send(createResult("이미지를 삭제할 수 있는 권한이 없거나 이미지가 존재하지 않습니다."));
      }
      //댓글 지우기
      const getCommentQuery = "DELETE FROM homework.comment WHERE post_idx = $1 AND user_idx = $2 RETURNING *";
      const getCommentResults = await queryDatabase(getCommentQuery, [postIdx, idx]);
      if (getCommentResults.length != 0) {
         const deleteCommentQuery = "DELETE FROM homework.comment WHERE post_idx = $1 AND user_idx = $2 RETURNING *";
         const deleteCommentResults = await queryDatabase(deleteCommentQuery, [postIdx, idx]);

         if (deleteCommentResults.length === 0) return res.status(403).send(createResult("댓글을 삭제할 수 있는 권한이 없거나 댓글이 존재하지 않습니다."));

      }

      const deletePostQuery = "DELETE FROM homework.post WHERE idx = $1 AND user_idx = $2 RETURNING *";
      const deletePostResults = await queryDatabase(deletePostQuery, [postIdx, idx]);

      if (deletePostResults.length === 0) return res.status(403).send(createResult("게시글을 삭제할 수 있는 권한이 없거나 게시글이 존재하지 않습니다."));

      res.locals.response = result;
      return res.status(200).send(result);

   } catch (error) {
      next(error);
   }
});


module.exports = router