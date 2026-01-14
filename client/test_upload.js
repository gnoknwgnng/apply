import fs from 'fs';
import path from 'path';

// Test Config
const API_URL = 'http://localhost:3001';
const ADMIN_SECRET = 'admin123';
const IMAGE_PATH = 'C:/Users/akash/.gemini/antigravity/brain/eadb30db-1e24-4e6c-9ff1-d2ffebac74a0/uploaded_image_0_1768317478467.png';

async function runTest() {
    console.log('--- Starting Photo Upload Test (ESM) ---');

    try {
        // 1. Prepare FormData
        console.log('1. Preparing Upload...');
        if (!fs.existsSync(IMAGE_PATH)) {
            throw new Error(`Test image not found at ${IMAGE_PATH}`);
        }

        // Node 18+ specific
        // We need to read as buffer to create a Blob
        const fileBuffer = fs.readFileSync(IMAGE_PATH);
        const blob = new Blob([fileBuffer], { type: 'image/png' });

        const formData = new FormData();
        formData.append('contact', '1112223333');
        formData.append('type', 'phone');
        formData.append('fraud_type', 'Test Upload');
        formData.append('description', 'Automated upload test');
        // IMPORTANT: The 3rd argument is filename, required for multer to detect file
        formData.append('proof', blob, 'test_evidence.png');

        // 2. Submit Report
        console.log('2. Submitting Report...');
        const res = await fetch(`${API_URL}/api/report`, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Upload Failed: ${res.status} ${txt}`);
        }
        console.log('   Upload Success!');

        // 3. Verify in Admin
        console.log('3. Verifying in Admin...');
        const adminRes = await fetch(`${API_URL}/api/admin/reports`, {
            headers: { 'x-admin-secret': ADMIN_SECRET }
        });

        const reports = await adminRes.json();
        const myReport = reports.find(r => r.fraud_type === 'Test Upload' && r.hashed_contact);

        if (myReport) {
            console.log('   Report Found!');
            if (myReport.proof_path && myReport.proof_path.startsWith('/uploads/')) {
                console.log(`   SUCCESS: Proof Path exists: ${myReport.proof_path}`);
            } else {
                console.error('   FAILURE: Proof Path missing or invalid:', myReport);
            }
        } else {
            console.error('   FAILURE: Report not found in Admin list');
        }

    } catch (err) {
        console.error('CRITICAL ERROR:', err);
    }
}

runTest();
