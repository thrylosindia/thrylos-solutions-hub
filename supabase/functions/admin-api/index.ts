import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-password",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ADMIN_PASSWORD = "628400@thrylosindia";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin password
    const adminPassword = req.headers.get("x-admin-password");
    if (adminPassword !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, table, data, id, filters } = await req.json();

    let result;

    switch (action) {
      case "select": {
        let query = supabase.from(table).select(data?.select || "*");
        
        if (filters?.eq) {
          for (const [key, value] of Object.entries(filters.eq)) {
            query = query.eq(key, value);
          }
        }
        if (filters?.order) {
          query = query.order(filters.order.column, { ascending: filters.order.ascending ?? false });
        }
        if (filters?.limit) {
          query = query.limit(filters.limit);
        }
        
        const { data: selectData, error } = await query;
        if (error) throw error;
        result = selectData;
        break;
      }

      case "insert": {
        const { data: insertData, error } = await supabase.from(table).insert(data).select();
        if (error) throw error;
        result = insertData;
        break;
      }

      case "update": {
        const { data: updateData, error } = await supabase.from(table).update(data).eq("id", id).select();
        if (error) throw error;
        result = updateData;
        break;
      }

      case "delete": {
        const { error } = await supabase.from(table).delete().eq("id", id);
        if (error) throw error;
        result = { success: true };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Admin API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
