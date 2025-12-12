import React from "react";

type FooterProps = {
  darkMode?: boolean;
};

export default function Footer({ darkMode = true }: FooterProps) {
  const base = darkMode
    ? "bg-[#0f172a] text-gray-300"
    : "bg-gray-100 text-gray-700";

  return (
    <footer className={`${base} w-full border-t border-gray-800`}>
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        
        {/* BRAND + TAGLINE */}
        <div>
          <h2 className="text-xl font-semibold">AI Freedom Studios</h2>
          <p className="mt-4 text-sm leading-relaxed max-w-xs">
            From Idea to Revenue — All Powered by AI.  
            The complete platform for creators, coaches, and agencies to 
            create, automate, and scale without limits.
          </p>
        </div>

        {/* PRODUCT LINKS */}
        <div>
          <h3 className="font-semibold text-lg mb-4">Product</h3>
          <ul className="space-y-2 text-sm">
            <li>Features</li>
            <li>Pricing</li>
            <li>How It Works</li>
            <li>Integrations</li>
            <li>Roadmap</li>
          </ul>
        </div>

        {/* RESOURCES */}
        <div>
          <h3 className="font-semibold text-lg mb-4">Resources</h3>
          <ul className="space-y-2 text-sm">
            <li>Blog</li>
            <li>Help Center</li>
            <li>Tutorials</li>
            <li>API Docs</li>
            <li>Community</li>
          </ul>
        </div>

        {/* COMPANY */}
        <div>
          <h3 className="font-semibold text-lg mb-4">Company</h3>
          <ul className="space-y-2 text-sm">
            <li>About Us</li>
            <li>Careers</li>
            <li>Partners</li>
            <li>Affiliates</li>
            <li>Contact</li>
          </ul>

          {/* CONTACT INFO */}
          <div className="mt-6 text-sm space-y-1">
            <p>support@aifreedomstudios.com</p>
            <p>+1 (234) 567-890</p>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div
        className={`border-t ${
          darkMode ? "border-gray-700" : "border-gray-300"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between text-xs gap-3 opacity-80">
          <p>
            © {new Date().getFullYear()} AI Freedom Studios. All rights reserved.
          </p>

          <div className="flex gap-4">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Cookie Policy</span>
            <span>GDPR</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
