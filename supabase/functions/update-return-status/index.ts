import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateSession, isEmailAuthorized } from '../_shared/session-validator.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateReturnStatusRequest {
  admin_email: string;
  admin_token: string;
  order_id: string;
  return_status: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { admin_email, admin_token, order_id, return_status }: UpdateReturnStatusRequest = await req.json();

    // Validate required fields
    if (!admin_email || !admin_token) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!order_id || !return_status) {
      return new Response(JSON.stringify({ error: 'Order ID and return status are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate return status value
    const validStatuses = ['requested', 'approved', 'accepted', 'rejected', 'completed'];
    if (!validStatuses.includes(return_status)) {
      return new Response(JSON.stringify({ error: 'Invalid return status' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if email is authorized (admin or shipping)
    const adminEmails = (Deno.env.get('ADMIN_EMAILS') || '')
      .split(',')
      .map((e) => e.trim().toLowerCase());
    const shippingEmails = (Deno.env.get('SHIPPING_EMAILS') || '')
      .split(',')
      .map((e) => e.trim().toLowerCase());

    if (!isEmailAuthorized(admin_email, adminEmails, shippingEmails)) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate session token
    const isValidSession = await validateSession(supabase, admin_email, admin_token);
    if (!isValidSession) {
      return new Response(JSON.stringify({ error: 'Session expired or invalid' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch the order to verify it exists
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, return_status')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update the return status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        return_status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order_id);

    if (updateError) {
      console.error('Error updating return status:', updateError);
      throw updateError;
    }

    // Log the activity
    await supabase.from('activity_logs').insert({
      action_type: 'return_status_update',
      actor_email: admin_email,
      actor_role: adminEmails.includes(admin_email.toLowerCase()) ? 'admin' : 'shipping',
      order_id: order_id,
      order_number: order.order_number,
      action_details: {
        previous_status: order.return_status,
        new_status: return_status,
      },
    });

    return new Response(JSON.stringify({ success: true, return_status }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in update-return-status:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
