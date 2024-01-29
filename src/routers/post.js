const express = require("express");
const router = express.Router();
const { queryDatabase } = require("../modules/connection");
const checkLogin = require("../middleware/checkLogin")
const createResult = require("../modules/result")
const createValidationMiddleware = require('../middleware/validate');

const redis = require("redis").createClient();

const multer = require('multer');
const path = require('path');

const aws = require('aws-sdk');
const multerS3 = require('multer-s3');


aws.config.update({
   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
   region: 'ap-northeast-2',
});

// S3에 업로드할 버킷 이름
const bucketName = 'haeju-homework';

// S3 객체 생성
const s3 = new aws.S3();

// multer 설정
const uploadS3 = multer({
   storage: multerS3({
      s3: s3,
      bucket: bucketName,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, callback) => {
         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
         const fileExtension = path.extname(file.originalname);
         const fileName = 'folder/' + uniqueSuffix + fileExtension;
         callback(null, fileName);
      },
      acl: 'public-read'
   })
});


//const uploadS3 = multer({ storage: storageS3 });


//=========게시글==========
const uploadDir = path.join(__dirname, '../../uploads');
const storage = multer.diskStorage({
   destination: (req, file, cb) => {
      cb(null, uploadDir);
   },
   filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileExtension = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
   },
});

const upload = multer({ storage });

// 게시글 쓰기 및 이미지 업로드 라우트
router.post("/", checkLogin, uploadS3.single('image'), createValidationMiddleware(['title', 'content']), async (req, res, next) => {
   const result = createResult();
   const { idx } = req.decoded;
   const { title, content } = req.body;

   try {
      // 이미지 파일이 있는지 확인
      //const imageUrl = req.file ? req.file.filename : null;
      const imageUrl = req.file ? req.file.location : null;
      console.log(imageUrl + "이미지 링크")
      console.log(imageUrl.split('/').pop())
      const saveSql = "INSERT INTO homework.post (title, content, user_idx, image_url) VALUES ($1, $2, $3, $4)";

      // 게시글 작성 쿼리 실행
      await queryDatabase(saveSql, [title, content, idx, imageUrl]);

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
   image_url
   const result = createResult();
   try {
      const postIdx = req.params.idx;

      const getPostQuery = `
         SELECT 
            p.title, 
            p.content, 
            p.image_url,
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

// 이미지 수정하기
router.put("/image/:idx", uploadS3.single('image'), checkLogin, async (req, res, next) => {
   const result = createResult();
   try {
      const postIdx = req.params.idx;
      const { idx } = req.decoded;

      const imageUrl = req.file ? req.file.location : null;
      const getPostQuery = "SELECT * FROM homework.post WHERE idx = $1 AND user_idx = $2";
      const getPostResults = await queryDatabase(getPostQuery, [postIdx, idx]);

      if (getPostResults.length === 0) {
         return res.status(403).send(createResult("게시글을 수정할 수 있는 권한이 없거나 게시글이 존재하지 않습니다."));
      }

      const currentImageUrl = getPostResults[0].image_url;

      // 이미지가 존재하면 S3에서 삭제
      if (currentImageUrl) {
         const deleteParams = {
            Bucket: bucketName,
            Key: currentImageUrl.split('/').pop(), // 이미지 파일명만 추출
         };

         // S3에서 이미지 삭제
         await s3.deleteObject(deleteParams).promise();
         console.log("기존 이미지 삭제:", currentImageUrl);
      }

      const updatePostQuery = "UPDATE homework.post SET image_url = $1 WHERE idx = $2 AND user_idx = $3 RETURNING *";
      const updateResults = await queryDatabase(updatePostQuery, [imageUrl, postIdx, idx]);


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