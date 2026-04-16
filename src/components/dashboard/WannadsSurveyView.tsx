import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'motion/react';

interface WannadsSurveyViewProps {
  userId: string;
  onBack: () => void;
}

export default function WannadsSurveyView({ userId, onBack }: WannadsSurveyViewProps) {
  const wannadsUrl = `https://earn.wannads.com/surveywall?apiKey=69d9648474a17761405810&userId=${userId}`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-24 px-0 pt-0 h-full w-full"
    >
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-100">
        <h2 className="font-black text-slate-900 text-lg">Easy Tasks</h2>
        <button onClick={onBack} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
          <X className="w-5 h-5" />
        </button>
      </div>
      <iframe 
        style={{ width: '100%', height: 'calc(100vh - 60px)', border: 0, padding: 0, margin: 0 }} 
        src={wannadsUrl}
        title="Wannads Survey Wall"
      ></iframe>
    </motion.div>
  );
}
