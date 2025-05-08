import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Make request to Brevo API
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        email: email,
        attributes: name ? { FIRSTNAME: name } : undefined,
        listIds: [2], // Replace with your actual list ID
        updateEnabled: true
      })
    });

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      // Handle specific Brevo API errors
      if (response.status === 400) {
        return NextResponse.json(
          { error: 'Invalid email address' },
          { status: 400 }
        );
      }
      
      if (response.status === 409) {
        return NextResponse.json(
          { error: 'Email already subscribed' },
          { status: 409 }
        );
      }

      // If we have error data from the API, use it
      if (data && data.message) {
        return NextResponse.json(
          { error: data.message },
          { status: response.status }
        );
      }

      // Generic error if no specific error message
      return NextResponse.json(
        { error: 'Failed to subscribe to newsletter' },
        { status: response.status }
      );
    }

    // Success response
    return NextResponse.json(
      { message: 'Successfully subscribed to newsletter' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    
    // Handle network errors or other unexpected errors
    return NextResponse.json(
      { error: 'Failed to connect to newsletter service' },
      { status: 500 }
    );
  }
} 