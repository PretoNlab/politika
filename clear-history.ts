import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/\\n/g, '');
const supabaseKey = process.env.SUPABASE_SERVICE_KEY?.replace(/\\n/g, '');

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearHistory() {
    console.log("Apagando histórico de análises...");
    // Using a trick to delete all rows: id.neq.'00000000-0000-0000-0000-000000000000' or similar
    // Better yet, just delete rows where id is not null. You can't delete without a filter in PostgREST typically.
    const { data, error } = await supabase
        .from('analyses')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
        console.error("Erro ao apagar histórico:", error.message);
    } else {
        console.log("Histórico de análises apagado com sucesso!");
    }
}

clearHistory();
