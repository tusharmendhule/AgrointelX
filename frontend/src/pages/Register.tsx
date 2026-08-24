import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { Leaf, Lock, Mail, Phone, CircleAlert, ChevronRight, User, MapPin, Grid } from "lucide-react";
import { UserRole } from "../types";
import { signInWithGoogle } from "../lib/firebase";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function Register() {
  const { t } = useTranslation();
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.FARMER);
  const [farmLocation, setFarmLocation] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [soilType, setSoilType] = useState("Alluvial");
  const [password, setPassword] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError(t("auth.fillMandatory", "Please fill out all mandatory credentials (*)."));
      return;
    }
    setError("");
    setLoading(true);

    try {
      await register({
        name,
        email,
        phoneNumber: phoneNumber || undefined,
        role,
        farmLocation: role === UserRole.FARMER ? farmLocation : undefined,
        farmSize: role === UserRole.FARMER ? farmSize : undefined,
        soilType: role === UserRole.FARMER ? soilType : undefined,
        password
      });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || t("auth.registerFailed", "Registration failed. Try using another email address."));
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
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || t("auth.googleFailed", "Google Authentication failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faf8] dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans text-slate-900 dark:text-slate-100">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[80px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-[80px]" />

      <div className="w-full max-w-xl relative z-10 my-8">
        
        {/* LOGO */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-500/20 mb-3">
            <Leaf className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">{t("auth.registerTitle", "Register Farm Account")}</h2>
          <p className="text-xs text-slate-400 mt-1">{t("auth.registerSubtitle", "Configure your precision agriculture profile variables")}</p>
        </div>

        <div className="flex justify-center mb-4">
          <LanguageSwitcher variant="dark" />
        </div>

        {/* GLASSCARD */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 dark:backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl"
        >
          {error && (
            <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center gap-2 text-xs">
              <CircleAlert className="h-4.5 w-4.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Split row for Name and Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{t("auth.yourName", "Your Name")} *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                  <input 
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ramesh Kumar"
                    className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{t("auth.email", "Email Address")} *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ramesh@gmail.com"
                    className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{t("auth.phoneNumber", "Phone Number (For OTP / Phone Sign In)")}</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                <input 
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="9876543210"
                  className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Role selection */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{t("auth.applicationRole", "Application Role")}</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(UserRole).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2.5 rounded-xl border text-xs font-semibold capitalize transition-all ${
                      role === r 
                        ? "bg-emerald-600/10 border-emerald-500 text-emerald-400" 
                        : "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
                    }`}
                  >
                    {t(`roles.${r}`, r)}
                  </button>
                ))}
              </div>
            </div>

            {/* Conditionally render farmer profile statistics */}
            {role === UserRole.FARMER && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4 pt-2 border-t border-slate-800/60"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{t("auth.farmLocation", "Farm Location (State / City)")}</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                      <input 
                        type="text"
                        value={farmLocation}
                        onChange={(e) => setFarmLocation(e.target.value)}
                        placeholder="Punjab, Ludhiana"
                        className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{t("auth.farmSize", "Farm Size (Acres)")}</label>
                    <div className="relative">
                      <Grid className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                      <input 
                        type="number"
                        step="0.1"
                        value={farmSize}
                        onChange={(e) => setFarmSize(e.target.value)}
                        placeholder="12.5"
                        className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{t("auth.soilType", "Soil Classification Type")}</label>
                  <select
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Alluvial">{t("soil.alluvial", "Alluvial Loam (Highly Fertile)")}</option>
                    <option value="Black">{t("soil.black", "Black Soil (Regur / Cotton ideal)")}</option>
                    <option value="Red">{t("soil.red", "Red & Yellow Soil (Acidic/Sandy)")}</option>
                    <option value="Sandy">{t("soil.sandy", "Sandy Loam (Well-Drained)")}</option>
                    <option value="Clay">{t("soil.clay", "Clay Rich (Moisture Retentive)")}</option>
                    <option value="Laterite">{t("soil.laterite", "Laterite Soil (Acidic/Leached)")}</option>
                  </select>
                </div>
              </motion.div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{t("auth.accountPassword", "Account Password")} *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.createPasswordPlaceholder", "Create a strong password")}
                  className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-medium rounded-xl py-3 text-xs flex items-center justify-center gap-1 shadow-lg shadow-emerald-600/10 transition-colors mt-6"
            >
              {loading ? t("auth.creatingProfile", "Creating secure profile...") : t("auth.confirmLaunch", "Confirm & Launch System")}
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
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-950 disabled:opacity-50 text-slate-700 dark:text-slate-200 text-xs rounded-xl font-medium transition-colors cursor-pointer"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.102 1.025 5.047 1.926l3.258-3.133C18.336 1.251 15.54.5 12.24.5 5.866.5.6 5.65.6 12s5.266 11.5 11.64 11.5c6.653 0 11.077-4.604 11.077-11.134 0-.748-.078-1.32-.176-1.881H12.24z"
              />
            </svg>
            {t("auth.signUpWithGoogle", "Sign Up with Google")}
          </button>

          <div className="text-center mt-6">
            <p className="text-xs text-slate-400">
              {t("auth.alreadyHaveAccount", "Already have an account?")}{" "}
              <Link to="/login" className="text-emerald-400 hover:underline font-semibold">
                {t("landing.signIn", "Sign In")}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
