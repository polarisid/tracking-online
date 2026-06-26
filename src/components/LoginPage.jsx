import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, Eye, EyeOff, Loader2, Cloud, FileSpreadsheet } from 'lucide-react';
import useHomeContext from '../hooks/UseHomeContext';

export default function LoginPage() {
  const { signIn, setIsLocalMode } = useHomeContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
    } catch (err) {
      console.error(err);
      if (err.message === 'Invalid login credentials') {
        setError('E-mail ou senha incorretos.');
      } else {
        setError(err.message || 'Erro ao realizar login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md mx-4 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-300">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3">
            <span className="text-white font-black text-lg">TO</span>
          </div>
          <h1 className="text-white font-extrabold text-2xl tracking-tight leading-none">
            Tracking <span className="text-blue-400">Online</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 font-medium tracking-wide uppercase">
            Autenticação do Sistema
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-lg text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
              E-mail corporativo
            </label>
            <div className="relative flex items-center">
              <Mail size={16} className="text-slate-500 absolute left-3 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@empresa.com"
                disabled={loading}
                className="w-full bg-slate-950/50 text-slate-100 placeholder-slate-600 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
                Senha
              </label>
            </div>
            <div className="relative flex items-center">
              <Lock size={16} className="text-slate-500 absolute left-3 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full bg-slate-950/50 text-slate-100 placeholder-slate-600 border border-slate-800 rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                className="text-slate-500 hover:text-slate-300 absolute right-3 p-1 rounded transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-blue-600/10"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <Cloud size={16} />
                <span>Acessar Nuvem</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-slate-800/80"></div>
          <span className="flex-shrink mx-4 text-slate-500 text-[10px] font-bold uppercase tracking-wider">ou</span>
          <div className="flex-grow border-t border-slate-800/80"></div>
        </div>

        {/* Local Offline Mode Button */}
        <button
          type="button"
          onClick={() => setIsLocalMode(true)}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold py-2.5 px-4 rounded-lg text-sm border border-slate-800 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
        >
          <FileSpreadsheet size={16} className="text-slate-400" />
          <span>Acessar Modo Local (Offline)</span>
        </button>

      </div>
    </div>
  );
}
