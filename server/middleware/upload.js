/**
 * ===========================================
 * File Upload Middleware (Multer)
 * ===========================================
 *
 * Configures multer for chat file uploads.
 * Stores files in /public/uploads/chat with
 * unique filenames. Limits size to 5 MB.
 */

import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

/* ── Allowed MIME types ── */
const ALLOWED_TYPES = {
  // Images
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  // Documents
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  // Text
  'text/plain': '.txt',
  'text/csv': '.csv',
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/* ── Storage config ── */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve('public/uploads/chat'));
  },
  filename: (_req, file, cb) => {
    const unique = crypto.randomBytes(12).toString('hex');
    const ext = ALLOWED_TYPES[file.mimetype] || path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

/* ── File filter ── */
const fileFilter = (_req, file, cb) => {
  if (ALLOWED_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`File type "${file.mimetype}" is not allowed. Allowed: images, PDF, Word, Excel, text.`), false);
  }
};

/* ── Export configured multer instance ── */
export const chatUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});
