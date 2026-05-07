const axios = require('axios');
const readline = require('readline');
const path = require('path');
const { sanitizeUrl } = require('../src/utils/urlUtils');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ACCOUNTS_URL = process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.in';

console.log('=== Zoho Permanent Token Generator (REFINED) ===');

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('❌ ERROR: ZOHO_CLIENT_ID or ZOHO_CLIENT_SECRET not found in .env file.');
    process.exit(1);
}

// Convert accounts url to api console url roughly
const consoleUrl = ACCOUNTS_URL.replace('accounts', 'api-console');

console.log(`\n[STEP 1] Go to: ${consoleUrl}`);
console.log('   (Ensure you are logged into your Zoho account)');

console.log('\n[STEP 2] Check your Client ID:');
console.log(`   The ID in your .env is: ${CLIENT_ID}`);
console.log('   Does this EXACT ID appear in your API Console? (Yes/No)');

console.log("\n[STEP 3] Copy-Paste this exact scope list into the 'Scope' box:");
console.log('-'.repeat(60));
console.log('WorkDrive.files.ALL,WorkDrive.team.READ,ZohoFiles.files.ALL,WorkDrive.files.sharing.CREATE');
console.log('-'.repeat(60));
console.log("⚠️  CRITICAL: If you miss 'WorkDrive.files.sharing.CREATE', your links might require login!");

console.log("\n[STEP 4] Ensure 'Grant Type' is 'Authorization Code'");
console.log("[STEP 5] Click 'Generate', then copy the Code.");

rl.question('\nPaste the Code here: ', async (code) => {
    if (!code || !code.trim()) {
        console.error('Error: No code entered.');
        rl.close();
        return;
    }

    const baseUrl = sanitizeUrl(ACCOUNTS_URL);
    const tokenUrl = `${baseUrl}/oauth/v2/token`;

    const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code.trim(),
        client_id: CLIENT_ID.trim(),
        client_secret: CLIENT_SECRET.trim()
    });

    console.log(`\nContacting Zoho Auth Servers at ${baseUrl}...`);

    try {
        const response = await axios.post(tokenUrl, params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const result = response.data;

        if (result.refresh_token) {
            console.log('\n✅ SUCCESS!');
            console.log('-'.repeat(50));
            console.log(`ZOHO_REFRESH_TOKEN=${result.refresh_token}`);
            console.log('-'.repeat(50));
            console.log('\nUpdate your .env with this token and restart your server.');
        } else {
            console.log('\n❌ FAILED TO GET REFRESH TOKEN');
            console.log(`Error: ${result.error}`);
            if (result.error === 'invalid_client') {
                console.log("\n💡 EXPLANATION: 'invalid_client' means Zoho does not recognize your Client ID.");
                console.log("   This happens if your Client was created in the wrong region (e.g. zoho.com instead of zoho.in).");
                console.log("   Please create a NEW 'Self Client' at the correct console.");
            } else if (result.error === 'invalid_code') {
                console.log("\n💡 EXPLANATION: 'invalid_code' means the code has expired (it only lasts a few mins) or was already used.");
            } else {
                console.log(`Details: ${JSON.stringify(result)}`);
            }
        }
    } catch (error) {
        console.error(`\n❌ Connection Error: ${error.message}`);
    } finally {
        rl.close();
    }
});
