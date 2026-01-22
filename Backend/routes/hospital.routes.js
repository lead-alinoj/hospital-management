const express = require('express');
const multer = require('multer');
const {
  getHospital,
  updateHospital,
  uploadLogo
} = require('../controllers/hospital.controller');

const router = express.Router();

// Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/hospital/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + '.' + file.mimetype.split('/')[1]);
  }
});

const upload = multer({ storage });

router.get('/', getHospital);
router.put('/', updateHospital);
router.post('/logo', upload.single('logo'), uploadLogo);

module.exports = router;
