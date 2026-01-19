import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 1. ToyyibPay sends status updates as Form Data
    const formData = await req.formData();
    
    // 2. Extract values sent by ToyyibPay
    // status '1' means Success, '2' means Pending, '3' means Failed
    const status = formData.get('status'); 
    const orderId = formData.get('order_id'); 

    console.log(`Webhook Signal: Order ${orderId} is Status ${status}`);

    if (status === '1' && orderId) {
      // 3. Update the status in your Supabase Database
      const { error } = await supabase
        .from('orders')
        .update({ status: 'PAID' })
        .eq('id', orderId);

      if (error) {
        console.error('Database Update Error:', error);
        return new Response('Database Error', { status: 500 });
      }

      return new Response('OK', { status: 200 });
    }

    return new Response('Payment not successful', { status: 200 });
  } catch (err) {
    console.error('Webhook Runtime Error:', err);
    return new Response('Webhook Error', { status: 500 });
  }
}