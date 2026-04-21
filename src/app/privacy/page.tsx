import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-on-surface">
      <h1 className="text-3xl font-black mb-8">Privacy Policy</h1>
      
      <p className="mb-6 text-on-surface/70 leading-relaxed">
        Last updated: April 16, 2026
      </p>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 uppercase tracking-wider text-primary">1. Overview</h2>
        <p className="leading-relaxed text-on-surface/80">
          World of Group ("we," "our," or "us") operates the WoC platform. This Privacy Policy informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 uppercase tracking-wider text-primary">2. Information Collection and Use</h2>
        <p className="mb-4 leading-relaxed text-on-surface/80">
          We collect several different types of information for various purposes to provide and improve our Service to you:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-on-surface/80">
          <li><strong>Personal Data:</strong> Email address, First name and last name, Phone number, Profile image (via Social Login).</li>
          <li><strong>Usage Data:</strong> We may also collect information on how the Service is accessed and used.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 uppercase tracking-wider text-primary">3. Data from Social Networks</h2>
        <p className="leading-relaxed text-on-surface/80">
          If you use Facebook, Google or other social networks to log in to our Service, we receive certain information from those networks (such as your name, email, and profile picture). We use this information strictly to create your account and provide you with a personalized experience.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 uppercase tracking-wider text-primary">4. Data Deletion</h2>
        <p className="leading-relaxed text-on-surface/80">
          You have the right to request the deletion of your personal data at any time. For specific instructions on how to delete your account or specific data points, please visit our <a href="/deleteURL" className="text-primary underline">Data Deletion Instructions</a> page.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 uppercase tracking-wider text-primary">5. Contact Us</h2>
        <p className="leading-relaxed text-on-surface/80">
          If you have any questions about this Privacy Policy, please contact us:
          <br />
          Email: stonehong1@gmail.com
        </p>
      </section>
    </div>
  );
}
