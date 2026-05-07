const axios = require('axios');
const FormData = require('form-data');
const { sanitizeUrl } = require('../utils/urlUtils');


/**
 * Service to handle interactions with Zoho WorkDrive API.
 * Uses a singleton pattern to maintain token state securely.
 */
class ZohoService {
    constructor() {
        this.cachedAccessToken = null;
        this.tokenExpiryTime = 0;
        this.BUFFER_TIME_MS = 30000; // 30 seconds buffer before expiry to prevent race conditions
        this.config = {}; //store user config here
    }

     // New method to receive credentials from the index.js constructor
    setConfig(config) {
        if (!config.clientId || !config.clientSecret || !config.refreshToken || !config.folderId) {
            throw new Error('Missing required Zoho credentials: clientId, clientSecret, refreshToken, or folderId');
        }
        this.config = config;
    }

    /**
     * Retrieves a valid Access Token, refreshing it if necessary.
     * @returns {Promise<string>} Valid Access Token
     * @throws {Error} If credentials are missing or refresh fails
     */
    async getAccessToken() {
        if (this._isTokenValid()) {
            return this.cachedAccessToken;
        }

        const accountsUrl = this.config.accountsUrl || 'https://accounts.zoho.in';
        const baseUrl = sanitizeUrl(accountsUrl);
        const tokenUrl = `${baseUrl}/oauth/v2/token`;

        try {
            const params = new URLSearchParams({
                refresh_token: this.config.refreshToken,
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                grant_type: 'refresh_token'
            });

            const response = await axios.post(tokenUrl, params);

            if (response.data.error) {
                throw new Error(`Token Refresh Failed: ${JSON.stringify(response.data.error)}`);
            }

            this._updateTokenState(response.data);
            return this.cachedAccessToken;

        } catch (error) {
            throw new Error(`Zoho Authentication Error: ${error.message}`);
        }
    }

    /**
     * Uploads a file to the configured Zoho WorkDrive folder.
     * @param {string} filename - Name of the file
     * @param {Buffer} buffer - File content buffer
     * @param {string} mimeType - MIME type of the file
     * @returns {Promise<Object>} API Response data
     */
    async uploadToWorkDrive(filename, buffer, mimeType) {
        try {
            const folderId = this.config.folderId?.trim();

            if (!folderId) {
                throw new Error('Configuration Error: folderId is missing.');
            }

            const rawUploadUrl = this.config.uploadUrl || 'https://www.zohoapis.in/workdrive/api/v1/upload';
            const uploadUrl = sanitizeUrl(rawUploadUrl);

            const form = new FormData();
            // CRITICAL FIX: Do NOT pass contentType here. Zoho treats the part's Content-Type header as an extra parameter and throws F6012.
            form.append('content', buffer, { filename });
            form.append('parent_id', folderId);
            form.append('override-name-exist', 'true');

            const accessToken = await this.getAccessToken();
            const response = await axios.post(uploadUrl, form, {
                headers: {
                    ...form.getHeaders(),
                    'Authorization': `Zoho-oauthtoken ${accessToken}`
                }
            });

            return response.data;

        } catch (error) {
            const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            console.error(`[ZohoService] Upload Failed: ${errorMsg}`);
            throw new Error(`Upload Failed: ${errorMsg}`);
        }
    }

    /**
     * Creates an external public share link for a file or folder.
     * @param {string} resourceId - The Zoho WorkDrive file/folder ID
     * @param {number} accessType - 6 for View, 5 for Edit, 7 for Upload (Folders only)
     * @returns {Promise<Object>} The public URLs { previewUrl, downloadUrl }
     */
    async createPublicLink(resourceId, accessType = 6) {
        try {
            // STEP 1: 2-second delay to ensure Zoho processing is complete (avoids F6003)
            await new Promise(r => setTimeout(r, 2000));

            const accessToken = await this.getAccessToken();
            const isDotIn = (this.config.accountsUrl || '').includes('.in');
            const apiBase = isDotIn ? 'https://www.zohoapis.in' : 'https://www.zohoapis.com';
            const linkUrl = `${apiBase}/workdrive/api/v1/links`;

            // STEP 2: Use the exact payload requested for public access
            const payload = {
                data: {
                    type: 'links',
                    attributes: {
                        resource_id: resourceId,
                        link_type: 1,          // 1 = Public link
                        access_type: 1,        // 1 = View & Download
                        link_name: "Public Link",
                        allow_download: true
                    }
                }
            };

            const response = await axios.post(linkUrl, payload, {
                headers: {
                    'Authorization': `Zoho-oauthtoken ${accessToken}`,
                    'Accept': 'application/vnd.api+json',
                    'Content-Type': 'application/json'
                }
            });

            // DEBUG LOG: As requested for verification
            console.log("LINK RESPONSE:", JSON.stringify(response.data, null, 2));

            // STEP 3: Return BOTH URLs (Claude Approach)
            const linkData = response.data?.data?.attributes;
            
            if (!linkData) {
                throw new Error("No link attributes found in Zoho response.");
            }

            return {
                previewUrl: linkData.link || linkData.permalink,
                downloadUrl: linkData.download_url || linkData.url || linkData.link
            };

        } catch (error) {
            const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            console.error(`[ZohoService] Public Link Creation Failed: ${errorMsg}`);
            throw new Error(`Link Creation Failed: ${errorMsg}`);
        }
    }

    /**
     * Checks if the current token is valid and not expired.
     * @private
     * @returns {boolean}
     */
    _isTokenValid() {
        return this.cachedAccessToken && Date.now() < (this.tokenExpiryTime - this.BUFFER_TIME_MS);
    }

    /**
     * Updates internal state with new token details.
     * @private
     * @param {Object} tokenData - Response from Zoho Token API
     */
    _updateTokenState(tokenData) {
        this.cachedAccessToken = tokenData.access_token;
        // expires_in is in seconds, convert to ms
        this.tokenExpiryTime = Date.now() + (tokenData.expires_in * 1000);
    }
}

// Export a singleton instance
module.exports = ZohoService;
