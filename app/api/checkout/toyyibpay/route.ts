import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, total, customer, cart } = body;

    // Build a summary of parts to show on the ToyyibPay Receipt
    const partSummary = cart.map((item: any) => `${item.qty}x ${item.brand_name} ${item.name_en}`).join(', ');

    const formData = new URLSearchParams();
    formData.append('userSecretKey', process.env.TOYYIBPAY_SECRET!);
    formData.append('categoryCode', process.env.TOYYIBPAY_CATEGORY!);
    formData.append('billName', `CHASSIS PRO ORDER #${orderId.slice(0,5)}`);
    
    // This description will appear in the official email receipt sent by ToyyibPay
    formData.append('billDescription', `Items: ${partSummary.substring(0, 100)}`); 
    
    formData.append('billPriceSetting', '1');
    formData.append('billPayorInfo', '1');
    formData.append('billAmount', (total * 100).toFixed(0)); // Convert RM to Cents
    formData.append('billReturnUrl', `${process.env.NEXT_PUBLIC_URL}/order-status?order_id=${orderId}`);
    formData.append('billCallbackUrl', `${process.env.NEXT_PUBLIC_URL}/api/webhooks/toyyibpay`);
    formData.append('billExternalReferenceNo', orderId);
    formData.append('billTo', customer.name);
    formData.append('billEmail', customer.email);
    formData.append('billPhone', customer.whatsapp);

    // Using Sandbox URL
    const response = await fetch('https://dev.toyyibpay.com/index.php/api/createBill', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    
    if (data && data[0]?.BillCode) {
      return NextResponse.json({ url: `https://dev.toyyibpay.com/${data[0].BillCode}` });
    } else {
      return NextResponse.json({ error: 'ToyyibPay Error', details: data }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}