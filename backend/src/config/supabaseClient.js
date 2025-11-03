import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Faltan las variables de entorno SUPABASE_URL o SUPABASE_SERVICE_KEY.');
    process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey);