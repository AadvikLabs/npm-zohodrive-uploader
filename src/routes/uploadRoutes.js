const express = require('express');
const multer = require('multer');
const uploadController = require('../controllers/uploadController');

const router = express.Router();

// Memory storage to keep file in buffer
const storage = multer.memoryStorage();

// File filter to allow only Images (JPG, PNG, WEBP, SVG) and PDFs
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'application/pdf'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, PNG, WEBP, SVG, and PDF are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter
});

module.exports = (uploader) => {
    
    /**
     * @route POST /api/upload
     * @desc Upload file to Zoho WorkDrive and generate public links
     */
    router.post('/upload', upload.single('file'), (req, res, next) => {
        req.uploader = uploader; 
        next();
    }, uploadController.uploadFile);

    /**
     * @route POST /api/share/:id
     * @desc Create a public share link for the file
     */
    router.post('/share/:id', (req, res, next) => {
        req.uploader = uploader;
        next();
    }, uploadController.shareFile);

    return router;
};
