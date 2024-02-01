const multer = require('multer');
const path = require('path');

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
   fileFilter: (req, file, cb) => {
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];

      if (allowedMimeTypes.includes(file.mimetype)) {
         cb(null, true); // 허용
      } else {
         cb(new Error('JPEG, PNG, GIF 만 허용'), false); // 거부
      }
   },
   limits: {
      fileSize: 5 * 1024 * 1024, // 5MB로 제한
   },
});

const upload = multer({ storage });

module.exports = upload;