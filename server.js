//js에서 다른 js import
const express = require("express");
const session = require("express-session");

//Init
const app = express()
const port = 8000

//session
app.use(
   session({
      secret: "your-secret-key",
      //세션을 서명하기 위한 키
      resave: false,
      saveUninitialized: true,
   })
);

//Apis

const idPattern = /^[a-zA-Z0-9_]{5,20}$/; // 5~20자의 영문 소문자, 대문자, 숫자, 언더스코어 허용
const pwPattern = /^(?=.*\d)(?=.*[a-zA-Z])[0-9a-zA-Z!@#$%^&*_-]{8,}$/; // 8자 이상의 영문, 숫자, 특수문자 중 2가지 이상 조합 허용
const phonePattern = /^\d{10,11}$/; // 10자 또는 11자의 숫자 허용
const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/; // 이메일 형식
const nameLengthRegex = /^.{3,20}$/;//이름 길이 제한

//===========로그인 & 회원가입 ===============

// 로그인
app.post("/login", (req, res) => {
   try {
      const { id, pw } = req.body;

      // 아이디 정규식
      if (!idPattern.test(id)) {
         const result = {
            success: false,
            message: '아이디 형식이 올바르지 않습니다.',
         };
         return res.status(400).send(result);
      }

      // 비밀번호 정규식
      if (!pwPattern.test(pw)) {
         const result = {
            success: false,
            message: '비밀번호 형식이 올바르지 않습니다.',
         };
         return res.status(400).send(result);
      }

      // 로그인 처리
      const result = {
         success: true,
         message: '로그인이 성공적으로 완료되었습니다.',
      };
      res.status(200).send(result);
   } catch (error) {
      console.error("로그인 중 에러 발생:", error);
      const result = {
         success: false,
         message: "로그인 중 에러가 발생하였습니다.",
      };
      return res.status(500).send(result);
   }
});

// 회원가입
app.post("/account", (req, res) => {
   try {
      const { id, pw, name, phone_num, email } = req.body;

      // 아이디 정규식
      if (!idPattern.test(id)) {
         const result = {
            success: false,
            message: '아이디 형식이 올바르지 않습니다.',
         };
         return res.status(400).send(result);
      }

      // 비밀번호 정규식
      if (!pwPattern.test(pw)) {
         const result = {
            success: false,
            message: '비밀번호 형식이 올바르지 않습니다.',
         };
         return res.status(400).send(result);
      }

      // 전화번호 정규식
      if (!phonePattern.test(phone_num)) {
         const result = {
            success: false,
            message: '전화번호 형식이 올바르지 않습니다.',
         };
         return res.status(400).send(result);
      }

      // 이메일 정규식
      if (!emailPattern.test(email)) {
         const result = {
            success: false,
            message: '이메일 형식이 올바르지 않습니다.',
         };
         return res.status(400).send(result);
      }

      // 이름 정규식 
      if (!nameLengthRegex.test(name)) {
         const result = {
            success: false,
            message: '이름은 최소 3자 이상, 최대 20자까지 입력 가능합니다.',
         };
         return res.status(400).send(result);
      }

      // 사용자 정보 db에서 가져왔다 치자.
      const existingUser = "";
      const existingPhoneNum = "";

      // 아이디 중복 확인
      if (existingUser) {
         const result = {
            success: false,
            message: '아이디가 이미 존재합니다.',
         };
         return res.status(409).send(result);
      }

      // 전화번호 중복 확인
      if (existingPhoneNum) {
         const result = {
            success: false,
            message: '전화번호가 이미 존재합니다.',
         };
         return res.status(409).send(result);
      }

      // db에 집어넣는 과정

      const result = {
         success: true,
         message: '회원가입이 성공적으로 완료되었습니다.',
      };
      res.status(201).send(result);
   } catch (error) {
      console.error("회원가입 중 에러 발생:", error);
      const result = {
         success: false,
         message: "회원가입 중 에러가 발생하였습니다.",
      };
      return res.status(500).send(result);
   }
});

// 아이디 찾기
app.get("/account/:id", (req, res) => {
   try {
      const { name, phone_num, email } = req.query;

      // 전화번호 정규식
      if (!phonePattern.test(phone_num)) {
         const result = {
            success: false,
            message: '전화번호 형식이 올바르지 않습니다.',
         };
         return res.status(400).send(result);
      }

      // 이메일 정규식
      if (!emailPattern.test(email)) {
         const result = {
            success: false,
            message: '이메일 형식이 올바르지 않습니다.',
         };
         return res.status(400).send(result);
      }

      // 이름 정규식 
      if (!nameLengthRegex.test(name)) {
         const result = {
            success: false,
            message: '이름은 최소 3자 이상, 최대 20자까지 입력 가능합니다.',
         };
         return res.status(400).send(result);
      }

      // db처리로 id 가져오기

      // 로그인 처리
      const result = {
         success: true,
         message: '받아온 id 출력',
      };
      res.status(200).send(result);
   } catch (error) {
      console.error("아이디 찾기 중 에러 발생:", error);
      const result = {
         success: false,
         message: "아이디 찾기 중 에러가 발생하였습니다.",
      };
      return res.status(500).send(result);
   }
});

// 비밀번호 찾기
app.put("/account/", (req, res) => {
   try {
      const { id, name, phone_num, email } = req.query;

      // 아이디 정규식
      if (!idPattern.test(id)) {
         const result = {
            success: false,
            message: '아이디 형식이 올바르지 않습니다.',
         };
         return res.status(400).send(result);
      }

      // 전화번호 정규식
      if (!phonePattern.test(phone_num)) {
         const result = {
            success: false,
            message: '전화번호 형식이 올바르지 않습니다.',
         };
         return res.status(400).send(result);
      }

      // 이메일 정규식
      if (!emailPattern.test(email)) {
         const result = {
            success: false,
            message: '이메일 형식이 올바르지 않습니다.',
         };
         return res.status(400).send(result);
      }

      // 이름 정규식 
      if (!nameLengthRegex.test(name)) {
         const result = {
            success: false,
            message: '이름은 최소 3자 이상, 최대 20자까지 입력 가능합니다.',
         };
         return res.status(400).send(result);
      }

      // db로 비밀번호 가져오기

      // 로그인 처리
      const result = {
         success: true,
         message: '받아온 비밀번호 출력',
      };
      res.status(200).send(result);
   } catch (error) {
      console.error("비밀번호 찾기 중 에러 발생:", error);
      const result = {
         success: false,
         message: "비밀번호 찾기 중 에러가 발생하였습니다.",
      };
      return res.status(500).send(result);
   }
});



//============내 정보================

// 내 정보 보기
app.get("/account/my", (req, res) => {
   try {
      const user = req.session.user;

      if (!user) {
         // 사용자가 로그인되어 있지 않은 경우
         const result = {
            success: false,
            message: "로그인이 필요합니다.",
         };
         return res.status(401).send(result);
      }

      // 사용자 정보를 가져와서 처리
      const { id, name, phone_num, email } = user;

      const result = {
         success: true,
         data: {
            id,
            name,
            phone_num,
            email,
         },
      };
      res.status(200).send(result);

   } catch (error) {
      console.error("내 정보 보기 중 에러 발생:", error);
      const result = {
         success: false,
         message: "내 정보 보기 중 에러가 발생하였습니다.",
      };
      return res.status(500).send(result);
   }
});

// 내 정보 수정
app.put("/account/update", (req, res) => {
   try {
      const { idx, id, name, phone_num, email } = req.body;

      //비밀번호 정규식
      if (!pwPattern.test(pw)) {
         const result = {
            success: false,
            message: '비밀번호 형식이 올바르지 않습니다.',
         };
         return res.status(400).send(result);
      }

      //전화번호 정규식
      if (!phonePattern.test(phone_num)) {
         const result = {
            success: false,
            message: '전화번호 형식이 올바르지 않습니다.',
         };
         return res.status(400).send(result);
      }

      // 이메일 정규식
      if (!emailPattern.test(email)) {
         const result = {
            success: false,
            message: '이메일 형식이 올바르지 않습니다.',
         };
         return res.status(400).send(result);
      }

      // 이름 정규식 
      if (!nameLengthRegex.test(name)) {
         const result = {
            success: false,
            message: '이름은 최소 3자 이상, 최대 20자까지 입력 가능합니다.',
         };
         return res.status(400).send(result);
      }

      //전화번호 중복 확인
      if (existingPhoneNum) {
         const result = {
            success: false,
            message: '전화번호가 이미 존재합니다.',
         };
         return res.status(409).send(result); // 409 Conflict: 리소스의 현재 상태와 충돌이 발생했음을 나타냄
      }

      // db통신 결과
      const updateResult = "";

      // DB 통신 결과 처리
      if (updateResult.success) {
         const result = {
            success: true,
            message: '회원 정보 수정이 성공적으로 완료되었습니다.',
         };
         return res.status(201).send(result);
      } else {
         const result = {
            success: false,
            message: '회원 정보 수정에 실패하였습니다.',
         };
         return res.status(500).send(result);
      }
   } catch (error) {
      console.error("내 정보 수정 중 에러 발생:", error);
      const result = {
         success: false,
         message: "내 정보 수정 중 에러가 발생하였습니다.",
      };
      return res.status(500).send(result);
   }
});

//회원 탈퇴
app.delete("/account/:idx", async (req, res) => {
   try {
      const userIdx = req.params.idx; // 동적으로 전달된 idx

      // DB 통신
      const deleteResult = "";

      // DB 통신 결과 처리
      if (deleteResult.success) {
         const result = {
            success: true,
            message: '회원 탈퇴가 성공적으로 완료되었습니다.',
         };
         return res.status(200).send(result);
      } else {
         const result = {
            success: false,
            message: '회원 탈퇴에 실패하였습니다.',
         };
         return res.status(500).send(result);
      }
   } catch (error) {
      console.error("회원 탈퇴 중 에러 발생:", error);
      const result = {
         success: false,
         message: "회원 탈퇴 중 에러가 발생하였습니다.",
      };
      return res.status(500).send(result);
   }
});


//=========게시글==========

// 게시글 쓰기
app.post("/posts", (req, res) => {
   try {
      const { title, content } = req.body;

      // 제목이 비어있는지 확인
      if (!title) {
         const result = {
            success: false,
            message: "제목은 필수 입력 항목입니다.",
         };
         return res.status(400).send(result);
      }

      // 내용이 비어있는지 확인
      if (!content) {
         const result = {
            success: false,
            message: "내용은 필수 입력 항목입니다.",
         };
         return res.status(400).send(result);
      }

      // 게시글을 데이터베이스에 저장
      const saveResult = "";

      // 데이터베이스 저장 결과에 따른 처리
      if (saveResult.success) {
         const result = {
            success: true,
            message: "게시글이 성공적으로 작성되었습니다.",
         };
         return res.status(201).send(result);
      } else {
         const result = {
            success: false,
            message: "게시글 작성에 실패하였습니다.",
         };
         return res.status(500).send(result);
      }
   } catch (error) {
      console.error("게시글 작성 중 에러 발생:", error);
      const result = {
         success: false,
         message: "게시글 작성 중 에러가 발생하였습니다.",
      };
      return res.status(500).send(result);
   }
});

//게시글 목록 보기
app.get("/posts", (req, res) => {
   try {
      // 데이터베이스에서 모든 게시글을 가져오는 로직

      const posts = [
         { id: 1, title: "첫 번째 게시글" },
         { id: 2, title: "두 번째 게시글" },
         // ... 더 많은 게시글
      ];

      res.send(posts);
   } catch (error) {
      console.error("게시글 목록 조회 중 에러 발생:", error);
      const result = {
         success: false,
         message: "게시글 목록 조회 중 에러가 발생하였습니다.",
      };
      return res.status(500).send(result);
   }
});

//게시글 자세히 보기
app.get("/posts/:idx", (req, res) => {
   const postId = req.params.id;

   // 데이터베이스에서 특정 ID의 게시글을 가져오는 로직

   const post = { id: postId, title: "게시글 제목", content: "게시글 내용" };

   res.send(post);
});

//게시글 수정하기
app.put("/posts/:idx", (req, res) => {
   const postId = req.params.id;
   const { title, content } = req.body;

   // 데이터베이스에서 특정 ID의 게시글을 수정하는 로직

   const result = {
      success: true,
      message: "게시글이 성공적으로 수정되었습니다.",
   };

   res.send(result);
});

//게시글 삭제하기
app.delete("/posts/:idx", (req, res) => {
   const postId = req.params.id;

   // 데이터베이스에서 특정 ID의 게시글을 삭제하는 로직

   const result = {
      success: true,
      message: "게시글이 성공적으로 삭제되었습니다.",
   };

   res.send(result);
});


//=========댓글=============

//댓글 쓰기
app.post("/posts/:postidx/comments", (req, res) => {
   const postId = req.params.postId;
   const { content } = req.body;

   // 데이터베이스에 댓글을 저장하는 로직

   const result = {
      success: true,
      message: "댓글이 성공적으로 작성되었습니다.",
   };

   res.send(result);
});

//댓글 보기
app.get("/posts/:postidx/comments", (req, res) => {
   const postId = req.params.postId;

   // 데이터베이스에서 특정 게시글에 대한 모든 댓글을 가져오는 로직

   const comments = [
      { id: 1, content: "첫 번째 댓글" },
      { id: 2, content: "두 번째 댓글" },
      // ... 더 많은 댓글
   ];

   res.send(comments);
});

//댓글 수정
app.put("/posts/:postidx/comments/:commentIdx", (req, res) => {
   const commentId = req.params.commentId;
   const { content } = req.body;

   // 데이터베이스에서 특정 댓글을 수정하는 로직

   const result = {
      success: true,
      message: "댓글이 성공적으로 수정되었습니다.",
   };

   res.send(result);
});

//댓글 삭제
app.delete("/posts/:postidx/comments/:commentIdx", (req, res) => {
   const commentId = req.params.commentId;

   // 데이터베이스에서 특정 댓글을 삭제하는 로직

   const result = {
      success: true,
      message: "댓글이 성공적으로 삭제되었습니다.",
   };

   res.send(result);
});


//web server
app.listen(port, () => {
   //웹 서버 실행시 초기 설정
   console.log(`${port}번에서 HTTP 웹 서버 실행`)
})