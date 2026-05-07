const ZohoService = require('./src/services/zohoService');

class ZohoWorkDriveUploader {
    constructor(config) {
        // The user passes credientials here instead of using a .env file
        this.service = new ZohoService();
        this.service.setConfig(config);
    }

    async upload(filename, buffer, mimeType) {
        // We use the private service instance
        return await this.service.uploadToWorkDrive(filename, buffer, mimeType);
    }

    async getFileStream(fileId) {
        return await this.service.getFileStream(fileId);
    }

    async createPublicLink(fileId, accessType = 6) {
        return await this.service.createPublicLink(fileId, accessType);
    }
}

module.exports = ZohoWorkDriveUploader;