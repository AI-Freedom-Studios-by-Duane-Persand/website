

import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Chatbot from '../components/Chatbot';

export default function Home() {
  return (
    <>
      <Header />
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
      <Chatbot />
    </>
  );
}

function HeroSection() {
  return (
    <section
      className="
        relative min-h-[80vh] flex items-center justify-center
        overflow-hidden
        bg-[radial-gradient(circle_at_top_left,_#6d355e_0,_#3b3b6d_40%,_#2563eb_100%)]
      "
    >
      {/* Soft overlay to smooth the gradient */}
      <div
        className="absolute inset-0 opacity-70 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 60% 40%, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.4) 100%)",
        }}
      />

      <div className="relative z-10 w-full px-4 pt-28 pb-20 flex flex-col items-center text-center">
        {/* Top badge */}
        <div className="mb-8">
          <span className="
            inline-flex items-center px-6 py-3 rounded-full
            bg-white/10 border border-white/25
            text-sm md:text-base font-medium text-white
            shadow-[0_10px_30px_rgba(15,23,42,0.6)]
            backdrop-blur-md
          ">
            ✨ 50+ languages • AI Coaching • CTV Publishing • White-Label Automation
          </span>
        </div>

        {/* Main heading */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight text-white mb-6">
          From Idea to Revenue
          <br />
          <span
            className="
              block mt-2 font-extrabold
              text-transparent bg-clip-text
              bg-gradient-to-r
              from-[#ef4444] via-[#f59e42] to-[#2563eb]
              opacity-95
            "
            style={{
              letterSpacing: "-0.5px",
              filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.15))",
            }}
          >
            All Powered by AI
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-base md:text-xl text-white/80 max-w-3xl mx-auto mb-10">
          Create videos, automate campaigns, launch funnels, and manage your clients — all inside
          one intelligent studio. Built for Creators, Coaches, and Agencies ready to scale without
          limits.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            href="/signup"
            className="
              px-8 py-4 rounded-lg font-semibold text-lg
              shadow-[0_15px_35px_rgba(15,23,42,0.7)]
              bg-gradient-to-r from-[#ef4444] via-[#f59e42] to-[#2563eb]
              text-white transition-transform hover:scale-[1.02] hover:opacity-95
            "
          >
            Start Now
          </Link>
        </div>

        {/* Trust bar */}
        <p className="text-xs md:text-sm text-white/70">
          Trusted by Agencies &amp; Creators in 30+ Countries • As seen on Roku, YouTube, Apple TV
        </p>
      </div>
    </section>
  );
}


function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to Scale
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Replace dozens of tools with one intelligent platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI Content & Video Creation */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg mb-6 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">AI Content & Video Creation</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Generate scripts, avatars, voiceovers, and videos in minutes</li>
                <li>• Voice cloning + auto-captions + multilingual support</li>
                <li>• Viral Score Predictor tells you what will perform best before you publish</li>
              </ul>
            </div>

            {/* Smart Funnels & Campaign Automation */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-blue-500 rounded-lg mb-6 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Smart Funnels & Campaign Automation</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Drag-drop Campaign Builder → auto-creates landing pages and ads</li>
                <li>• Lifecycle Follow-Up Engine handles email, SMS, DM, and voice touches (5 – 12 steps)</li>
                <li>• Integration ready for Meta, TikTok, YouTube, and GoHighLevel</li>
              </ul>
            </div>

            {/* AI Voice Receptionist */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow relative">
              <div className="absolute top-4 right-4">
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">NEW</span>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mb-6 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">AI Voice Receptionist</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• 24/7 AI & human-assisted call answering</li>
                <li>• Appointment scheduling + lead qualification</li>
                <li>• Outbound AI follow-ups by voice or SMS</li>
                <li>• <span className="text-purple-600 font-medium">(Upsell Tier — adds $97/mo per client or agency seat)</span></li>
              </ul>
            </div>

            {/* Belief-Alignment Offer Scoring */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg mb-6 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Belief-Alignment Offer Scoring</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Proprietary 8-factor psychology-based offer engine</li>
                <li>• Scores messaging for trust, pain resolution, status gain, and CTA clarity</li>
                <li>• AI suggests next best action for each funnel step</li>
              </ul>
            </div>

            {/* CTV Publishing + Social Automation */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg mb-6 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">CTV Publishing + Social Automation</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Publish directly to Roku, Apple TV, Fire TV, and more</li>
                <li>• Schedule content across Instagram, YouTube, LinkedIn in one click</li>
                <li>• Smart Budget Optimizer shifts ad spend toward top-performing channels</li>
              </ul>
            </div>

            {/* White-Label Agency Suite */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg mb-6 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">White-Label Agency Suite</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Your branding, your domain, your pricing</li>
                <li>• Usage-based billing, client portals, and affiliate dashboard</li>
                <li>• Perfect for agencies adding $10K – $50K/mo recurring revenue</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
  );
}


function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose AI Freedom Studios Over Others
            </h2>
            <p className="text-xl text-gray-600">
              See how we compare to other platforms
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-2xl shadow-lg overflow-hidden">
              <thead className="bg-gradient-to-r from-red-500 via-orange-500 to-blue-500 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Platform</th>
                  <th className="px-6 py-4 text-left font-semibold">Price</th>
                  <th className="px-6 py-4 text-left font-semibold">Core Focus</th>
                  <th className="px-6 py-4 text-left font-semibold">What They Lack</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="bg-gradient-to-r from-red-50 via-orange-50 to-blue-50 border border-red-200">
                  <td className="px-6 py-4 font-bold text-gray-900">@aifreedomduane</td>
                  <td className="px-6 py-4 text-gray-700 font-semibold">$297–$997 /mo</td>
                  <td className="px-6 py-4 text-gray-700">All-in-one AI Marketing + CTV</td>
                  <td className="px-6 py-4 text-gray-700 font-semibold">Nothing comparable – 14+ tools in one</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Synthesia</td>
                  <td className="px-6 py-4 text-gray-600">$89–$2000 /mo</td>
                  <td className="px-6 py-4 text-gray-600">Avatar videos only</td>
                  <td className="px-6 py-4 text-red-600">No funnels, no ads, no CRM</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-medium">ClickFunnels</td>
                  <td className="px-6 py-4 text-gray-600">$297–$497 /mo</td>
                  <td className="px-6 py-4 text-gray-600">Funnels</td>
                  <td className="px-6 py-4 text-red-600">No AI content or automation</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">HubSpot</td>
                  <td className="px-6 py-4 text-gray-600">$800+ /mo</td>
                  <td className="px-6 py-4 text-gray-600">CRM + Email</td>
                  <td className="px-6 py-4 text-red-600">No video or AI creation</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-medium">Descript</td>
                  <td className="px-6 py-4 text-gray-600">$24–$50 /mo</td>
                  <td className="px-6 py-4 text-gray-600">Editing</td>
                  <td className="px-6 py-4 text-red-600">No marketing automation</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Jasper</td>
                  <td className="px-6 py-4 text-gray-600">$49–$125 /mo</td>
                  <td className="px-6 py-4 text-gray-600">Copy AI</td>
                  <td className="px-6 py-4 text-red-600">No video or funnels</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
  );
}

function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex text-yellow-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-6">
                "We replaced 5 different subscriptions and cut costs by 70%. Our AI avatar sales videos get 3× more clicks now."
              </p>
              <div className="flex items-center">
                <div>
                  <div className="font-semibold text-gray-900">Sarah M.</div>
                  <div className="text-sm text-gray-600">Marketing Director, Growth Launch Co.</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex text-yellow-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-6">
                "As an agency owner, we use the white-label suite to offer content automation to clients under our brand. The profit margin is insane."
              </p>
              <div className="flex items-center">
                <div>
                  <div className="font-semibold text-gray-900">Anthony R.</div>
                  <div className="text-sm text-gray-600">Agency Partner, VisionFlow Media</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex text-yellow-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-6">
                "The AI voice receptionist booked 8 appointments for me in the first week without lifting a finger."
              </p>
              <div className="flex items-center">
                <div>
                  <div className="font-semibold text-gray-900">Laura K.</div>
                  <div className="text-sm text-gray-600">Coach & Consultant</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
  );
}


function CTASection() {
  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-blue-500/10"></div>
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Stop managing 10 apps. Start growing with{' '}
            <span className="bg-gradient-to-r from-red-500 via-orange-500 to-blue-500 bg-clip-text text-transparent">
              @aifreedomduane
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Everything you need to create, launch, and scale your marketing in one place.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link 
              href="/signup"
              className="bg-gradient-to-r from-red-500 via-orange-500 to-blue-500 hover:opacity-90 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              Get Started Today
            </Link>
            <Link 
              href="#contact"
              className="border-2 border-white/30 hover:bg-white/10 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all backdrop-blur-sm"
            >
              Book a Strategy Call
            </Link>
            <Link 
              href="#partner"
              className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all backdrop-blur-sm"
            >
              Become a Partner
            </Link>
          </div>
        </div>
      </section>
  );
}
