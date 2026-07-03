# Zoho WorkDrive Asset Uploader

A Profesional Node.js library designed to upload images and PDF files securely to **Zoho WorkDrive**. This package handles OAuth2 authentication automatically, using a long-lived Refresh Token to maintain persistent access without manual intervention.

---

## ðŸš€ Features

*   **Universal Uploader**: Supports JPG, PNG, WEBP, SVG, and PDF files.
*   **Automatic Auth**: Handles Zoho OAuth2 Token generation and refreshing automatically.
*   **Secure**: Uses Environment variables for sensitive credentials.
*   **Smart Validation**: Validates file types before attempting upload.

---

## ðŸ“¦ Installation

Install the package into your project via npm:

```bash
npm install @aadvik-teklabs/zohodrive-uploader
```

---

## ðŸš€ Usage
Since this is a modular library, you import the ZohoWorkDriveUploader class and initialize it with your credentials. This avoids the use of global environment variables within the core logic.

const ZohoWorkDriveUploader = require('zohodrive-asset-uploader');

// Initialize the uploader with your credentials
const uploader = new ZohoWorkDriveUploader({
    clientId: 'YOUR_CLIENT_ID',
    clientSecret: 'YOUR_CLIENT_SECRET',
    refreshToken: 'YOUR_REFRESH_TOKEN',
    folderId: 'YOUR_FOLDER_ID',
    accountsUrl: '[https://accounts.zoho.in](https://accounts.zoho.in)' // Optional: defaults to .com
});

/**
 * Example function to handle a file upload
 * @param {string} fileName - Name of the file (e.g., 'invoice.pdf')
 * @param {Buffer} fileBuffer - The binary buffer of the file
 * @param {string} mimeType - The file type (e.g., 'application/pdf')
 */
async function uploadToZoho(fileName, fileBuffer, mimeType) {
    try {
        const result = await uploader.upload(fileName, fileBuffer, mimeType);
        console.log('Upload Success! Resource ID:', result.attachmentId);
    } catch (error) {
        console.error('Upload Failed:', error.message);
    }
}

## ðŸ› ï¸ Setup & Configuration

### 1. Prerequisites
*   Node.js installed.
*   A Zoho account (India DC `zoho.in` or Global `zoho.com`).

### 2. Zoho API Credentials
1.  Go to the [Zoho API Console](https://api-console.zoho.com/).
2.  Create a **Self Client**.
3.  Note down your **Client ID** and **Client Secret**.


### 5. Generate Refresh Token (One-Time Setup)
You only need to do this **once**. The token generated here is permanent.
1.  Run the helper script:
    ```bash
    node scripts/generateToken.js
    ```
---

## â–¶ï¸ Running the Demo
If you want to test the package logic using the built in Express server:
1. Ensure your .env file is configured in the root directory with your credentials

Start the server:
```bash
node demo/app.js
```

User Interface (Swagger UI):
> **http://localhost:3000/api-docs**

---


## ðŸ—ï¸ Project Structure

*   **`index.js`**: Main entry point for the npm package.
*   **`src/routes`**: Defines API interaction points (e.g., `/api/upload`).
*   **`src/controllers`**: logic layer. Validates requests and calls services.
*   **`src/services/zohoService.js`**: The core engine.
    *   Manages OAuth tokens (checks if valid, or refreshes them).
    *   Uploads the actual file to Zoho WorkDrive.
*   **`demo/:`**: Contains the demonstration Express server and swagger.yaml.
*   **`scripts/generateToken.js`**: Utility tool for first-time setup.

---

## ðŸ”„ How Authentication Works
1.  The Library checks for a valid **Access Token** in memory.
2.  If the token is expired or missing, it uses the Refresh Token to request a new one from    Zoho automatically
3.  The new token is cached, ensuring seamless and uninterrupted file uploads.
6.  **Result**: Seamless, uninterrupted uploads forever.

