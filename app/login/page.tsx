'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const supabase = createClient();

      if (mode === 'signup') {
        if (!fullName.trim()) {
          setErrorMsg('ദയവായി നിങ്ങളുടെ പേര് നൽകുക (Please enter your full name).');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              phone: phone.trim(),
            },
          },
        });

        if (error) {
          setErrorMsg(error.message);
          setLoading(false);
          return;
        }

        // Save user profile locally as well so Welcome [Name] is always available immediately
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'dg_csc_user_profile',
            JSON.stringify({
              id: data.user?.id || `usr_${Date.now()}`,
              full_name: fullName.trim(),
              phone: phone.trim(),
              email: email.trim(),
            })
          );
        }

        if (data.session) {
          router.push('/');
          router.refresh();
        } else {
          // Even if email confirmation is enabled on Supabase, allow immediate access with saved profile
          setSuccessMsg('അക്കൗണ്ട് വിജയകരമായി നിർമ്മിച്ചു! ഹോം പേജിലേക്ക് പ്രവേശിക്കുന്നു...');
          setTimeout(() => {
            router.push('/');
          }, 900);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setErrorMsg(error.message);
          setLoading(false);
          return;
        }

        if (data.user && typeof window !== 'undefined') {
          const metaName =
            data.user.user_metadata?.full_name ||
            data.user.email?.split('@')[0] ||
            'ഉപഭോക്താവ്';
          const metaPhone = data.user.user_metadata?.phone || '';
          localStorage.setItem(
            'dg_csc_user_profile',
            JSON.stringify({
              id: data.user.id,
              full_name: metaName,
              phone: metaPhone,
              email: data.user.email,
            })
          );
        }

        router.push('/');
        router.refresh();
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-sky-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100">
        {/* Top Banner with Logo */}
        <div className="bg-gradient-to-r from-sky-900 via-teal-800 to-emerald-700 p-6 text-center text-white relative">
          <div className="w-28 h-28 mx-auto bg-white rounded-2xl p-2 shadow-lg flex items-center justify-center mb-3">
            <img
              src="/logo-digital-gramam.jpg"
              alt="Digital Gramam Logo"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <h1 className="text-2xl font-extrabold tracking-wide">DIGITAL GRAMAM</h1>
          <p className="text-emerald-200 text-xs font-medium mt-0.5">
            ഡിജിറ്റൽ ഗ്രാമം സി.എസ്.സി & ഓൺലൈൻ സേവന കേന്ദ്രം
          </p>
        </div>

        {/* Toggle Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-3.5 text-sm font-bold transition-colors ${
              mode === 'login'
                ? 'bg-white text-emerald-700 border-b-2 border-emerald-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ലോഗിൻ (Login)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-3.5 text-sm font-bold transition-colors ${
              mode === 'signup'
                ? 'bg-white text-emerald-700 border-b-2 border-emerald-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            പുതിയ അക്കൗണ്ട് (Sign Up)
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              {successMsg}
            </div>
          )}

          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  നിങ്ങളുടെ പേര് (Full Name) *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="ഉദാ: രാഹുൽ കൃഷ്ണൻ"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ഫോൺ നമ്പർ (Phone Number) *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10 അക്ക മൊബൈൽ നമ്പർ"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ഇമെയിൽ വിലാസം (Email Address) *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              പാസ്‌വേഡ് (Password - കുറഞ്ഞത് 6 അക്ഷരങ്ങൾ) *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-60 cursor-pointer"
          >
            {loading
              ? 'ദയവായി കാത്തിരിക്കുക...'
              : mode === 'login'
              ? 'ലോഗിൻ ചെയ്യുക (Sign In)'
              : 'രജിസ്റ്റർ ചെയ്യുക (Create Account)'}
          </button>

          <div className="pt-2 text-center">
            <Link
              href="/"
              className="text-xs font-semibold text-slate-500 hover:text-emerald-700 underline"
            >
              ← ഹോം പേജിലേക്ക് മടങ്ങുക (Back to Home)
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
