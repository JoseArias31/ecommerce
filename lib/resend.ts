import { Resend } from "resend";

const resend = new Resend('re_KVGcomQe_38LTukHwU52AvNAMVzpdYt5a2');

// Add a test to ensure the client is initialized
if (!resend) {
  console.error('Failed to initialize Resend client');
  throw new Error('Failed to initialize Resend client');
}

export default resend;
