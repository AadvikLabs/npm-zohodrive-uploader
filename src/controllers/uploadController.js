
/**
 * UPLOAD CONTROLLER - Handles all file operations
 * ================================================
 * 
 * APIs Provided:
 * 1. POST /api/upload
 *    - Upload file to Zoho WorkDrive
 *    - Auto-generate public link
 *    - Response includes: fileId, filename, size, previewUrl, downloadUrl
 * 
 * 2. POST /api/share/:id
 *    - Create public share link
 *    - Returns { previewUrl, downloadUrl }
 */

exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded or invalid file type.' });
        }

        const { originalname, buffer, mimetype } = req.file;

        // 1. Upload to Zoho
        const uploadResult = await req.uploader.upload(originalname, buffer, mimetype);

        // 2. Extract basic info
        const fileData = uploadResult?.data?.[0]?.attributes || uploadResult?.attributes || {};
        const attachmentId = fileData?.resource_id || uploadResult?.id || 'unknown_id';
        const permalink = fileData?.permalink || uploadResult?.permalink || null;

        // 3. Generate Public Links (Claude Approach)
        let previewUrl = null;
        let downloadUrl = null;

        if (attachmentId !== 'unknown_id') {
            try {
                const links = await req.uploader.createPublicLink(attachmentId, 6);
                previewUrl = links.previewUrl;
                downloadUrl = links.downloadUrl;
            } catch (linkErr) {
                console.error('⚠️  Failed to auto-generate public link. Falling back to permalink.');
                previewUrl = permalink;
                downloadUrl = permalink;
            }
        }

        // 4. Fallback construction if still null
        if (!previewUrl && attachmentId !== 'unknown_id') {
            const isDotIn = (process.env.ZOHO_ACCOUNTS_URL || '').includes('.in');
            const zohoDomain = isDotIn ? 'workdrive.zoho.in' : 'workdrive.zoho.com';
            previewUrl = `https://${zohoDomain}/file/${attachmentId}`;
            downloadUrl = previewUrl;
        }

        // 5. Response
        const response = {
            success: attachmentId !== 'unknown_id',
            fileId: attachmentId,
            filename: originalname,
            size: buffer.length,
            mimeType: mimetype,
            
            // Claude Approach URLs
            previewUrl: previewUrl,
            downloadUrl: downloadUrl,
            shareUrl: previewUrl,
            
            status: previewUrl ? '✅ Public Links Generated' : '❌ Failed to generate'
        };

        console.log(`📁 Upload Complete - ID: ${attachmentId}, Preview URL: ${previewUrl ? '✅' : '❌'}`);
        res.status(200).json(response);

    } catch (error) {
        console.error('Upload Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error - failed upload',
            error: error.message
        });
    }
};

exports.shareFile = async (req, res) => {
    try {
        const { id } = req.params;
        const accessType = req.body.accessType || 6;

        if (!id) {
            return res.status(400).json({ message: 'File ID is required' });
        }

        const links = await req.uploader.createPublicLink(id, accessType);

        res.status(200).json({
            message: 'Public link created successfully',
            previewUrl: links.previewUrl,
            downloadUrl: links.downloadUrl,
            link: links.previewUrl // for compatibility
        });

    } catch (error) {
        console.error('Share Error:', error.message);
        res.status(500).json({ message: 'Error creating public share link', error: error.message });
    }
};
