const multer = require('multer');
const boom = require('@hapi/boom');
const stringUtil = require('./string');

class FileUploader {
    constructor(config) {
        this.multerConfig = {
            storage: multer.diskStorage({
                destination(req, file, cb) {
                    const uploadFolder = process.env.NODE_ENV === 'local' ? process.env.FILE_UPLOAD_FOLDER : config.uploadFolder;
                    cb(null, uploadFolder);
                },
                filename(req, file, cb) {
                    const name = file.originalname;
                    const newName = stringUtil.generateUniqueString() + name.substr(name.lastIndexOf('.'), name.length - 1);
                    cb(null, newName);
                },
            }),
            limits: { fileSize: config.maxFileSize },
            fileFilter(req, file, cb) {
                if (!(config.allowedFileTypes.indexOf(file.mimetype) > -1)) {
                    cb(boom.badRequest(`File should be of type ${config.allowedFileTypes.join(', ')}`), false);
                }
                cb(null, true);
            },
        };
    }

    static initialize(config) {
        const uploader = new FileUploader(config);
        const multerObj = multer(uploader.multerConfig).single('file');
        return (req, res) => new Promise((resolve, reject) => multerObj(req, res, (err) => {
            if (err && err.code && err.code === 'LIMIT_FILE_SIZE') {
                reject(boom.badRequest(`File size exceeds limit of ${config.maxFileSize / (1024 * 1024)} MB`));
            } else {
                reject(err);
            }
        }));
    }
}

module.exports = FileUploader;