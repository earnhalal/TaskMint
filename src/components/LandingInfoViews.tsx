import React from 'react';
import { Landmark, Smartphone, CreditCard, Wallet } from 'lucide-react';

// Reusable Modal Component
interface InfoModalProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}

export const InfoModal: React.FC<InfoModalProps> = ({ title, onClose, children }) => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 animate-fade-in backdrop-blur-sm">
        <div className="relative w-full max-w-3xl h-[85vh] bg-white rounded-3xl shadow-2xl flex flex-col text-gray-800 animate-scale-up overflow-hidden">
            <header className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
                <h3 className="text-2xl font-bold text-gray-900 font-heading">{title}</h3>
                <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors text-xl font-bold">&times;</button>
            </header>
            <div className="p-8 overflow-y-auto">
                 <div className="prose prose-lg max-w-none text-gray-600">
                    {children}
                </div>
            </div>
        </div>
        <style>{`
            @keyframes scale-up {
                from { transform: scale(0.95); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
            .animate-scale-up { animation: scale-up 0.3s ease-out forwards; }
        `}</style>
    </div>
);

// Specific Info Content Components
const InfoSection: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="mb-10">
        <h4 className="text-xl font-bold text-[#0F4C47] mb-4 pb-2 border-b border-gray-100">{title}</h4>
        <div className="space-y-4 leading-relaxed">{children}</div>
    </div>
);

