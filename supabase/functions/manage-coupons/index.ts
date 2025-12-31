import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, coupon } = await req.json();

    if (action === 'list') {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ coupons: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create') {
      const { code, discount_percent, discount_amount, min_order_amount, max_uses, expires_at, is_active } = coupon;

      // Check if code already exists
      const { data: existing } = await supabase
        .from('coupons')
        .select('id')
        .eq('code', code.toUpperCase())
        .single();

      if (existing) {
        return new Response(JSON.stringify({ error: 'Coupon code already exists' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabase
        .from('coupons')
        .insert({
          code: code.toUpperCase(),
          discount_percent: discount_percent || null,
          discount_amount: discount_amount || null,
          min_order_amount: min_order_amount || 0,
          max_uses: max_uses || null,
          expires_at: expires_at || null,
          is_active: is_active !== false,
        })
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ coupon: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update') {
      const { id, code, discount_percent, discount_amount, min_order_amount, max_uses, expires_at, is_active } = coupon;

      // Check if code already exists for another coupon
      const { data: existing } = await supabase
        .from('coupons')
        .select('id')
        .eq('code', code.toUpperCase())
        .neq('id', id)
        .single();

      if (existing) {
        return new Response(JSON.stringify({ error: 'Coupon code already exists' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabase
        .from('coupons')
        .update({
          code: code.toUpperCase(),
          discount_percent: discount_percent || null,
          discount_amount: discount_amount || null,
          min_order_amount: min_order_amount || 0,
          max_uses: max_uses || null,
          expires_at: expires_at || null,
          is_active: is_active,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ coupon: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      const { id } = coupon;
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'toggle') {
      const { id, is_active } = coupon;
      const { data, error } = await supabase
        .from('coupons')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ coupon: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in manage-coupons:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
