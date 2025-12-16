
import React, { useState } from 'react';
import { Lock, User, Droplets, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Simulate network delay for better UX feel
    setTimeout(() => {
        if (username === 'admin' && password === '1234') {
            onLogin();
        } else {
            setError('Invalid username or password');
            setLoading(false);
        }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* 1. Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-blue-100 z-0"></div>
      
      {/* 2. Grid Pattern Overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.4]" 
           style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      {/* 3. Animated Blobs (Background) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-200/30 rounded-full blur-3xl animate-pulse mix-blend-multiply"></div>
         <div className="absolute bottom-[-10%] right-[-20%] w-[500px] h-[500px] bg-cyan-200/30 rounded-full blur-3xl animate-pulse delay-1000 mix-blend-multiply"></div>
         <div className="absolute top-[30%] right-[10%] w-72 h-72 bg-purple-200/30 rounded-full blur-3xl animate-bounce delay-700 duration-[4000ms] mix-blend-multiply"></div>
      </div>

      {/* 4. Bottom Wave SVG */}
      <div className="absolute bottom-0 left-0 right-0 z-0 text-brand-500/10 pointer-events-none">
         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto fill-current">
            <path fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,213.3C672,192,768,128,864,128C960,128,1056,192,1152,208C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
         </svg>
      </div>

      {/* 5. Floating Particles */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-20 left-[20%] w-4 h-4 bg-blue-400/20 rounded-full animate-bounce duration-[3000ms]"></div>
        <div className="absolute bottom-40 left-[10%] w-8 h-8 bg-cyan-400/20 rounded-full animate-bounce delay-700 duration-[5000ms]"></div>
        <div className="absolute top-40 right-[15%] w-6 h-6 bg-purple-400/20 rounded-full animate-bounce delay-300 duration-[4000ms]"></div>
      </div>

      {/* Login Card */}
      <div className="bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)] w-full max-w-md border border-white relative z-10 animate-in fade-in zoom-in duration-500 slide-in-from-bottom-4">
        
        {/* Card Header with Icon */}
        <div className="text-center mb-8">
           <div className="relative w-24 h-24 bg-gradient-to-tr from-brand-600 to-brand-400 rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl shadow-brand-200 mb-6 transform -rotate-3 hover:rotate-0 transition-transform duration-500 group border-4 border-white ring-4 ring-brand-50">
              <Droplets size={42} className="text-white drop-shadow-md group-hover:scale-110 transition-transform duration-500"/>
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-yellow-400 rounded-full border-4 border-white flex items-center justify-center shadow-sm">
                <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
              </div>
           </div>
           <h1 className="text-3xl font-black text-slate-800 tracking-tight">AquaFlow</h1>
           <p className="text-slate-500 font-medium text-sm mt-2">Professional Water Management</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="space-y-5">
             <div className="group">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1 group-focus-within:text-brand-600 transition-colors">Username</label>
                <div className="relative transition-all duration-300 group-focus-within:transform group-focus-within:-translate-y-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-500 transition-colors">
                    <User size={20} />
                  </div>
                  <input 
                    type="text" 
                    required
                    className="pl-11 w-full rounded-2xl border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white shadow-sm hover:shadow border p-4 focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all text-slate-700 font-bold placeholder-slate-400"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
             </div>

             <div className="group">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1 group-focus-within:text-brand-600 transition-colors">Password</label>
                <div className="relative transition-all duration-300 group-focus-within:transform group-focus-within:-translate-y-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-500 transition-colors">
                    <Lock size={20} />
                  </div>
                  <input 
                    type="password" 
                    required
                    className="pl-11 w-full rounded-2xl border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white shadow-sm hover:shadow border p-4 focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all text-slate-700 font-bold placeholder-slate-400"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
             </div>
           </div>

           {error && (
             <div className="text-red-500 text-sm font-semibold text-center bg-red-50 p-4 rounded-xl border border-red-100 flex items-center justify-center gap-2 animate-shake">
               <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
               {error}
             </div>
           )}

           <button 
             type="submit" 
             disabled={loading}
             className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-bold py-4 px-4 rounded-2xl transition-all transform active:scale-[0.98] shadow-xl shadow-brand-200 hover:shadow-2xl hover:shadow-brand-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
           >
             {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Logging in...</span>
                </>
             ) : (
                <>Sign In <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/></>
             )}
           </button>
        </form>
        
        <div className="mt-8 text-center">
            <div className="text-xs text-slate-400 mb-2 font-medium">Demo Access</div>
            <div className="inline-flex items-center gap-3 bg-slate-50 px-5 py-2.5 rounded-xl border border-slate-100 text-xs text-slate-500 font-mono shadow-inner">
                <span>user: <strong className="text-slate-700">admin</strong></span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                <span>pass: <strong className="text-slate-700">1234</strong></span>
            </div>
        </div>
      </div>

      <div className="absolute bottom-6 text-brand-900/20 text-xs font-semibold tracking-widest uppercase z-10">
        Secure System v1.0
      </div>
    </div>
  );
};

export default Login;
