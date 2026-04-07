import React from 'react';
import { ArrowLeft, Copy, CheckCircle2 } from 'lucide-react';

interface AdPixelViewProps {
  onBack: () => void;
}

export default function AdPixelView({ onBack }: AdPixelViewProps) {
  const [copied, setCopied] = React.useState(false);
  const pixelCode = `<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.taskmint.net/en_US/fbevents.js');
  fbq('init', 'TM-${Math.floor(Math.random()*100000000)}');
  fbq('track', 'PageView');
</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(pixelCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade-in pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm border border-slate-100 hover:bg-slate-50">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Tracking Pixel Setup</h2>
          <p className="text-xs text-slate-500">Track conversions on your website.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <p className="text-sm text-slate-600 mb-6">
          Install this code snippet in the <code>&lt;head&gt;</code> of your website to track conversions and optimize your ad campaigns.
        </p>
        
        <div className="relative group">
          <div className="bg-slate-900 p-4 rounded-xl overflow-x-auto mb-6">
            <pre className="text-green-400 text-xs sm:text-sm font-mono whitespace-pre-wrap break-all">
              {pixelCode}
            </pre>
          </div>
          <button 
            onClick={handleCopy}
            className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors flex items-center gap-2 text-white text-xs font-bold"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>

        <button 
          onClick={onBack}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-blue-600/20"
        >
          Done
        </button>
      </div>
    </div>
  );
}
