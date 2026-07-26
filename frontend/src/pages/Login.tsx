import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { Leaf, Lock, Mail, CircleAlert, ChevronRight, User } from "lucide-react";
import { signInWithGoogle } from "../lib/firebase";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function Login() {
  const { t } = useTranslation();
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError(t("auth.fillAllFields", "Please fill in all credential fields."));
      setLoading(false);
      return;
    }

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || t("auth.invalidCredentials", "Invalid credentials. Please verify your password."));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await signInWithGoogle();
      if (res && res.user) {
        await loginWithGoogle({
          email: res.user.email || "",
          name: res.user.displayName || "Google Farmer",
          id: res.user.uid,
          photoURL: res.user.photoURL || undefined
        });
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || t("auth.googleFailed", "Google Authentication failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-y-auto py-8 sm:py-12 font-sans text-slate-100">
      {/* Background radial overlays */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[80px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-[80px]" />

      <div className="w-full max-w-md relative z-10">
        
        {/* LOGO */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-500/20 mb-3">
            <Leaf className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">{t("auth.loginTitle", "Access AgroIntelX")}</h2>
          <p className="text-xs text-slate-400 mt-1">{t("auth.loginSubtitle", "AI-Powered Intelligent Farmer Decision Support Suite")}</p>
        </div>

        <div className="flex justify-center mb-4">
          <LanguageSwitcher variant="dark" />
        </div>

        {/* GLASSCARD FORM */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl"
        >
          {error && (
            <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center gap-2 text-xs">
              <CircleAlert className="h-4.5 w-4.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{t("auth.email", "Email Address")}</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="farmer@agrointelx.com"
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{t("auth.password", "Secure Password")}</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-medium rounded-xl py-3 text-xs flex items-center justify-center gap-1 shadow-lg shadow-emerald-600/10 transition-colors mt-6"
            >
              {loading ? t("auth.authenticating", "Authenticating session...") : t("auth.signInCta", "Sign In to AgroIntelX")}
              <ChevronRight className="h-4 w-4" />
            </button>
          </form>

          {/* GOOGLE SIGN IN */}
          <div className="relative my-5 flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider">{t("auth.orContinueWith", "Or continue with")}</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950 disabled:opacity-50 text-slate-200 text-xs rounded-xl font-medium transition-colors cursor-pointer"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.102 1.025 5.047 1.926l3.258-3.133C18.336 1.251 15.54.5 12.24.5 5.866.5.6 5.65.6 12s5.266 11.5 11.64 11.5c6.653 0 11.077-4.604 11.077-11.134 0-.748-.078-1.32-.176-1.881H12.24z"
              />
            </svg>
            {t("auth.signInWithGoogle", "Sign In with Google")}
          </button>

          {/* REGISTER LINK */}
          <div className="text-center mt-6">
            <p className="text-xs text-slate-400">
              {t("auth.newToApp", "New to AgroIntelX?")}{" "}
              <Link to="/register" className="text-emerald-400 hover:underline font-semibold">
                {t("auth.registerLink", "Register Farm Account")}
              </Link>
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

