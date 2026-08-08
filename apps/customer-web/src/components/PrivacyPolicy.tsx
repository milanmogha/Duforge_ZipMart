import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8 text-gray-800">
      <h1 className="mb-4 text-3xl font-extrabold text-gray-900">
        Privacy Policy &ndash; ZipMart
      </h1>
      <p className="mb-6 text-sm leading-relaxed text-gray-600">
        Welcome to <strong>ZipMart</strong>! This Privacy Policy explains how we collect, use,
        disclose, and safeguard your information when you visit our website{' '}
        <a href="https://duforge.tech" className="font-semibold text-brand-600 hover:underline">
          https://duforge.tech
        </a>{' '}
        or use any of our services. By accessing or using our services, you agree to the collection and use
        of information in accordance with this Privacy Policy.
      </p>

      <section className="mb-6">
        <h2 className="mb-2 text-2xl font-bold">1. Information We Collect</h2>
        <div className="mb-4">
          <h3 className="text-xl font-semibold">a. Personal Information</h3>
          <ul className="ml-4 list-inside list-disc text-sm text-gray-600">
            <li>Full Name</li>
            <li>Email Address</li>
            <li>Phone Number</li>
            <li>Billing &amp; Shipping Address</li>
            <li>Payment Information (processed securely via third-party providers)</li>
            <li>Login credentials (if applicable)</li>
          </ul>
        </div>
        <div>
          <h3 className="text-xl font-semibold">b. Non-Personal Information</h3>
          <ul className="ml-4 list-inside list-disc text-sm text-gray-600">
            <li>Browser type and version</li>
            <li>Device and OS information</li>
            <li>IP address</li>
            <li>Site usage data via cookies and tracking tools</li>
          </ul>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-2xl font-bold">2. How We Use Your Information</h2>
        <ul className="ml-4 list-inside list-disc text-sm text-gray-600">
          <li>Process and fulfill your orders</li>
          <li>Provide customer support</li>
          <li>Improve our website and services</li>
          <li>Communicate order updates and promotions (if opted-in)</li>
          <li>Ensure security and prevent fraud</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-2xl font-bold">3. Sharing of Information</h2>
        <p className="text-sm text-gray-600">We do not sell or rent your personal information. We may share data only:</p>
        <ul className="ml-4 list-inside list-disc text-sm text-gray-600">
          <li>With service providers for payment processing, delivery, etc.</li>
          <li>To comply with legal obligations</li>
          <li>To protect rights and safety of users or our business</li>
          <li>During business transfers like mergers or acquisitions</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-2xl font-bold">4. Cookies &amp; Tracking</h2>
        <p className="text-sm text-gray-600">We use cookies and similar tools to:</p>
        <ul className="ml-4 list-inside list-disc text-sm text-gray-600">
          <li>Remember your preferences</li>
          <li>Understand how you use our site</li>
          <li>Provide a better shopping experience</li>
        </ul>
        <p className="text-sm text-gray-600">You can manage cookie settings through your browser.</p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-2xl font-bold">5. Data Security</h2>
        <p className="text-sm text-gray-600">
          We implement security safeguards to protect your data. However, no system is completely secure, and we
          advise taking care when sharing sensitive information online.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-2xl font-bold">6. Your Rights</h2>
        <p className="text-sm text-gray-600">You have the right to:</p>
        <ul className="ml-4 list-inside list-disc text-sm text-gray-600">
          <li>Access or update your data</li>
          <li>Delete your account or request data deletion</li>
          <li>Opt-out of promotional emails (unsubscribe link provided in emails)</li>
        </ul>
        <p className="text-sm text-gray-600">
          To exercise these rights, contact us at{' '}
          <a href="mailto:hello@duforge.tech" className="font-semibold text-brand-600 hover:underline">
            hello@duforge.tech
          </a>.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-2xl font-bold">7. Children’s Privacy</h2>
        <p className="text-sm text-gray-600">
          Our services are not intended for children under 13. We do not knowingly collect data from minors.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-2xl font-bold">8. Policy Updates</h2>
        <p className="text-sm text-gray-600">
          We may update this Privacy Policy. Changes will be posted on this page with a new effective date.
          Continued use after updates indicates acceptance of the revised policy.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-2xl font-bold">9. Contact Us</h2>
        <address className="text-sm not-italic text-gray-600">
          <p>ZipMart</p>
          <p>
            Website:{' '}
            <a href="https://duforge.tech" className="font-semibold text-brand-600 hover:underline">
              https://duforge.tech
            </a>
          </p>
          <p>
            Email:{' '}
            <a href="mailto:hello@duforge.tech" className="font-semibold text-brand-600 hover:underline">
              hello@duforge.tech
            </a>
          </p>
        </address>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
