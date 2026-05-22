"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { BookOpen, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate() {
    const e: { email?: string; password?: string } = {};
    if (!email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Min 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else { router.push("/"); router.refresh(); }
  }

  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) toast.error(error.message);
  }

  async function handleForgot() {
    if (!email) { setErrors({ email: "Enter your email first" }); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    if (error) toast.error(error.message);
    else toast.success("Reset email sent!");
  }

  return (
    <div className="min-h-screen flex bg-[#F4F5F7]">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-[#0052CC] items-center justify-center p-12">
        <div className="text-white max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-[#0052CC]" />
            </div>
            <span className="text-2xl font-bold">Confluence</span>
          </div>
          <h2 className="text-3xl font-bold mb-4 leading-tight">
            Your team's knowledge base
          </h2>
          <p className="text-blue-200 text-lg leading-relaxed">
            Create, organize and collaborate on documents, meeting notes, and everything your team needs — in one place.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
            <div className="h-8 w-8 bg-[#0052CC] rounded flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#172B4D]">Confluence</span>
          </div>

          <h1 className="text-2xl font-bold text-[#172B4D] mb-2">Log in to your account</h1>
          <p className="text-[#6B778C] text-sm mb-8">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#0052CC] hover:underline font-medium">Sign up for free</Link>
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-[#172B4D] font-medium text-sm">Email</Label>
              <Input
                id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                className={`mt-1.5 h-10 border-[#DFE1E6] focus-visible:ring-[#0052CC] ${errors.email ? "border-red-500" : ""}`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-[#172B4D] font-medium text-sm">Password</Label>
                <button type="button" onClick={handleForgot} className="text-xs text-[#0052CC] hover:underline">
                  Forgot password?
                </button>
              </div>
              <Input
                id="password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className={`mt-1.5 h-10 border-[#DFE1E6] focus-visible:ring-[#0052CC] ${errors.password ? "border-red-500" : ""}`}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
            <Button type="submit" disabled={loading} className="w-full h-10 bg-[#0052CC] hover:bg-[#0065FF] text-white font-semibold">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Log in
            </Button>
          </form>

          <div className="relative my-5">
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
            className="w-full flex items-center justify-center gap-3 h-10 border border-[#DFE1E6] rounded-md bg-white hover:bg-[#F4F5F7] text-[#172B4D] text-sm font-medium transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
