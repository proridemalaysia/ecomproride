import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customer, cart, total, orderId } = body;

    // During testing, Resend only allows sending to your own email
    // We will send it to your email but address it to the customer
    const recipientEmail = "proridemalaysia@gmail.com"; 

    const { data, error } = await resend.emails.send({
      from: 'Chassis Pro Test <onboarding@resend.dev>',
      to: recipientEmail, 
      subject: `TEST ORDER RECEIVED #${orderId.slice(0,5)}`,
      html: `
        <div style="font-family: sans-serif;">
          <h2>ORDER RECEIVED (TEST MODE)</h2>
          <p>This email is sent to Admin because domain is not yet verified.</p>
          <hr/>
          <p>Customer Name: ${customer.name}</p>
          <p>Customer Email: ${customer.email}</p>
          <p>Total: RM ${total.toFixed(2)}</p>
        </div>
      `,
    });

    if (error) {
      console.log("Resend Sandbox Restriction: Email not sent to customer, but order will proceed.");
      return NextResponse.json({ success: true, warning: "Sandbox mode" });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}