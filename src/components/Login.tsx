import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Target, Mail, Lock, AlertCircle } from 'lucide-react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        onLogin(data);
      } else {
        setError(data.error || 'Falha ao entrar');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0f14] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4">
            <Target size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white">XP Manager</h1>
          <p className="text-slate-500 mt-2">Entre na sua conta para gerenciar seus projetos</p>
        </div>

        <div className="bg-[#13161e] border border-[#252a38] p-8 rounded-2xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail size={18} />
                </div>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0d0f14] border border-[#252a38] rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors text-white"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock size={18} />
                </div>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0d0f14] border border-[#252a38] rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              disabled={isLoading}
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-[#252a38] text-center">
            <p className="text-slate-500 text-sm">
              Admin padrão: <code className="text-indigo-400">admin@example.com</code> / <code className="text-indigo-400">admin123</code>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
