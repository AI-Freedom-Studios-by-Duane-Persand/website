export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert prose-slate max-w-none space-y-6 text-gray-300">
          <p className="text-sm text-gray-400">Last Updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Introduction</h2>
            <p>
              AI Freedom Studios ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. 
              This privacy policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, password, and profile details</li>
               <li><strong>Business Information:</strong> Business name, industry, and phone number (optional)</li>
              <li><strong>Payment Information:</strong> Billing address and payment method details (processed securely by our payment provider)</li>
               <li><strong>User Content & Platform Data:</strong> Text prompts, content drafts, marketing copy, creative content, campaigns, images, videos, funnels, workflows, automations, and CRM data you create or upload</li>
              <li><strong>Communications:</strong> Messages, feedback, and support requests</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.2 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent, and interaction patterns</li>
              <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
              <li><strong>Cookies:</strong> Session cookies, preference cookies, and analytics cookies</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.3 Social Media Integration</h3>
            <p>
              When you connect social media accounts (Facebook, Instagram, etc.), we collect:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Profile information (name, profile picture, user ID)</li>
              <li>Access tokens for posting content</li>
              <li>Page and account permissions you grant</li>
              <li>Analytics and insights data from your connected accounts</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Delivery:</strong> To provide, maintain, and improve our AI-powered creative tools</li>
              <li><strong>Content Generation:</strong> To process your prompts and generate images, videos, and text</li>
              <li><strong>Social Media Publishing:</strong> To post content to your connected social media accounts</li>
              <li><strong>Account Management:</strong> To manage your subscription, billing, and authentication</li>
              <li><strong>Communication:</strong> To send service updates, notifications, and support responses</li>
              <li><strong>Analytics:</strong> To understand usage patterns and improve our platform</li>
              <li><strong>Security:</strong> To detect fraud, abuse, and security threats</li>
              <li><strong>Legal Compliance:</strong> To comply with legal obligations and enforce our terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Meta Platform Integration</h2>
            <p>
              When you use our Meta (Facebook/Instagram) integration features:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>We comply with Meta's Platform Terms and Developer Policies</li>
              <li>We only request necessary permissions for our services</li>
              <li>You can revoke Meta permissions at any time through your Meta account settings</li>
              <li>We do not sell or share your Meta data with third parties for advertising</li>
              <li>Your Meta access tokens are encrypted and securely stored</li>
              <li>We do not use your data to train AI models that benefit other users</li>
            </ul>
          </section>

           <section>
             <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. AI Models & Data Privacy Commitment</h2>
             <p>
               AI Freedom Studios integrates AI technologies to deliver automation and content features. We are committed to responsible AI data practices:
             </p>
             <ul className="list-disc pl-6 space-y-2">
               <li><strong>No AI Training on User Data:</strong> Your prompts, inputs, and generated content are <strong>not used to train AI models</strong> unless explicitly stated and consented to. Your data is processed solely to provide the requested functionality.</li>
               <li><strong>Limited Data Retention:</strong> We work only with AI providers that adhere to strict data protection and non-retention policies where possible.</li>
               <li><strong>Vendor Due Diligence:</strong> We carefully evaluate AI partners for security, compliance, and privacy standards.</li>
               <li><strong>Purpose Limitation:</strong> Your data is processed only to provide AI-powered features within AI Freedom Studios.</li>
             </ul>
           </section>

          <section>
             <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Data Sharing and Disclosure</h2>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.1 Third-Party Services</h3>
            <p>We share data with trusted service providers:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Cloud Storage:</strong> Cloudflare R2 for secure file storage</li>
              <li><strong>AI Services:</strong> OpenAI, Anthropic, Replicate, and Poe for content generation</li>
              <li><strong>Payment Processing:</strong> Stripe for secure payment handling</li>
              <li><strong>Analytics:</strong> Anonymous usage analytics for service improvement</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.2 Legal Requirements</h3>
            <p>We may disclose your information when required by law, court order, or to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Comply with legal obligations</li>
              <li>Protect our rights and property</li>
              <li>Prevent fraud or security threats</li>
              <li>Protect user safety</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.3 Business Transfers</h3>
            <p>
              If we are involved in a merger, acquisition, or sale of assets, your information may be transferred. 
              We will notify you before your data is transferred and becomes subject to a different privacy policy.
            </p>
             <h3 className="text-xl font-semibold text-white mt-6 mb-3">6.4 No Sale of Personal Data</h3>
             <p>
               <strong>AI Freedom Studios does not sell, rent, or trade personal information to third parties.</strong> We respect your privacy and limit data sharing to trusted service providers necessary for platform operation.
             </p>
          </section>

          <section>
             <h2 className="text-2xl font-semibold text-white mt-8 mb-4">7. Data Security</h2>
            <p>We implement industry-standard security measures:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encryption in transit (HTTPS/TLS) and at rest</li>
              <li>Secure authentication with JWT tokens</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and monitoring</li>
              <li>Secure API key management</li>
            </ul>
            <p className="mt-4">
              However, no method of transmission over the Internet is 100% secure. While we strive to protect your data, 
              we cannot guarantee absolute security.
            </p>
          </section>

          <section>
             <h2 className="text-2xl font-semibold text-white mt-8 mb-4">8. Data Retention</h2>
            <p>We retain your data for as long as:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your account is active</li>
              <li>Needed to provide services</li>
              <li>Required for legal, tax, or accounting purposes</li>
              <li>Necessary to resolve disputes or enforce agreements</li>
            </ul>
            <p className="mt-4">
              When you delete your account, we will delete or anonymize your personal data within 30 days, 
              except where retention is required by law.
            </p>
          </section>

          <section>
             <h2 className="text-2xl font-semibold text-white mt-8 mb-4">9. Your Rights and Choices</h2>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">8.1 Access and Portability</h3>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Request a copy of your data in a portable format</li>
              <li>Receive information about how your data is processed</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">8.2 Correction and Deletion</h3>
            <p>You can:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Update your account information at any time</li>
              <li>Request deletion of your data (see <a href="/data-deletion" className="text-blue-400 hover:underline">Data Deletion Request</a>)</li>
              <li>Opt-out of marketing communications</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">8.3 Cookie Management</h3>
            <p>
              You can control cookies through your browser settings. Note that disabling cookies may affect platform functionality.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">8.4 Do Not Track</h3>
            <p>
              We currently do not respond to Do Not Track (DNT) browser signals.
            </p>
             <h3 className="text-xl font-semibold text-white mt-6 mb-3">9.4 Email Communications</h3>
             <p>
               We may contact you via email to provide account notifications, service updates, security alerts, and educational or promotional content. 
               You may opt out of marketing emails at any time by using the unsubscribe link included in our messages.
             </p>
           </section>

           <section>
             <h2 className="text-2xl font-semibold text-white mt-8 mb-4">10. Third-Party Links & Integrations</h2>
             <p>
               AI Freedom Studios may contain links to third-party websites or services. We are not responsible for the privacy practices or content of external sites. 
               We encourage users to review the privacy policies of any third-party services they use.
             </p>
             <p className="mt-4">
               <strong>Affiliate Links:</strong> Some links may be affiliate links, meaning we may earn a commission at no additional cost to you.
             </p>
          </section>

          <section>
             <h2 className="text-2xl font-semibold text-white mt-8 mb-4">11. International Data Transfers</h2>
            <p>
              Your data may be transferred to and processed in countries other than your country of residence. 
              We ensure appropriate safeguards are in place to protect your data in accordance with this privacy policy.
            </p>
          </section>

          <section>
             <h2 className="text-2xl font-semibold text-white mt-8 mb-4">12. Children's Privacy</h2>
            <p>
              Our service is not intended for children under 13 (or 16 in the EU). We do not knowingly collect data from children. 
              If you believe we have collected data from a child, please contact us immediately.
            </p>
          </section>

          <section>
             <h2 className="text-2xl font-semibold text-white mt-8 mb-4">13. California Privacy Rights (CCPA)</h2>
            <p>California residents have additional rights:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Right to know what personal information is collected</li>
              <li>Right to know if personal information is sold or disclosed</li>
              <li>Right to opt-out of sale of personal information (we do not sell your data)</li>
              <li>Right to deletion of personal information</li>
              <li>Right to non-discrimination for exercising privacy rights</li>
            </ul>
          </section>

          <section>
             <h2 className="text-2xl font-semibold text-white mt-8 mb-4">14. GDPR Rights (EU Users)</h2>
            <p>If you are in the European Economic Area, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Rectify inaccurate data</li>
              <li>Erase your data ("right to be forgotten")</li>
              <li>Restrict processing</li>
              <li>Data portability</li>
              <li>Object to processing</li>
              <li>Withdraw consent at any time</li>
              <li>Lodge a complaint with a supervisory authority</li>
            </ul>
          </section>

          <section>
             <h2 className="text-2xl font-semibold text-white mt-8 mb-4">15. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of significant changes by email 
              or through a prominent notice on our platform. Your continued use of the service after changes constitutes 
              acceptance of the updated policy.
            </p>
          </section>

          <section>
             <h2 className="text-2xl font-semibold text-white mt-8 mb-4">16. Contact Us</h2>
            <p>For privacy-related questions, concerns, or requests:</p>
            <div className="mt-4 space-y-2">
              <p><strong>Email:</strong> privacy@aifreedomstudios.com</p>
              <p><strong>Support:</strong> support@aifreedomstudios.com</p>
              <p><strong>Data Deletion:</strong> <a href="/data-deletion" className="text-blue-400 hover:underline">Submit a deletion request</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
