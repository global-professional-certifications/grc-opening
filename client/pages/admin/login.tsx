import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("grc_local_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.role === "ADMIN") { router.replace("/admin"); return; }
      } catch {}
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) { setError("Email and password are required."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("grc_local_token", data.token);
      router.push("/admin");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head><title>Admin Login · GRC Openings</title></Head>
      <div
        className="min-h-screen flex items-center justify-center bg-[#f1f5f9]"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#3a1292]/5" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#3a1292]/5" />
        </div>

        <div className="relative w-full max-w-md px-4">
          {/* Card */}
          <div className="bg-white rounded-3xl shadow-2xl shadow-black/10 overflow-hidden">
            {/* Header stripe */}
            <div className="bg-[#0f172a] px-8 pt-10 pb-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 mb-4">
                <span className="material-symbols-outlined text-white" style={{ fontSize: 32 }}>shield</span>
              </div>
              <h1 className="text-[22px] font-bold text-white">Admin Portal</h1>
              <p className="text-[13px] text-slate-400 mt-1">GRC Openings · Authorized Access Only</p>
              <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[11px] font-semibold text-amber-300 tracking-wide">ADMIN ACCESS</span>
              </div>
            </div>

            {/* Form */}
            <div className="px-8 py-8">
              {error && (
                <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                  <span className="material-symbols-outlined text-red-500 shrink-0" style={{ fontSize: 18 }}>error</span>
                  <p className="text-[13px] text-red-700 font-medium leading-snug">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-500 tracking-wide uppercase">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: 18 }}>alternate_email</span>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="admin@grcopenings.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-[14px] font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#3a1292] focus:ring-4 focus:ring-[#3a1292]/10 focus:bg-white transition-all"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-gray-500 tracking-wide uppercase">
                    Password
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: 18 }}>lock</span>
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 bg-gray-50 text-[14px] font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#3a1292] focus:ring-4 focus:ring-[#3a1292]/10 focus:bg-white transition-all"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        {showPw ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 mt-1 rounded-xl bg-[#3a1292] text-white font-bold text-[15px] shadow-lg shadow-[#3a1292]/25 hover:bg-[#2e0e74] transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>login</span>
                        Sign In to Admin Panel
                      </>
                  }
                </button>
              </form>

              <div className="mt-6 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                <span className="material-symbols-outlined text-slate-400 shrink-0" style={{ fontSize: 14, marginTop: 2 }}>info</span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Unauthorized access attempts are logged and monitored. Admin accounts are provisioned exclusively by platform administrators.
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-[12px] text-slate-400 mt-5">
            © {new Date().getFullYear()} GRC Openings. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
}
