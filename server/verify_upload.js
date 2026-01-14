
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const supabase = require('./supabaseClient');

async function testUpload() {
    console.log('Starting upload verification...');

    // 1. Create a dummy test image
    const imagePath = path.join(__dirname, 'test_image.png');
    // Create a 1x1 pixel transparent PNG
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
    fs.writeFileSync(imagePath, buffer);

    // 2. Prepare Form Data
    const form = new FormData();
    form.append('contact', 'test_upload_verification');
    form.append('type', 'email');
    form.append('fraud_type', 'Verification Test');
    form.append('description', 'Automated test to verify Supabase Storage upload.');
    form.append('proof', fs.createReadStream(imagePath));

    try {
        // 3. Send POST request
        console.log('Sending request to backend...');
        const response = await axios.post('http://localhost:3001/api/report', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        console.log('Response:', response.data);

        // 4. Verify in Database
        console.log('Verifying in Supabase Database...');
        // Wait a moment for propagation if needed (usually instant)
        const hash = require('crypto').createHash('sha256').update('test_upload_verification').digest('hex');

        // Find the contact first
        const { data: contact } = await supabase.from('contacts').select('id').eq('hashed_contact', hash).single();

        if (!contact) {
            console.error('Contact not found in DB!');
            return;
        }

        // Find the report
        const { data: report } = await supabase
            .from('reports')
            .select('*')
            .eq('contact_id', contact.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (report) {
            console.log('Report found:', report);
            console.log('Proof Path:', report.proof_path);

            if (report.proof_path && report.proof_path.startsWith('http')) {
                console.log('SUCCESS: Proof path is a valid URL.');
            } else {
                console.error('FAILURE: Proof path is missing or invalid.');
            }
        } else {
            console.error('Report not found in DB!');
        }

    } catch (err) {
        console.error('Test failed:', err.message);
        if (err.response) {
            console.error('Server response:', err.response.data);
        }
    } finally {
        // Cleanup
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
}

testUpload();
