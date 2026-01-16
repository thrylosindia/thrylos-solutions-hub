import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action, email, password, pmId, token, requestId, status, note } = body;

    // Simple token generation
    const generateToken = (pmId: string): string => {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      return btoa(`${pmId}:${timestamp}:${random}`);
    };

    // Validate token (simple validation - token contains pmId)
    const validateToken = (token: string, pmId: string): boolean => {
      try {
        const decoded = atob(token);
        return decoded.startsWith(pmId);
      } catch {
        return false;
      }
    };

    // Hash password (simple hash for demo - in production use bcrypt)
    const hashPassword = async (pwd: string): Promise<string> => {
      const encoder = new TextEncoder();
      const data = encoder.encode(pwd + 'thrylos_salt_2024');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    switch (action) {
      case 'login': {
        if (!email || !password) {
          return new Response(
            JSON.stringify({ success: false, error: 'Email and password required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Find PM by email
        const { data: pm, error: pmError } = await supabase
          .from('project_managers')
          .select('*')
          .eq('email', email.toLowerCase())
          .single();

        if (pmError || !pm) {
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid email or password' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check password
        const hashedInput = await hashPassword(password);
        
        // If no password set, check if input matches email (first time login)
        if (!pm.password_hash) {
          // First login - set the password
          const { error: updateError } = await supabase
            .from('project_managers')
            .update({ password_hash: hashedInput })
            .eq('id', pm.id);

          if (updateError) {
            console.error('Error setting password:', updateError);
            return new Response(
              JSON.stringify({ success: false, error: 'Failed to set password' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } else if (pm.password_hash !== hashedInput) {
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid email or password' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const generatedToken = generateToken(pm.id);

        return new Response(
          JSON.stringify({
            success: true,
            pm: {
              id: pm.id,
              name: pm.name,
              email: pm.email,
              specialization: pm.specialization
            },
            token: generatedToken
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-projects': {
        if (!pmId || !token) {
          return new Response(
            JSON.stringify({ success: false, error: 'Authentication required' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!validateToken(token, pmId)) {
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid token' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: projects, error: projectsError } = await supabase
          .from('service_requests')
          .select('*')
          .eq('assigned_pm_id', pmId)
          .order('created_at', { ascending: false });

        if (projectsError) {
          console.error('Error fetching projects:', projectsError);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to fetch projects' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, projects }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update-status': {
        if (!pmId || !token || !requestId || !status) {
          return new Response(
            JSON.stringify({ success: false, error: 'Missing required fields' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!validateToken(token, pmId)) {
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid token' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verify this PM is assigned to this request
        const { data: request } = await supabase
          .from('service_requests')
          .select('assigned_pm_id')
          .eq('id', requestId)
          .single();

        if (!request || request.assigned_pm_id !== pmId) {
          return new Response(
            JSON.stringify({ success: false, error: 'Not authorized to update this request' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: updateError } = await supabase
          .from('service_requests')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', requestId);

        if (updateError) {
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to update status' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // If completed, check if PM should be marked available
        if (status === 'completed' || status === 'cancelled') {
          const { data: otherProjects } = await supabase
            .from('service_requests')
            .select('id')
            .eq('assigned_pm_id', pmId)
            .not('id', 'eq', requestId)
            .in('status', ['pending', 'in_progress']);

          if (!otherProjects || otherProjects.length === 0) {
            await supabase
              .from('project_managers')
              .update({ is_available: true })
              .eq('id', pmId);
          }
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'add-note': {
        if (!pmId || !token || !requestId || !note) {
          return new Response(
            JSON.stringify({ success: false, error: 'Missing required fields' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!validateToken(token, pmId)) {
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid token' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verify this PM is assigned to this request
        const { data: request } = await supabase
          .from('service_requests')
          .select('assigned_pm_id, notes')
          .eq('id', requestId)
          .single();

        if (!request || request.assigned_pm_id !== pmId) {
          return new Response(
            JSON.stringify({ success: false, error: 'Not authorized to update this request' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const existingNotes = request.notes || '';
        const newNotes = existingNotes 
          ? `${existingNotes}\n\n[${new Date().toLocaleString()}]\n${note}`
          : `[${new Date().toLocaleString()}]\n${note}`;

        const { error: updateError } = await supabase
          .from('service_requests')
          .update({ notes: newNotes, updated_at: new Date().toISOString() })
          .eq('id', requestId);

        if (updateError) {
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to add note' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('PM Auth error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});