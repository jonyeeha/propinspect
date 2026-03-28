import { createClient } from "@supabase/supabase-js";

const SUPA_URL = "https://efhbnddgcazzkbppzdqw.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaGJuZGRnY2F6emticHB6ZHF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTAzMjYsImV4cCI6MjA5MDEyNjMyNn0.BmEoq6jAq_2U0fK13YnCB9rtmblI5Cse3P-9-qtOkfA";

// Single shared instance — prevents "lock was released" auth conflicts
export const supabase = createClient(SUPA_URL, SUPA_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  }
});
