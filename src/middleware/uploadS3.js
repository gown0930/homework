const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');
const path = require('path');

aws.config.update({
   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
   region: 'ap-northeast-2',
});

const bucketName = process.env.AWS_BUCKET_NAME;
const s3 = new aws.S3();

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
   }),
   fileFilter: (req, file, callback) => {
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];

      if (allowedMimeTypes.includes(file.mimetype)) {
         callback(null, true); // 허용
      } else {
         callback(new Error('JPEG, PNG, GIF 만 허용됨'), false); // 거부
      }
   },
   limits: {
      fileSize: 5 * 1024 * 1024, // 5MB로 제한
   },
});

module.exports = uploadS3;