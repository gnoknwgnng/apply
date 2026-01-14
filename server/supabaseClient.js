require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials missing. Please set SUPABASE_URL and SUPABASE_KEY in .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
