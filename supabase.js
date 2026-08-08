import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";


const SUPABASE_URL = "https://ochfxvxxrvunlxuwdcop.supabase.co";

const SUPABASE_KEY = "sb_publishable_3VILNZNCEMCUBO2h45YOKg_adfNG9Ld";


export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);