import React from 'react';

export default function DeleteDataPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-on-surface">
      <h1 className="text-3xl font-black mb-8">User Data Deletion Instructions</h1>
      
      <p className="mb-10 text-on-surface/70 leading-relaxed uppercase tracking-widest text-[12px]">
        Account Deletion & Data Removal
      </p>

      <section className="mb-12 p-8 rounded-3xl bg-on-surface/[0.03] border border-outline-variant/10">
        <h2 className="text-xl font-bold mb-6 text-primary">Facebook Data Deletion</h2>
        <p className="mb-6 leading-relaxed text-on-surface/80">
          World of Community (WoC) uses Facebook Login to manage user accounts. If you wish to delete your activities for WoC, you can remove your information by following these steps:
        </p>
        <ol className="list-decimal pl-5 space-y-4 text-on-surface/80 font-medium">
          <li>Go to your Facebook Account's <strong>"Settings & Privacy"</strong> menu.</li>
          <li>Click on <strong>"Settings"</strong> and then <strong>"Apps and Websites"</strong> on the left-hand menu.</li>
          <li>Find <strong>"WoC"</strong> and click the <strong>"Remove"</strong> button.</li>
          <li>Alternatively, you can contact us directly at <span className="text-primary">stonehong1@gmail.com</span> to request manual data deletion.</li>
        </ol>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4 uppercase tracking-wider text-primary">Direct Account Deletion</h2>
        <p className="leading-relaxed text-on-surface/80">
          To delete your account and all associated data directly from our platform:
        </p>
        <ul className="list-disc pl-5 mt-4 space-y-2 text-on-surface/80">
          <li>Log in to the WoC platform.</li>
          <li>Navigate to the <strong>"My Info"</strong> section.</li>
          <li>Find the <strong>"Delete Account"</strong> option at the bottom of the profile settings.</li>
          <li>Confirm your choice. This action is permanent and will remove all your data from our database.</li>
        </ul>
      </section>

      <div className="pt-10 border-t border-outline-variant/10 opacity-50 text-center">
        <p className="text-[10px] font-black tracking-widest uppercase">
          World of Community Support · stonehong1@gmail.com
        </p>
      </div>
    </div>
  );
}
