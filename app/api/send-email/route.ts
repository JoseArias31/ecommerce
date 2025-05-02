import { NextResponse } from "next/server";
import { Resend } from "resend";
import { EmailTemplate } from "@/components/EmailTemplate";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Received email data:', data);

    const { customerEmail, adminEmail, customerData, adminData } = data;
    
    if (!customerEmail || !adminEmail || !customerData || !adminData) {
      console.error('Missing required data:', data);
      return NextResponse.json(
        { error: 'Missing required email data' },
        { status: 400 }
      );
    }

    console.log('Sending email to customer:', customerEmail);
    // Send email to customer
    let customerResponse;
    let adminResponse;

    try {
      customerResponse = await resend.emails.send({
        from: 'The Quick Shop <onboarding@resend.dev>', // 👈 Pre-verified domain
  to: customerEmail,
  subject: 'Your Order Confirmation',
  react: EmailTemplate(customerData),
  replyTo: 'gojosearias@gmail.com' // 👈 Replies go to your Gmail
      });
      console.log('Customer email response:', customerResponse);
    } catch (customerError) {
      console.error('Customer email error:', customerError);
      customerResponse = { error: 'Failed to send customer email' };
    }

    try {
      adminResponse = await resend.emails.send({
        from: 'The Quick Shop <onboarding@resend.dev>',
        to: adminEmail,
        subject: 'New Order Received',
        react: EmailTemplate(adminData)
      });
      console.log('Admin email response:', adminResponse);
    } catch (adminError) {
      console.error('Admin email error:', adminError);
      adminResponse = { error: 'Failed to send admin email' };
    }

    return NextResponse.json({ 
      success: true,
      customerResponse: customerResponse || { error: 'Failed to send customer email' },
      adminResponse: adminResponse || { error: 'Failed to send admin email' }
    });
  } catch (error) {
    console.error("Email sending error:", error);
    return NextResponse.json(
      { error: "Failed to send emails" },
      { status: 500 }
    );
  }
}
