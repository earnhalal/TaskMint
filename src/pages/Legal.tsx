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
          <p className="text-lg text-slate-600 mb-6">Last updated: April 5, 2026</p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">1. Information We Collect</h2>
          <p className="text-slate-600 mb-4">We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, and other information you choose to provide.</p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">2. How We Use Your Information</h2>
          <p className="text-slate-600 mb-4">We may use the information we collect about you to:</p>
          <ul className="list-disc pl-6 text-slate-600 mb-4 space-y-2">
            <li>Provide, maintain, and improve our Services.</li>
            <li>Process transactions and send you related information, including confirmations and receipts.</li>
            <li>Send you technical notices, updates, security alerts, and support and administrative messages.</li>
            <li>Respond to your comments, questions, and requests, and provide customer service.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">3. Sharing of Information</h2>
          <p className="text-slate-600 mb-4">We may share the information we collect about you as described in this Statement or as described at the time of collection or sharing, including as follows:</p>
          <ul className="list-disc pl-6 text-slate-600 mb-4 space-y-2">
            <li>With third party service providers to enable them to provide the Services you request.</li>
            <li>With the general public if you submit content in a public forum, such as blog comments, social media posts, or other features of our Services that are viewable by the general public.</li>
            <li>With third parties with whom you choose to let us share information.</li>
          </ul>
        </div>
      );
    }

    if (path === '/terms') {
      return (
        <div className="prose prose-slate max-w-none">
          <h1 className="text-4xl font-display font-bold mb-8">Terms of Service</h1>
          <p className="text-lg text-slate-600 mb-6">Last updated: April 5, 2026</p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="text-slate-600 mb-4">By accessing and using TaskMint, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.</p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">2. Description of Service</h2>
          <p className="text-slate-600 mb-4">TaskMint provides users with access to a rich collection of resources, including various communications tools, forums, shopping services, and personalized content through its network of properties. You also understand and agree that the Service may include advertisements and that these advertisements are necessary for TaskMint to provide the Service.</p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">3. User Conduct</h2>
          <p className="text-slate-600 mb-4">You understand that all information, data, text, software, music, sound, photographs, graphics, video, messages or other materials, whether publicly posted or privately transmitted, are the sole responsibility of the person from which such content originated. This means that you, and not TaskMint, are entirely responsible for all content that you upload, post, email, transmit or otherwise make available via the Service.</p>
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
                  <a href="mailto:support@taskmint.pk" className="text-emerald-600 font-semibold hover:underline">support@taskmint.pk</a>
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
