import React, { useState } from 'react';
import { Lock, User } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple hardcoded credentials for the demo/local app
    if (username === 'admin' && password === '1234') {
      onLogin();
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen bg-brand-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-brand-100 animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
           <div className="w-16 h-16 bg-brand-600 rounded-2xl mx-auto flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg shadow-brand-200">A</div>
           <h1 className="text-2xl font-bold text-gray-800">AquaFlow Manager</h1>
           <p className="text-gray-500 mt-2">Secure Access Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="space-y-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <User size={18} />
                  </div>
                  <input 
                    type="text" 
                    required
                    className="pl-10 w-full rounded-lg border-gray-300 bg-white shadow-sm border p-2.5 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </div>
                  <input 
                    type="password" 
                    required
                    className="pl-10 w-full rounded-lg border-gray-300 bg-white shadow-sm border p-2.5 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
             </div>
           </div>

           {error && (
             <div className="text-red-500 text-sm font-medium text-center bg-red-50 p-2 rounded-lg border border-red-100">
               {error}
             </div>
           )}

           <button 
             type="submit" 
             className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-4 rounded-xl transition-all transform active:scale-95 shadow-lg shadow-brand-200"
           >
             Sign In
           </button>
        </form>
        
        <div className="mt-8 text-center text-xs text-gray-400">
          <p>Default: admin / 1234</p>
          <p className="mt-1">© {new Date().getFullYear()} AquaFlow Systems</p>
        </div>
      </div>
    </div>
  );
};

export default Login;