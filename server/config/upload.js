/**
 * multer upload config for job photos.
 * Disk storage → server/uploads/job_photos/, image files only, 5MB each.
 * Filenames: job<jobId>_<hrtime>_<original-ext> (collision-safe, no user input in name).
 */
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const DEST = path.join(__dirname, '..', 'uploads', 'job_photos');
fs.mkdirSync(DEST, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, DEST),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
    const stamp = `${Date.now()}_${process.hrtime.bigint()}`;
    cb(null, `job${req.params.id}_${stamp}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (/^image\//.test(file.mimetype)) return cb(null, true);
  cb(new Error('Only image files are allowed'));
}

const uploadPhotos = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
}).array('photos', 5); // field name "photos", max 5 per request

module.exports = { uploadPhotos, PHOTOS_DIR: DEST };
