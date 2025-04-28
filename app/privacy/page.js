export default function PrivacyPage() {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
  
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="text-gray-700 mb-3">
              We collect information you provide directly to us, such as when you create an account, make a purchase, or
              contact customer service.
            </p>
            <p className="text-gray-700">
              This may include your name, email address, postal address, phone number, and payment information.
            </p>
          </section>
  
          <section>
            <h2 className="text-xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-700 mb-3">We use the information we collect to:</p>
            <ul className="list-disc pl-5 text-gray-700 space-y-2">
              <li>Process and fulfill your orders</li>
              <li>Communicate with you about your account or orders</li>
              <li>Send you marketing communications (if you've opted in)</li>
              <li>Improve our website and customer service</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>
  
          <section>
            <h2 className="text-xl font-semibold mb-4">3. Cookies and Tracking</h2>
            <p className="text-gray-700 mb-3">
              We use cookies and similar technologies to track activity on our website and hold certain information. You
              can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>
          </section>
  
          <section>
            <h2 className="text-xl font-semibold mb-4">4. Data Security</h2>
            <p className="text-gray-700 mb-3">
              We implement appropriate security measures to protect your personal information. However, no method of
              transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>
  
          <section>
            <h2 className="text-xl font-semibold mb-4">5. Your Rights</h2>
            <p className="text-gray-700 mb-3">
              Depending on your location, you may have rights regarding your personal information, such as the right to
              access, correct, or delete your data.
            </p>
          </section>
        </div>
  
        <div className="mt-12 text-sm text-gray-500">
          <p>Last updated: April 28, 2025</p>
          <p className="mt-2">If you have any questions about our Privacy Policy, please contact us.</p>
        </div>
      </div>
    )
  }
  