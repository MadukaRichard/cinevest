/**
 * ===========================================
 * Avatar Upload Middleware (Multer)
 * ===========================================
 *
 * Configures multer for avatar uploads.
 * Stores files in /public/uploads/avatars with
 * unique filenames. Limits size to 2 MB. Only images allowed.
 */

import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve('public/uploads/avatars'));
  },
  filename: (_req, file, cb) => {
    const unique = crypto.randomBytes(12).toString('hex');
    const ext = ALLOWED_IMAGE_TYPES[file.mimetype] || path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const avatarFileFilter = (_req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed for avatars.'), false);
  }
};

export const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: { fileSize: MAX_AVATAR_SIZE },
});
