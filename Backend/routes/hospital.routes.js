const express = require('express');
const multer = require('multer');
const {
  getHospital,
  updateHospital,
  uploadLogo
} = require('../controllers/hospital.controller');

const router = express.Router();
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', '..', 'uploads', 'hospital');

    // Create folder if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },

  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `logo-${uniqueSuffix}${ext}`);
  }
});


const upload = multer({ storage });

router.get('/', getHospital);
router.put('/', updateHospital);
router.post('/logo', upload.single('logo'), uploadLogo);

module.exports = router;
