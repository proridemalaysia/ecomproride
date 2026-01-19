import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.formData();
  const status = body.get('status'); // 1 = Success, 2 = Pending, 3 = Fail
  const orderId = body.get('order_id');

  if (status === '1' && orderId) {
    // 1. Update Database to PAID
    await supabase.from('orders').update({ status: 'PAID' }).eq('id', orderId);

    // 2. Trigger Confirmation Email (Stage 2)
    // We call our existing confirmation API
    await fetch(`${process.env.NEXT_PUBLIC_URL}/api/orders/confirm`, {
      method: 'POST',
      body: JSON.stringify({ orderId })
    });

    console.log(`Order ${orderId} confirmed via ToyyibPay`);
  }

  return new Response('OK', { status: 200 });
}