import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, User, Sparkles, Tag } from 'lucide-react';
import { blogPosts } from '../data/blogPosts';

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const post = blogPosts.find(p => p.slug === slug);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (post) {
      document.title = `${post.title} | TaskMint Blog`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', post.excerpt);
    }
  }, [post]);

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Post Not Found</h1>
        <button onClick={() => navigate('/blog')} className="text-emerald-700 font-bold">Back to Blog</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate('/blog')}
            className="flex items-center gap-2 text-slate-600 hover:text-emerald-700 font-bold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back to Blog</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">Task<span className="text-emerald-600">Mint</span></span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 text-slate-400 text-xs font-extrabold mb-6 uppercase tracking-widest">
            <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">{post.category}</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {post.date}
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-8 leading-tight tracking-tighter">
            {post.title}
          </h1>

          <div className="flex items-center gap-4 mb-10 pb-10 border-b border-slate-100">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">{post.author}</p>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Editorial Team</p>
            </div>
          </div>

          {post.image && (
            <div className="rounded-[2.5rem] overflow-hidden mb-12 shadow-2xl">
              <img 
                src={post.image} 
                alt={post.title} 
                className="w-full h-auto"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          <article className="prose prose-slate prose-lg max-w-none 
            prose-headings:font-extrabold prose-headings:text-slate-900 prose-headings:tracking-tight
            prose-p:text-slate-600 prose-p:font-medium prose-p:leading-relaxed
            prose-strong:text-slate-900 prose-strong:font-extrabold
            prose-li:text-slate-600 prose-li:font-medium
            prose-img:rounded-[2rem] prose-img:shadow-xl
          ">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </article>

          <div className="mt-16 pt-10 border-t border-slate-100">
            <div className="flex flex-wrap gap-2">
              {post.keywords.map(keyword => (
                <span key={keyword} className="flex items-center gap-1.5 bg-slate-50 text-slate-500 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest">
                  <Tag className="w-3 h-3" />
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-20 bg-gradient-to-br from-emerald-700 to-teal-700 rounded-[2.5rem] p-10 text-white text-center shadow-2xl">
            <h3 className="text-3xl font-extrabold mb-4">Start Your Earning Journey</h3>
            <p className="text-emerald-50/85 mb-8 font-medium">Join 50,000+ users earning on TaskMint. Create your account and activate it with the one-time Rs. 150 joining fee.</p>
            <button 
              onClick={() => navigate('/signup')}
              className="bg-white text-emerald-700 px-10 py-4 rounded-full font-extrabold text-lg hover:scale-105 transition-transform shadow-xl"
            >
              Create Your Account
            </button>
          </div>
        </motion.div>
      </main>

      <footer className="bg-slate-50 py-12 px-6 mt-12">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-slate-400 text-sm font-medium">© 2026 TaskMint. The #1 Online Earning Platform in Pakistan.</p>
        </div>
      </footer>
    </div>
  );
}
