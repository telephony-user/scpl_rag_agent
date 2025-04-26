require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY; // Или SUPABASE_SERVICE_ROLE_KEY для серверных операций

if (!supabaseUrl || !supabaseKey) {
    console.warn('Переменные окружения Supabase (SUPABASE_URL, SUPABASE_ANON_KEY/SUPABASE_SERVICE_ROLE_KEY) не установлены. Клиент не будет инициализирован.');
}

// Инициализируем клиент только если переменные установлены
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

module.exports = supabase; 