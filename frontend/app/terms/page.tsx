export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-white mb-8">Terms and Conditions</h1>
        
        <div className="prose prose-invert prose-slate max-w-none space-y-6 text-gray-300">
          <p className="text-sm text-gray-400">Last Updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Agreement to Terms</h2>
            <p>
              By accessing or using AI Freedom Studios ("Platform," "Service," "we," "us," or "our"), you agree to be bound by these 
              Terms and Conditions. If you disagree with any part of these terms, you may not access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Description of Service</h2>
            <p>
              AI Freedom Studios is an AI-powered platform that enables users to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Create and manage creative content (text, images, videos)</li>
              <li>Generate AI-powered campaigns and strategies</li>
              <li>Connect and publish to social media platforms</li>
              <li>Schedule and automate content publishing</li>
              <li>Access analytics and performance insights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. Account Registration</h2>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.1 Eligibility</h3>
            <p>
              You must be at least 18 years old to use this Service. By creating an account, you represent that you meet this requirement.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.2 Account Security</h3>
            <p>You are responsible for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Maintaining the confidentiality of your password</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of unauthorized access</li>
              <li>Ensuring your account information is accurate and current</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.3 Account Termination</h3>
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, 
              or pose security risks.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Subscription and Payment</h2>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.1 Subscription Plans</h3>
            <p>
              We offer various subscription tiers with different features and usage limits. Current pricing is available on our pricing page.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.2 Billing</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Subscriptions are billed in advance on a recurring basis (monthly or annually)</li>
              <li>You authorize us to charge your payment method automatically</li>
              <li>Prices are subject to change with 30 days' notice</li>
              <li>All fees are non-refundable except as required by law</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.3 Cancellation</h3>
            <p>
              You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. 
              No refunds are provided for partial months.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.4 Free Trials</h3>
            <p>
              Free trials may be offered at our discretion. At the end of the trial, your payment method will be charged unless 
              you cancel before the trial ends.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Acceptable Use Policy</h2>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.1 Permitted Use</h3>
            <p>You may use the Service for lawful business and personal creative purposes.</p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.2 Prohibited Activities</h3>
            <p>You agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Create illegal, harmful, or offensive content</li>
              <li>Violate intellectual property rights</li>
              <li>Generate spam, malware, or deceptive content</li>
              <li>Impersonate others or misrepresent your identity</li>
              <li>Attempt to gain unauthorized access to systems</li>
              <li>Reverse engineer or copy our software</li>
              <li>Resell or redistribute the Service without authorization</li>
              <li>Use automated tools to scrape or harvest data</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Create content that promotes violence, hate speech, or discrimination</li>
              <li>Generate sexually explicit content involving minors</li>
              <li>Bypass rate limits or usage restrictions</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.3 Content Moderation</h3>
            <p>
              We reserve the right to review, monitor, and remove content that violates these terms or applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Intellectual Property</h2>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">6.1 Your Content</h3>
            <p>
              You retain ownership of content you create using our Service. By using the Service, you grant us a limited license to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Store, process, and display your content</li>
              <li>Use your content to provide and improve the Service</li>
              <li>Create derivative works necessary for service operation</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">6.2 AI-Generated Content</h3>
            <p>
              Content generated by our AI tools may be subject to the terms of our AI service providers. 
              You are responsible for ensuring your use of AI-generated content complies with applicable laws and third-party rights.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">6.3 Platform Intellectual Property</h3>
            <p>
              The Platform, including its software, design, text, graphics, and trademarks, is owned by AI Freedom Studios 
              and protected by copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">7. Third-Party Services</h2>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">7.1 Social Media Integration</h3>
            <p>
              When connecting social media accounts (Facebook, Instagram, etc.), you agree to comply with their terms of service and policies. 
              We are not responsible for actions taken by third-party platforms.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">7.2 Meta Platform Compliance</h3>
            <p>
              Our integration with Meta platforms is subject to Meta's Platform Terms and Policies. You must:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Comply with Meta's Community Standards and content policies</li>
              <li>Obtain necessary rights and permissions for content you publish</li>
              <li>Not use our Service to violate Meta's terms</li>
              <li>Be aware that Meta may revoke access at any time</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">7.3 AI Service Providers</h3>
            <p>
              We use third-party AI services (OpenAI, Anthropic, Replicate, Poe) for content generation. 
              Your use of AI features is subject to their respective terms and policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">8. Service Availability and Modifications</h2>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">8.1 Availability</h3>
            <p>
              We strive for high availability but do not guarantee uninterrupted access. The Service may be unavailable due to 
              maintenance, updates, or unforeseen issues.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">8.2 Modifications</h3>
            <p>
              We reserve the right to modify, suspend, or discontinue any part of the Service at any time with reasonable notice.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">8.3 Usage Limits</h3>
            <p>
              We may impose usage limits (API calls, storage, generations) based on your subscription tier. 
              Exceeding limits may result in additional charges or service restrictions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">9. Data and Privacy</h2>
            <p>
              Your use of the Service is subject to our <a href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</a>. 
              By using the Service, you consent to our collection and use of data as described in the Privacy Policy.
            </p>
            <p className="mt-4">
              You can request deletion of your data at any time through our <a href="/data-deletion" className="text-blue-400 hover:underline">Data Deletion Request</a> page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">10. Disclaimers and Limitations of Liability</h2>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">10.1 Service "AS IS"</h3>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, 
              INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">10.2 AI-Generated Content</h3>
            <p>
              We do not guarantee the accuracy, quality, or appropriateness of AI-generated content. You are solely responsible 
              for reviewing and verifying content before use or publication.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">10.3 Limitation of Liability</h3>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, AI FREEDOM STUDIOS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, DATA LOSS, OR BUSINESS INTERRUPTION, 
              ARISING FROM YOUR USE OF THE SERVICE.
            </p>
            <p className="mt-4">
              Our total liability for any claims shall not exceed the amount you paid us in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">11. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless AI Freedom Studios, its officers, directors, employees, and agents from any claims, 
              damages, losses, liabilities, and expenses (including legal fees) arising from:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of third-party rights</li>
              <li>Content you create or publish using the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">12. Dispute Resolution</h2>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">12.1 Informal Resolution</h3>
            <p>
              Before filing a claim, you agree to contact us at legal@aifreedomstudios.com to attempt informal resolution.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">12.2 Arbitration</h3>
            <p>
              Any disputes that cannot be resolved informally shall be settled by binding arbitration in accordance with 
              the rules of the American Arbitration Association. You waive your right to a jury trial.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">12.3 Class Action Waiver</h3>
            <p>
              You agree to bring claims only in your individual capacity and not as part of a class action or representative proceeding.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, 
              without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">14. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of material changes by email or through a 
              prominent notice on the Platform. Your continued use after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">15. Severability</h2>
            <p>
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">16. Entire Agreement</h2>
            <p>
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and AI Freedom Studios 
              regarding the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">17. Contact Information</h2>
            <p>For questions about these Terms:</p>
            <div className="mt-4 space-y-2">
              <p><strong>Email:</strong> legal@aifreedomstudios.com</p>
              <p><strong>Support:</strong> support@aifreedomstudios.com</p>
              <p><strong>Address:</strong> AI Freedom Studios, [Your Address]</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
