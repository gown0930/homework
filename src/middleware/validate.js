// validationMiddleware.js

const defaultValidationPatterns = {
   id: /^[a-zA-Z0-9_]{5,20}$/,
   pw: /^(?=.*\d)(?=.*[a-zA-Z])[0-9a-zA-Z!@#$%^&*_-]{8,}$/,
   phone_num: /^\d{10,11}$/,
   email: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
   name: /^.{3,20}$/,
   title: /.*/,
   content: /.*/,
};

const createValidationMiddleware = (fields, customPatterns = {}) => {
   return (req, res, next) => {
      try {
         const errors = [];

         fields.forEach((field) => {
            const pattern = customPatterns[field] || defaultValidationPatterns[field];
            const value = req.body[field] || req.query[field] || req.params[field];

            if (!value) {
               errors.push(`${field} 값이 비어있습니다`);
            } else if (pattern && !pattern.test(value)) {
               errors.push(`${field} 형식이 올바르지 않습니다`);
            }
         });

         if (errors.length > 0) {
            const validationError = new Error(`Validation Error: ${errors.join(', ')}`);
            validationError.status = 400; // 상태 코드 추가
            // 여기서 에러를 발생시키고 에러 핸들러로 전달
            throw validationError;
         }

         // 유효성 검사 통과 시 다음 미들웨어 호출
         next();
      } catch (error) {
         // 다음 미들웨어로 에러 전파
         next(error);
      }
   };
};


module.exports = createValidationMiddleware;