const PaymentMethod: React.FC<{ name: string; icon: React.ReactNode; }> = ({ name, icon }) => (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-[#4EF2C3] transition-colors">
        <div className="w-10 h-10 text-[#0F4C47] flex-shrink-0">{icon}</div>
        <span className="font-semibold text-lg text-gray-800">{name}</span>
    </div>
);

export const WithdrawalInfo = () => (
    <>
        <InfoSection title="Withdrawal Policy">
            <p>At TaskMint, we pride ourselves on speed. You can withdraw your earnings immediately once you reach the minimum threshold. All withdrawals are processed by our finance team within <strong>24-48 business hours</strong>.</p>
        </InfoSection>
        <InfoSection title="Limits & Fees">
            <ul className="list-disc list-inside space-y-2 marker:text-[#4EF2C3]">
                <li><strong>Minimum Withdrawal:</strong> 100 Rs</li>
                <li><strong>Maximum Withdrawal:</strong> 25,000 Rs per day</li>
                <li><strong>Processing Fee:</strong> 0% (We cover the transaction costs)</li>
            </ul>
        </InfoSection>
        <InfoSection title="Supported Methods">
            <p className="mb-4">We support all major Pakistani payment gateways:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose">
                <PaymentMethod name="JazzCash" icon={<Smartphone />} />
                <PaymentMethod name="EasyPaisa" icon={<Smartphone />} />
                <PaymentMethod name="NayaPay" icon={<CreditCard />} />
                <PaymentMethod name="SadaPay" icon={<CreditCard />} />
                <PaymentMethod name="UPaisa" icon={<Smartphone />} />
                <PaymentMethod name="Bank Transfer" icon={<Landmark />} />
            </div>
        </InfoSection>
    </>
);

export const DepositInfo = () => (
    <>
        <InfoSection title="How to Deposit">
            <p>TaskMint allows you to become an advertiser. Use your earnings or deposit external funds to create task campaigns (e.g., get subscribers for your YouTube channel).</p>
            <p>Go to the <strong>Deposit</strong> section in your dashboard, select your method (EasyPaisa/JazzCash), send the amount to the displayed account, and upload the Transaction ID.</p>
        </InfoSection>
        <InfoSection title="Verification Time">
            <p>Security is our priority. All deposits are manually verified by our team. This usually takes <strong>1-2 hours</strong> during business hours (9 AM - 9 PM PKT).</p>
        </InfoSection>
    </>
);

export const RefundPolicyInfo = () => (
    <>
        <InfoSection title="Joining Fee">
            <p>The one-time joining fee is 100 Rs. This fee is non-refundable and covers administrative costs of account setup.</p>
        </InfoSection>
        <InfoSection title="Campaign Funds">
            <p>Funds deposited for task campaigns are non-refundable once the campaign is live and tasks have been completed by other users. If you wish to cancel a pending campaign, please contact support immediately for a wallet credit.</p>
        </InfoSection>
    </>
);

export const DisclaimerInfo = () => (
    <>
        <InfoSection title="Earnings Disclaimer">
            <p>TaskMint provides a platform for supplementary income. We do not guarantee any specific daily or monthly income. Earnings depend entirely on user activity, task availability, and market demand.</p>
            <p>This is not a "get rich quick" scheme. We strictly prohibit the use of bots, VPNs, or multiple accounts to manipulate earnings.</p>
        </InfoSection>
        <InfoSection title="Third-Party Responsibility">
            <p>Tasks often involve visiting third-party websites. TaskMint is not responsible for the content, privacy policies, or practices of any third-party sites linked to from our platform.</p>
        </InfoSection>
    </>
);

export const BlogView = () => (
    <>
        <div className="text-center mb-10">
            <p className="text-sm font-bold text-[#4EF2C3] uppercase tracking-wider mb-2">Latest Articles</p>
            <h2 className="text-3xl font-bold text-gray-900">TaskMint Insights</h2>
        </div>

        <article className="mb-12 border-b border-gray-100 pb-12">
            <span className="text-xs font-bold text-gray-400">Oct 24, 2024 • Guides</span>
            <h3 className="text-2xl font-bold text-gray-900 mt-2 mb-3 hover:text-[#0F4C47] cursor-pointer">How to Maximize Your Earnings on TaskMint</h3>
            <p className="text-gray-600 mb-4">Discover the top strategies used by our "Pro Level" users to earn over 1000 Rs daily. From timing your tasks to mastering the referral system...</p>
            <button className="text-[#0F4C47] font-bold hover:underline">Read More &rarr;</button>
        </article>

        <article className="mb-12 border-b border-gray-100 pb-12">
             <span className="text-xs font-bold text-gray-400">Oct 20, 2024 • Updates</span>
            <h3 className="text-2xl font-bold text-gray-900 mt-2 mb-3 hover:text-[#0F4C47] cursor-pointer">Introducing Ludo & Mines: Play to Earn</h3>
            <p className="text-gray-600 mb-4">We've just launched our new gaming section. Learn how to play responsibly and turn your gaming skills into wallet balance.</p>
            <button className="text-[#0F4C47] font-bold hover:underline">Read More &rarr;</button>
        </article>

        <article>
             <span className="text-xs font-bold text-gray-400">Oct 15, 2024 • Security</span>
            <h3 className="text-2xl font-bold text-gray-900 mt-2 mb-3 hover:text-[#0F4C47] cursor-pointer">Why We Introduced the Joining Fee</h3>
            <p className="text-gray-600 mb-4">Transparency is key. Here is why we added a nominal verification fee and how it helps keep the platform spam-free and profitable for everyone.</p>
            <button className="text-[#0F4C47] font-bold hover:underline">Read More &rarr;</button>
        </article>
    </>
);

export const HowItWorksView = () => (
    <InfoSection title="How It Works">
        <p>1. <strong>Sign Up:</strong> Create your free account in seconds.</p>
        <p>2. <strong>Complete Tasks:</strong> Browse our list of premium tasks, watch videos, or participate in surveys.</p>
        <p>3. <strong>Earn & Withdraw:</strong> Accumulate earnings and withdraw them instantly to your preferred local wallet.</p>
    </InfoSection>
);

export const AboutUsView = () => (
    <InfoSection title="About TaskMint">
        <p>TaskMint is Pakistan's leading premium earning platform. Our mission is to provide a secure, transparent, and rewarding environment for users to monetize their free time.</p>
    </InfoSection>
);

export const ContactUsView = () => (
    <InfoSection title="Contact Support">
        <p>Need help? Our support team is available 24/7.</p>
        <p>Email us at: <strong>support@taskmint.com</strong></p>
    </InfoSection>
);

export const PrivacyPolicyView = () => (
    <InfoSection title="Privacy Policy">
        <p>Your privacy is our top priority. We use industry-standard encryption to protect your personal and financial data. We never sell your information to third parties.</p>
    </InfoSection>
);

export const TermsAndConditionsView = () => (
    <InfoSection title="Terms of Service">
        <p>By using TaskMint, you agree to our terms of service. This includes maintaining only one account, providing accurate information, and not using automated bots to complete tasks.</p>
    </InfoSection>
);

// A helper function to render the correct modal content
export const renderModalContent = (modalKey: string) => {
    switch (modalKey) {
        case 'how-it-works': return <HowItWorksView />;
        case 'about': return <AboutUsView />;
        case 'support': return <ContactUsView />;
        case 'privacy': return <PrivacyPolicyView />;
        case 'terms': return <TermsAndConditionsView />;
        case 'withdrawal': return <WithdrawalInfo />;
        case 'deposit': return <DepositInfo />;
        case 'refund': return <RefundPolicyInfo />;
        case 'disclaimer': return <DisclaimerInfo />;
        case 'blog': return <BlogView />;
        default: return null;
    }
};
