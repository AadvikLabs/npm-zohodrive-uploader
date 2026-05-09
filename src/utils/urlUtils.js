/**
 * Sanitizes a URL by removing any trailing slash
 * @param {string} url 
 * @returns {string}
 */
const sanitizeUrl = (url) => {
    if (!url) return '';
    return url.trim().endsWith('/') ? url.trim().slice(0, -1) : url.trim();
};

module.exports = {
    sanitizeUrl
};
