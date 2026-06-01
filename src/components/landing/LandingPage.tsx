"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Search, ChevronDown, FileText, LayoutGrid, Users, Star, Zap, Shield } from "lucide-react";

/* ── Top Navbar ── */
function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 mr-4">
          <div className="h-7 w-7 bg-[#0052CC] rounded-md flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-[#172B4D]">Confluence</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {[
            { label: "Features", hasChevron: true },
            { label: "Resources", hasChevron: false },
            { label: "Templates", hasChevron: true },
            { label: "Pricing", hasChevron: false },
            { label: "Enterprise", hasChevron: false },
          ].map(({ label, hasChevron }) => (
            <button
              key={label}
              className="flex items-center gap-0.5 px-3 py-1.5 text-sm text-[#42526E] hover:text-[#172B4D] hover:bg-gray-50 rounded transition-colors"
            >
              {label}
              {hasChevron && <ChevronDown className="h-3.5 w-3.5 opacity-60" />}
            </button>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button className="h-8 w-8 flex items-center justify-center text-[#42526E] hover:text-[#172B4D] hover:bg-gray-50 rounded transition-colors">
            <Search className="h-4 w-4" />
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <Link
            href="/login"
            className="px-4 py-1.5 text-sm font-medium text-[#0052CC] hover:text-[#0065FF] transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-1.5 text-sm font-semibold text-white bg-[#0052CC] hover:bg-[#0065FF] rounded-full transition-colors"
          >
            Get it free
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ── Product mock screenshot ── */
function ProductMock() {
  return (
    <div className="w-full max-w-3xl mx-auto mt-12 rounded-xl overflow-hidden shadow-2xl border border-gray-200">
      {/* Browser chrome */}
      <div className="bg-[#F4F5F7] px-4 py-2.5 flex items-center gap-2 border-b border-gray-200">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <div className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex-1 mx-3 h-5 bg-white rounded border border-gray-200 flex items-center px-2.5 gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#0052CC]" />
          <span className="text-[10px] text-gray-400">confluence.example.com/spaces</span>
        </div>
      </div>

      {/* App chrome */}
      <div className="bg-[#0052CC] px-4 py-2 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 bg-white/20 rounded flex items-center justify-center">
            <BookOpen className="h-3 w-3 text-white" />
          </div>
          <span className="text-white text-xs font-semibold">Confluence</span>
        </div>
        <div className="flex-1 max-w-xs mx-4 h-6 bg-white/20 rounded flex items-center px-2 gap-1.5">
          <Search className="h-3 w-3 text-white/60" />
          <span className="text-white/60 text-[10px]">Search</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="px-2.5 py-1 bg-white text-[#0052CC] text-[10px] font-bold rounded">Create</div>
          <div className="h-6 w-6 rounded-full bg-purple-400 flex items-center justify-center text-white text-[9px] font-bold">B</div>
        </div>
      </div>

      {/* App body */}
      <div className="bg-white flex h-48">
        {/* Sidebar */}
        <div className="w-44 bg-[#F4F5F7] border-r border-gray-200 p-3 shrink-0">
          <div className="text-[9px] font-bold text-[#6B778C] uppercase tracking-wide mb-2">Spaces</div>
          {[
            { emoji: "🚀", name: "Product Team", color: "bg-blue-100 text-blue-700" },
            { emoji: "📊", name: "Marketing Hub", color: "bg-green-100 text-green-700" },
            { emoji: "⚙️", name: "Engineering", color: "bg-purple-100 text-purple-700" },
          ].map((space) => (
            <div key={space.name} className="flex items-center gap-1.5 px-1.5 py-1 rounded text-[9px] text-[#172B4D] mb-0.5 hover:bg-white cursor-pointer">
              <span className="text-xs">{space.emoji}</span>
              <span className="font-medium truncate">{space.name}</span>
            </div>
          ))}
          <div className="mt-3 text-[9px] font-bold text-[#6B778C] uppercase tracking-wide mb-1.5">Pages</div>
          {["Strategy Brief", "Product Roadmap", "Meeting Notes"].map((p) => (
            <div key={p} className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[9px] text-[#172B4D] mb-0.5 cursor-pointer hover:bg-white">
              <span className="text-[#DFE1E6]">•</span> {p}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🚀</span>
                <div className="h-4 w-32 bg-[#172B4D] rounded" style={{ opacity: 0.8 }} />
              </div>
              <div className="h-2.5 w-48 bg-gray-200 rounded mb-1" />
              <div className="h-2.5 w-36 bg-gray-200 rounded" />
            </div>
            <div className="flex gap-1.5">
              <div className="px-2.5 py-1 bg-[#0052CC] text-white text-[9px] font-bold rounded">Edit</div>
              <div className="px-2.5 py-1 border border-gray-200 text-[9px] font-medium rounded">Share</div>
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <div className="h-2 w-full bg-gray-100 rounded" />
            <div className="h-2 w-5/6 bg-gray-100 rounded" />
            <div className="h-2 w-4/5 bg-gray-100 rounded" />
            <div className="h-2 w-full bg-gray-100 rounded mt-3" />
            <div className="h-2 w-3/4 bg-gray-100 rounded" />
          </div>
          {/* Avatars collaborating */}
          <div className="flex items-center gap-1.5 mt-4">
            {["#0052CC", "#36B37E", "#FF8B00"].map((c, i) => (
              <div key={i} className="h-5 w-5 rounded-full border-2 border-white -ml-1 first:ml-0" style={{ backgroundColor: c }} />
            ))}
            <span className="text-[9px] text-[#6B778C] ml-1">3 people viewing</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Feature cards row ── */
const FEATURES = [
  {
    icon: FileText,
    color: "bg-blue-50 text-blue-600",
    title: "Pages",
    desc: "Create rich documents with tables, images, and formatting. Draft, collaborate, and publish.",
  },
  {
    icon: LayoutGrid,
    color: "bg-purple-50 text-purple-600",
    title: "Spaces",
    desc: "Organize your team's knowledge by project, team, or topic. Find everything fast.",
  },
  {
    icon: Users,
    color: "bg-green-50 text-green-600",
    title: "Teams",
    desc: "Create teams, invite colleagues, and share spaces. Keep everyone aligned.",
  },
  {
    icon: Star,
    color: "bg-yellow-50 text-yellow-600",
    title: "Templates",
    desc: "Start fast with ready-made page layouts for meetings, projects, and more.",
  },
  {
    icon: Zap,
    color: "bg-orange-50 text-orange-600",
    title: "Search",
    desc: "Find any page, space, or team instantly across your entire knowledge base.",
  },
  {
    icon: Shield,
    color: "bg-red-50 text-red-600",
    title: "Permissions",
    desc: "Control who can view and edit spaces and pages with fine-grained access roles.",
  },
];

/* ── Main landing page ── */
export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) {
      router.push(`/signup?email=${encodeURIComponent(email.trim())}`);
    } else {
      router.push("/signup");
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(#172B4D 1px, transparent 1px), linear-gradient(to right, #172B4D 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-8">
          <div className="flex flex-col lg:flex-row lg:items-start gap-12 lg:gap-16">
            {/* Left — headline */}
            <div className="flex-1 max-w-2xl">
              <h1 className="text-5xl lg:text-6xl font-black text-[#172B4D] leading-[1.05] mb-6">
                The workspace<br />
                that works<br />
                with your team
              </h1>
              <p className="text-lg text-[#42526E] leading-relaxed max-w-lg">
                Confluence is the one place for all your ideas, docs, and knowledge — organize, collaborate, and keep your team aligned.
              </p>
            </div>

            {/* Right — sign up form */}
            <div className="w-full lg:w-96 shrink-0">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                <form onSubmit={handleSignup} className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-[#172B4D] mb-1.5">Work email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full h-11 px-4 text-sm border border-gray-300 rounded-lg outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 transition-all"
                    />
                    <p className="text-xs text-[#6B778C] mt-1.5">Sign up with a work email to find teammates</p>
                  </div>
                  <button
                    type="submit"
                    className="w-full h-11 bg-[#0052CC] hover:bg-[#0065FF] text-white font-semibold text-sm rounded-lg transition-colors"
                  >
                    Sign up
                  </button>
                </form>

                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="text-xs text-[#6B778C]">Or continue with</span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>

                <Link
                  href="/signup"
                  className="flex items-center justify-center gap-3 w-full h-11 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-[#172B4D]"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </Link>

                <p className="text-center text-xs text-[#97A0AF] mt-4">
                  Already have an account?{" "}
                  <Link href="/login" className="text-[#0052CC] hover:underline font-medium">Log in</Link>
                </p>
              </div>
            </div>
          </div>

          {/* Product screenshot */}
          <ProductMock />
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="bg-[#F4F5F7] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#172B4D] mb-3">Everything your team needs</h2>
            <p className="text-[#42526E] text-lg max-w-xl mx-auto">
              Create, organize, and collaborate on knowledge — all in one place.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="bg-white rounded-xl border border-[#DFE1E6] p-6 hover:shadow-md hover:border-[#0052CC]/30 transition-all">
                <div className={`h-10 w-10 rounded-lg ${color} flex items-center justify-center mb-4`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-[#172B4D] mb-1.5">{title}</h3>
                <p className="text-sm text-[#6B778C] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="bg-[#0052CC] py-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Start building your knowledge base today</h2>
          <p className="text-blue-200 mb-8 text-lg">Free to get started. No credit card required.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="px-8 py-3 bg-white text-[#0052CC] font-bold rounded-full hover:bg-blue-50 transition-colors text-sm"
            >
              Get it free
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 border border-white/40 text-white font-semibold rounded-full hover:bg-white/10 transition-colors text-sm"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#172B4D] py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-white/20 rounded flex items-center justify-center">
              <BookOpen className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-white font-semibold text-sm">Confluence</span>
          </div>
          <p className="text-blue-300 text-xs">Your team&apos;s knowledge, all in one place.</p>
        </div>
      </footer>
    </div>
  );
}
