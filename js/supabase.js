/* ============================================
   ARE YOU DELULU - Supabase Client
   ============================================ */

(function() {
  console.log('[Supabase] Initializing...');
  
  const SUPABASE_URL = 'https://icxjgeakmvorfamsfxsn.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljeGpnZWFrbXZvcmZhbXNmeHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNjMzOTUsImV4cCI6MjA4MTYzOTM5NX0.e4JFkn9AZBeJS6sZ7JvjQOWnBI_lxiPGoygIrRkuJm0';

  // Export for edge function calls
  window.SUPABASE_URL = SUPABASE_URL;
  window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

  // Initialize Supabase client and export as db
  window.db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  console.log('[Supabase] Client created:', !!window.db);
})();