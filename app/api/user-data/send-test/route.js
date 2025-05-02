import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { to, subject, message } = await request.json();
    
    // Validate input
    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create simple HTML email
    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">${subject}</h1>
            <p>${message}</p>
          </div>
        </body>
      </html>
    `;

    // Use a test email address that doesn't require domain verification
    const testEmail = 'gojosearias@gmail.com';
    
    // Send email
    const response = await resend.emails.send({
      from: 'Test Sender <onboarding@resend.dev>',
      to: testEmail,
      subject: subject,
      html: html,
    });

    console.log('Email sent successfully:', response);

    return NextResponse.json({ 
      success: true,
      emailId: response.id
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { 
        error: error.message,
        details: error.stack 
      }, 
      { status: 500 }
    );
  }
}
