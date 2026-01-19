import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { orderId } = await req.json();

  // 1. Update status in Database
  const { data: order, error } = await supabase
    .from('orders')
    .update({ status: 'PAID' })
    .eq('id', orderId)
    .select()
    .single();

  if (order) {
    // 2. Send Stage 2 Email
    await resend.emails.send({
      from: 'Chassis Pro <orders@yourdomain.com>',
      to: order.email,
      subject: `Payment Confirmed! Order #${orderId.slice(0,5)}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #16a34a;">PAYMENT SUCCESSFUL</h2>
          <p>Hi ${order.customer_name},</p>
          <p>Thank you! Your payment for order <strong>#${orderId.slice(0,5)}</strong> has been verified.</p>
          <p>Our warehouse in <strong>Kajang</strong> is now preparing your parts for shipment.</p>
          <p>We will send you a tracking number once the courier has picked up your parcel.</p>
          <br/>
          <a href="${process.env.NEXT_PUBLIC_URL}/orders/${orderId}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none;">View Order Details</a>
        </div>
      `,
    });
  }

  return NextResponse.json({ success: true });
}