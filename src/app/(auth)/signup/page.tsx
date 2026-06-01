"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { BookOpen, Loader2, FileText, Users, LayoutGrid, CheckCircle2 } from "lucide-react";

function LeftPanel() {
  return (
    <div className="hidden lg:flex w-[52%] min-h-screen bg-[#0052CC] flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-72 h-72 bg-[#0065FF] rounded-full opacity-30 -translate-y-1/3 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#003E9C] rounded-full opacity-40 translate-y-1/3 -translate-x-1/4" />
      <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-[#0747A6] rounded-full opacity-20 -translate-x-1/2 -translate-y-1/2" />

      <div className="relative z-10 flex flex-col h-full px-12 py-12">
        <div className="flex items-center gap-3 mb-16">
          <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center shadow-md">
            <BookOpen className="h-6 w-6 text-[#0052CC]" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">Confluence</span>
        </div>

        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Start building your team&apos;s knowledge base
          </h1>
          <p className="text-blue-200 text-lg leading-relaxed max-w-sm">
            Join thousands of teams who use Confluence to collaborate, document, and stay aligned — all in one place.
          </p>
        </div>

        <div className="space-y-4 mb-10">
          {[
            { icon: FileText, title: "Pages", desc: "Draft, edit, and publish rich docs with your team" },
            { icon: LayoutGrid, title: "Spaces", desc: "Organize knowledge by team, project, or topic" },
            { icon: Users, title: "Teams", desc: "Collaborate and share access with your colleagues" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3.5 border border-white/10">
              <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{title}</p>
                <p className="text-blue-200 text-xs mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-6 text-blue-200 text-xs">
          {["Secure & private", "Real-time collaboration", "Always in sync"].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const prefill = searchParams.get("email");
    if (prefill) setEmail(prefill);
  }, [searchParams]);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; password?: string }>({});

  function validate() {
    const e: { fullName?: string; email?: string; password?: string } = {};
    if (!fullName.trim()) e.fullName = "Name is required";
    if (!email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Min 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSignup(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Account created! Check your email to confirm."); router.push("/login"); }
  }

  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) toast.error(error.message);
  }

  return (
    <div className="min-h-screen flex">
      <LeftPanel />

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-[#F4F5F7] p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
            <div className="h-8 w-8 bg-[#0052CC] rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#172B4D]">Confluence</span>
          </div>

          <h2 className="text-2xl font-bold text-[#172B4D] mb-1.5">Create your account</h2>
          <p className="text-[#6B778C] text-sm mb-8">
            Already have an account?{" "}
            <Link href="/login" className="text-[#0052CC] hover:underline font-medium">Log in</Link>
          </p>

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <Label htmlFor="fullName" className="text-[#172B4D] font-medium text-sm">Full name</Label>
              <Input
                id="fullName" value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
                className={`mt-1.5 h-11 bg-white border-[#DFE1E6] focus-visible:ring-[#0052CC] text-sm ${errors.fullName ? "border-red-500" : ""}`}
              />
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
            </div>
            <div>
              <Label htmlFor="email" className="text-[#172B4D] font-medium text-sm">Email</Label>
              <Input
                id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                className={`mt-1.5 h-11 bg-white border-[#DFE1E6] focus-visible:ring-[#0052CC] text-sm ${errors.email ? "border-red-500" : ""}`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="password" className="text-[#172B4D] font-medium text-sm">Password</Label>
              <Input
                id="password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className={`mt-1.5 h-11 bg-white border-[#DFE1E6] focus-visible:ring-[#0052CC] text-sm ${errors.password ? "border-red-500" : ""}`}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#0052CC] hover:bg-[#0065FF] text-white font-semibold text-sm rounded-md"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create account
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#DFE1E6]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#F4F5F7] px-3 text-[#6B778C]">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 h-11 border border-[#DFE1E6] rounded-md bg-white hover:bg-[#F4F5F7] text-[#172B4D] text-sm font-medium transition-colors shadow-sm"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-xs text-[#6B778C] mt-6">
            By creating an account, you agree to our{" "}
            <span className="text-[#0052CC] cursor-pointer hover:underline">Terms of Service</span>
            {" "}and{" "}
            <span className="text-[#0052CC] cursor-pointer hover:underline">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupContent />
    </Suspense>
  );
}
