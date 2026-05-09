const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadProgress = document.getElementById('uploadProgress');
const resultModal = document.getElementById('resultModal');
const closeModal = document.getElementById('closeModal');
const viewBtn = document.getElementById('viewBtn');
const shareBtn = document.getElementById('shareBtn');
const downloadBtn = document.getElementById('downloadBtn');
const urlDisplay = document.getElementById('urlDisplay');
const publicUrlText = document.getElementById('publicUrlText');
const copyUrlBtn = document.getElementById('copyUrlBtn');
const fileDetails = document.getElementById('fileDetails');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const fileId = document.getElementById('fileId');

// Store URLs
let uploadedFileId = null;
let uploadedPreviewUrl = null;
let uploadedDownloadUrl = null;
let uploadedShareUrl = null;
let uploadedFileName = null;
let uploadedFileSize = null;

// Copy URL button handler
copyUrlBtn.addEventListener('click', async () => {
    if (uploadedShareUrl) {
        await navigator.clipboard.writeText(uploadedShareUrl);
        const originalText = copyUrlBtn.textContent;
        copyUrlBtn.textContent = '✓';
        setTimeout(() => {
            copyUrlBtn.textContent = originalText;
        }, 2000);
    }
});

// Handle Drag & Drop
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    uploadArea.addEventListener(eventName, () => uploadArea.classList.add('dragover'), false);
});

['dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('dragover'), false);
});

uploadArea.addEventListener('drop', handleDrop, false);
uploadArea.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFiles(files) {
    if (files.length === 0) return;
    const file = files[0];
    
    // Basic validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
        alert('Invalid file type. Please upload an image or PDF.');
        return;
    }

    uploadFile(file);
}

async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    uploadArea.classList.add('hidden');
    uploadProgress.classList.remove('hidden');

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Extract all URLs (Claude Approach)
            uploadedFileId = data.fileId;
            uploadedPreviewUrl = data.previewUrl;
            uploadedDownloadUrl = data.downloadUrl;
            uploadedShareUrl = data.previewUrl; // Share the preview page
            uploadedFileName = data.filename;
            uploadedFileSize = data.size;
            
            console.log('📤 Uploaded:', {
                preview: uploadedPreviewUrl,
                download: uploadedDownloadUrl
            });
            
            showSuccessModal();
        } else {
            throw new Error(data.message || 'Upload failed');
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
        uploadArea.classList.remove('hidden');
    } finally {
        uploadProgress.classList.add('hidden');
    }
}

function showSuccessModal() {
    if (uploadedFileName) fileName.textContent = uploadedFileName;
    if (uploadedFileSize) fileSize.textContent = (uploadedFileSize / 1024).toFixed(2) + ' KB';
    if (uploadedFileId) fileId.textContent = uploadedFileId.substring(0, 15) + '...';
    
    if (uploadedShareUrl) {
        publicUrlText.textContent = uploadedShareUrl;
        urlDisplay.classList.remove('hidden');
    }
    resultModal.classList.remove('hidden');
}

// Modal Actions
closeModal.addEventListener('click', () => {
    resultModal.classList.add('hidden');
    uploadArea.classList.remove('hidden');
});

// PREVIEW Button
viewBtn.addEventListener('click', () => {
    if (!uploadedPreviewUrl) return;
    const url = uploadedPreviewUrl.trim();
    console.log('🔗 Opening Preview:', url);
    window.open(url, '_blank', 'noopener,noreferrer');
});

// DOWNLOAD Button
downloadBtn.addEventListener('click', () => {
    if (!uploadedDownloadUrl) return;
    const url = uploadedDownloadUrl.trim();
    console.log('⬇️ Opening Download:', url);
    window.open(url, '_blank', 'noopener,noreferrer');
});

// SHARE Button
shareBtn.addEventListener('click', async () => {
    if (!uploadedFileId) return;
    
    try {
        const originalText = shareBtn.textContent;
        shareBtn.textContent = 'Generating...';
        
        let linkToCopy = uploadedShareUrl;
        
        if (!linkToCopy) {
            const response = await fetch(`/api/share/${uploadedFileId}`, { method: 'POST' });
            const data = await response.json();
            if (response.ok && data.previewUrl) {
                linkToCopy = data.previewUrl;
                uploadedShareUrl = data.previewUrl;
                uploadedPreviewUrl = data.previewUrl;
                uploadedDownloadUrl = data.downloadUrl;
            } else {
                throw new Error(data.message || 'Failed to generate link');
            }
        }
        
        await navigator.clipboard.writeText(linkToCopy);
        shareBtn.textContent = 'Copied! ✓';
        shareBtn.style.backgroundColor = '#10b981';
        
        setTimeout(() => {
            shareBtn.textContent = originalText;
            shareBtn.style.backgroundColor = '';
        }, 3000);

    } catch (error) {
        alert(`Error: ${error.message}`);
        shareBtn.textContent = 'Share Link';
    }
});
