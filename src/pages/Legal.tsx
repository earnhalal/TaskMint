import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, ArrowLeft, Mail, MapPin, Phone } from 'lucide-react';

export default function Legal() {
  const location = useLocation();
  const path = location.pathname;

  const renderContent = () => {
    if (path === '/privacy') {
      return (
        <div className="prose prose-slate max-w-none">
          <h1 className="text-4xl font-display font-bold mb-8">Privacy Policy</h1>
          <p className="text-lg text-slate-600 mb-6">Last updated: April 8, 2026</p>
          
          <p className="text-slate-600 mb-4">At TaskMint, accessible from our website and mobile application, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by TaskMint and how we use it.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">1. Information We Collect</h2>
          <p className="text-slate-600 mb-4">We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include:</p>
          <ul className="list-disc pl-6 text-slate-600 mb-4 space-y-2">
            <li><strong>Personal Identification Information:</strong> Name, email address, phone number, and postal address.</li>
            <li><strong>Financial Information:</strong> Payment method details, withdrawal account numbers (e.g., JazzCash, EasyPaisa, Bank Account) for processing payouts.</li>
            <li><strong>Usage Data:</strong> Information on how you interact with our platform, including tasks completed, time spent, and referral activities.</li>
          </ul>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">2. How We Use Your Information</h2>
          <p className="text-slate-600 mb-4">We use the information we collect in various ways, including to:</p>
          <ul className="list-disc pl-6 text-slate-600 mb-4 space-y-2">
            <li>Provide, operate, and maintain our website and services.</li>
            <li>Improve, personalize, and expand our website.</li>
            <li>Understand and analyze how you use our website.</li>
            <li>Develop new products, services, features, and functionality.</li>
            <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website, and for marketing and promotional purposes.</li>
            <li>Process your transactions and manage your earnings and withdrawals.</li>
            <li>Find and prevent fraud.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">3. Log Files and Cookies</h2>
          <p className="text-slate-600 mb-4">TaskMint follows a standard procedure of using log files. These files log visitors when they visit websites. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, tracking users' movement on the website, and gathering demographic information.</p>
          <p className="text-slate-600 mb-4">Like any other website, TaskMint uses 'cookies'. These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">4. Google DoubleClick DART Cookie</h2>
          <p className="text-slate-600 mb-4">Google is one of a third-party vendor on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to our site and other sites on the internet. However, visitors may choose to decline the use of DART cookies by visiting the Google ad and content network Privacy Policy at the following URL – <a href="https://policies.google.com/technologies/ads" className="text-emerald-600 hover:underline">https://policies.google.com/technologies/ads</a></p>

          <h2 className="text-2xl font-bold mt-8 mb-4">5. Third Party Privacy Policies</h2>
          <p className="text-slate-600 mb-4">TaskMint's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information. It may include their practices and instructions about how to opt-out of certain options.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">6. Data Security and Deletion</h2>
          <p className="text-slate-600 mb-4">We implement a variety of security measures to maintain the safety of your personal information. You have the right to request the deletion of your personal data. You can permanently delete your account and associated data directly from the "Profile" section of your dashboard.</p>
        </div>
      );
    }

    if (path === '/terms') {
      return (
        <div className="prose prose-slate max-w-none">
          <h1 className="text-4xl font-display font-bold mb-8">Terms of Service</h1>
          <p className="text-lg text-slate-600 mb-6">Last updated: April 8, 2026</p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="text-slate-600 mb-4">By accessing and using TaskMint (the "Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">2. Description of Service</h2>
          <p className="text-slate-600 mb-4">TaskMint provides users with a platform to earn rewards by completing digital tasks, participating in referral programs, and engaging with promotional content. You understand and agree that the Service may include advertisements, which are necessary for TaskMint to provide the Service.</p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">3. User Accounts and Security</h2>
          <p className="text-slate-600 mb-4">To use certain features of the Service, you must register for an account. You are responsible for maintaining the confidentiality of your account information, including your password, and for all activity that occurs under your account. You agree to notify TaskMint immediately of any unauthorized use of your account or password.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">4. Earning and Withdrawals</h2>
          <p className="text-slate-600 mb-4">Users can earn virtual currency or cash rewards ("Earnings") by completing specified tasks. Earnings are subject to verification by TaskMint. We reserve the right to withhold or cancel Earnings if we suspect fraudulent activity, violation of these Terms, or use of automated bots/scripts. Withdrawals are processed to the user's provided local payment methods (e.g., JazzCash, EasyPaisa, Bank Transfer) subject to minimum withdrawal thresholds and processing times.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">5. User Conduct and Anti-Fraud Policy</h2>
          <p className="text-slate-600 mb-4">You agree not to use the Service to:</p>
          <ul className="list-disc pl-6 text-slate-600 mb-4 space-y-2">
            <li>Engage in any fraudulent activity, including creating multiple fake accounts or using VPNs/Proxies to bypass regional restrictions.</li>
            <li>Interfere with or disrupt the Service or servers or networks connected to the Service.</li>
            <li>Attempt to exploit any bugs or vulnerabilities in the platform to artificially inflate Earnings.</li>
          </ul>
          <p className="text-slate-600 mb-4">Violation of these rules will result in immediate account termination and forfeiture of all pending Earnings.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">6. Modifications to Service</h2>
          <p className="text-slate-600 mb-4">TaskMint reserves the right at any time and from time to time to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice. You agree that TaskMint shall not be liable to you or to any third party for any modification, suspension or discontinuance of the Service.</p>
        </div>
      );
    }

    if (path === '/contact') {
      return (
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-display font-bold mb-8 text-center">Get in Touch</h1>
          <p className="text-lg text-slate-600 mb-12 text-center max-w-2xl mx-auto">Have questions about earning with TaskMint? Our support team is here to help you 24/7.</p>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-1">Email Us</h3>
                  <p className="text-slate-600 mb-2">For general inquiries and support.</p>
                  <a href="mailto:taskmintpro@gmail.com" className="text-emerald-600 font-semibold hover:underline">taskmintpro@gmail.com</a>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-1">Call Us</h3>
                  <p className="text-slate-600 mb-2">Mon-Fri from 9am to 6pm.</p>
                  <a href="tel:+923001234567" className="text-emerald-600 font-semibold hover:underline">+92 300 1234567</a>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-1">Office</h3>
                  <p className="text-slate-600">123 Tech Avenue, Software Technology Park<br />Islamabad, Pakistan</p>
                </div>
              </div>
            </div>
            
            <form className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Your Name</label>
                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="Ali Khan" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <input type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="ali@example.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
                <textarea rows={4} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none" placeholder="How can we help you?"></textarea>
              </div>
              <button className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5">
                Send Message
              </button>
            </form>
          </div>
        </div>
      );
    }

    return <div>Page not found</div>;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Simple Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-slate-900">TaskMint</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        {renderContent()}
      </main>

      {/* Simple Footer */}
      <footer className="py-12 px-6 border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm font-medium text-slate-400">© 2026 TaskMint. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
