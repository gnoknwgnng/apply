const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const supabase = require('./supabaseClient');

// Initialize Express
const app = express();
const router = express.Router();
const PORT = 3001;
const ADMIN_SECRET = "admin123";

const multer = require('multer');

// Configure Multer for Memory Storage (Supabase Upload)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());

// Utility: Hash function
function hashContact(contact) {
    return crypto.createHash('sha256').update(contact.trim()).digest('hex');
}

// --- DEFINE ROUTES ON ROUTER ---

// 1. Search Contacts
router.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Query parameter required' });

    const hashed = hashContact(query);

    try {
        const { data: contact, error } = await supabase
            .from('contacts')
            .select('*')
            .eq('hashed_contact', hashed)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error(error);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!contact) {
            return res.json({ status: 'Not Reported', report_count: 0 });
        }

        let displayStatus = 'Not Reported';
        let fraudCategory = 'None';
        let categoryBreakdown = [];

        // Fetch reports
        const { data: allReports } = await supabase
            .from('reports')
            .select('fraud_type, created_at')
            .eq('contact_id', contact.id)
            .order('created_at', { ascending: false });

        if (allReports && allReports.length > 0) {
            fraudCategory = allReports[0].fraud_type;
            const counts = {};
            allReports.forEach(r => {
                const type = r.fraud_type || 'Unknown';
                counts[type] = (counts[type] || 0) + 1;
            });
            categoryBreakdown = Object.entries(counts)
                .map(([category, count]) => ({ category, count }))
                .sort((a, b) => b.count - a.count);
        }

        if (contact.status === 'flagged') displayStatus = 'Flagged';
        else if (contact.status === 'safe') displayStatus = 'Not Reported';
        else {
            if (contact.report_count === 1) displayStatus = 'Under Review';
            if (contact.report_count >= 2) displayStatus = 'Multiple Reports';
        }

        res.json({
            status: displayStatus,
            report_count: contact.report_count,
            fraud_category: fraudCategory,
            category_breakdown: categoryBreakdown,
            last_reported_at: contact.last_reported_at
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// 2. Report Contact
router.post('/report', upload.single('proof'), async (req, res) => {
    const { contact, type, fraud_type, description } = req.body;
    let proof_path = '';

    if (!contact || !type || !fraud_type) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        if (req.file) {
            const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${req.file.originalname}`;
            const { data, error } = await supabase.storage
                .from('proofs')
                .upload(fileName, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: false
                });

            if (error) {
                console.error('Supabase Storage Error:', error);
                return res.status(500).json({ error: 'Failed to upload image' });
            }

            const { data: publicData } = supabase.storage
                .from('proofs')
                .getPublicUrl(fileName);

            proof_path = publicData.publicUrl;
        }

        const hashed = hashContact(contact);

        let { data: existingContact, error: fetchError } = await supabase
            .from('contacts')
            .select('*')
            .eq('hashed_contact', hashed)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            return res.status(500).json({ error: fetchError.message });
        }

        let contactId;
        let newCount = 1;

        if (!existingContact) {
            const { data: newContact, error: insertError } = await supabase
                .from('contacts')
                .insert([{
                    hashed_contact: hashed,
                    type,
                    report_count: 1,
                    status: 'under_review',
                    last_reported_at: new Date()
                }])
                .select()
                .single();

            if (insertError) return res.status(500).json({ error: insertError.message });
            contactId = newContact.id;
        } else {
            contactId = existingContact.id;
            newCount = existingContact.report_count + 1;

            const { error: updateError } = await supabase
                .from('contacts')
                .update({
                    report_count: newCount,
                    status: existingContact.status === 'flagged' ? 'flagged' : (newCount >= 2 ? 'flagged' : 'under_review'),
                    last_reported_at: new Date()
                })
                .eq('id', contactId);

            if (updateError) return res.status(500).json({ error: updateError.message });
        }

        const { error: reportError } = await supabase
            .from('reports')
            .insert([{
                contact_id: contactId,
                fraud_type,
                description,
                proof_path
            }]);

        if (reportError) return res.status(500).json({ error: reportError.message });

        res.json({ message: 'Report submitted successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// 3. Admin Reports
router.get('/admin/reports', async (req, res) => {
    const secret = req.headers['x-admin-secret'];
    if (secret !== ADMIN_SECRET) return res.status(403).json({ error: 'Unauthorized' });

    try {
        const { data, error } = await supabase
            .from('reports')
            .select(`
                *,
                contacts (
                    hashed_contact,
                    report_count,
                    status
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const flattened = data.map(r => ({
            ...r,
            hashed_contact: r.contacts?.hashed_contact,
            report_count: r.contacts?.report_count,
            contact_status: r.contacts?.status
        }));

        res.json(flattened);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Admin Status
router.post('/admin/contacts/:id/status', async (req, res) => {
    const secret = req.headers['x-admin-secret'];
    if (secret !== ADMIN_SECRET) return res.status(403).json({ error: 'Unauthorized' });

    const { status } = req.body;
    const id = req.params.id;

    const { error } = await supabase
        .from('contacts')
        .update({ status })
        .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Status updated' });
});

// 5. Admin Delete
router.delete('/admin/reports/:id', async (req, res) => {
    const secret = req.headers['x-admin-secret'];
    if (secret !== ADMIN_SECRET) return res.status(403).json({ error: 'Unauthorized' });

    const id = req.params.id;

    const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Report deleted' });
});

// 6. Removal
router.post('/removal-request', async (req, res) => {
    const { contact, reason } = req.body;
    if (!contact || !reason) return res.status(400).json({ error: 'Missing fields' });

    const hashed = hashContact(contact);

    const { error } = await supabase
        .from('removal_requests')
        .insert([{ contact_identifier: hashed, reason }]);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Request submitted' });
});


// Mount Router
app.use('/api', router); // Local
app.use('/.netlify/functions/api', router); // Netlify

// Local Server
if (!process.env.NETLIFY) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

// Export for Netlify
module.exports = app;
