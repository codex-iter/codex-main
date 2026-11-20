import { useEffect, useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SEO from "../components/SEO";
import { ScrollReveal } from "../components/animations/ScrollReveal";
import { getMonthlyLeaderboard } from "../services/codexApi";
import type { MonthlyLeaderboardEntry } from "../services/codexApi";
import { 
  Trophy, 
  Flame, 
  Swords, 
  Search, 
  Zap, 
  ChevronRight, 
  ChevronLeft, 
  Radar, 
  GitCommit, 
  GitPullRequest, 
  Code2, 
  X 
} from "lucide-react";
import AvatarImage from "../components/ui/AvatarImage";
import HoloCard from "../components/ui/HoloCard";

type ArenaCategory = "DSA" | "DEV" | "ALL";
type TierFilter = "ALL" | "APEX" | "DIAMOND" | "CONTENDER";

export default function Arena() {
  const [data, setData] = useState<MonthlyLeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<ArenaCategory>("DSA");
  const [isRankModalOpen, setIsRankModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState<TierFilter>("ALL");
  const [dsaPage, setDsaPage] = useState(1);
  const [devPage, setDevPage] = useState(1);
  const battlegroundRef = useRef<HTMLDivElement>(null);
  const dsaRosterRef = useRef<HTMLDivElement>(null);
  const devRosterRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 8;

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getMonthlyLeaderboard();
        setData(res || []);
      } catch (e) {
        console.error("[Arena] Error fetching monthly leaderboard:", e);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const now = new Date();
  const monthName = now.toLocaleString("default", { month: "long" }).toUpperCase();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const diff = endOfMonth.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diff / (1000 * 3600 * 24));

  const dsaSorted = useMemo(() => {
    return [...data]
      .sort((a, b) => {
        if ((b.monthly_dsa_score || 0) !== (a.monthly_dsa_score || 0)) {
          return (b.monthly_dsa_score || 0) - (a.monthly_dsa_score || 0);
        }
        return (b.current_streak || 0) - (a.current_streak || 0);
      })
      .map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [data]);

  const devSorted = useMemo(() => {
    return [...data]
      .sort((a, b) => {
        if ((b.monthly_dev_score || 0) !== (a.monthly_dev_score || 0)) {
          return (b.monthly_dev_score || 0) - (a.monthly_dev_score || 0);
        }
        return (b.current_streak || 0) - (a.current_streak || 0);
      })
      .map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [data]);

  const filterList = (list: (MonthlyLeaderboardEntry & { rank: number })[]) => {
    return list.filter((member) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        member.full_name.toLowerCase().includes(q) ||
        (member.handle && member.handle.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (selectedTier === "APEX") return member.rank <= 3;
      if (selectedTier === "DIAMOND") return member.rank > 3 && member.rank <= 10;
      if (selectedTier === "CONTENDER") return member.rank > 10;
      return true;
    });
  };

  const filteredDsa = useMemo(() => filterList(dsaSorted), [dsaSorted, searchQuery, selectedTier]);
  const filteredDev = useMemo(() => filterList(devSorted), [devSorted, searchQuery, selectedTier]);

  useEffect(() => {
    setDsaPage(1);
    setDevPage(1);
  }, [searchQuery, selectedTier, activeCategory]);

  const scrollToDsaList = () => {
    if (dsaRosterRef.current) {
      const rect = dsaRosterRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      window.scrollTo({ top: Math.max(0, rect.top + scrollTop - 90), behavior: "smooth" });
    }
  };

  const scrollToDevList = () => {
    if (devRosterRef.current) {
      const rect = devRosterRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      window.scrollTo({ top: Math.max(0, rect.top + scrollTop - 90), behavior: "smooth" });
    }
  };

  const totalCombatants = data.length;
  const totalDsaSolved = data.reduce((acc, m) => acc + (m.monthly_problems_solved || 0), 0);
  const totalDevCommits = data.reduce((acc, m) => acc + (m.monthly_commits || 0), 0);

  // Top Leaders for Duel Clash Banner
  const topDsaLeader = dsaSorted[0];
  const topDevLeader = devSorted[0];

  // Helper for Rank Titles
  const getRankTitle = (rank: number) => {
    if (rank === 1) return { title: "APEX #1", color: "bg-amber-400 text-slate-950 border-slate-900 font-black" };
    if (rank <= 3) return { title: "TIER 1", color: "bg-slate-200 text-slate-900 border-slate-400 font-bold" };
    if (rank <= 10) return { title: "DIAMOND", color: "bg-blue-50 text-blue-700 border-blue-300 font-bold" };
    return { title: "CONTENDER", color: "bg-slate-100 text-slate-600 border-slate-300 font-medium" };
  };

  // Helper for Streak Badges
  const getStreakBadge = (streak: number) => {
    if (streak >= 14) return { label: "💥 RAMPAGE", style: "bg-red-600 text-white animate-pulse" };
    if (streak >= 7) return { label: "⚡ UNSTOPPABLE", style: "bg-slate-900 text-[#FACC15] font-black border-slate-900 shadow-[1px_1px_0px_#0f172a]" };
    if (streak >= 3) return { label: "🔥 ON FIRE", style: "bg-orange-500 text-white" };
    return null;
  };

  // Helper to reliably get competitor avatar with GitHub profile picture fallback
  const PODIUM_CARD_RATIO = 0.64;

  const getCompetitorAvatars = (m?: { avatar_url?: string | null; handle?: string | null; full_name?: string | null } | null) => {
    if (!m) return { image: "/codex_dark.png", fallback: "/codex_dark.png" };
    const cleanHandle = m.handle ? m.handle.replace(/^@/, "").trim() : "";
    const githubUrl = cleanHandle ? `https://github.com/${cleanHandle}.png` : undefined;
    const seed = encodeURIComponent(m.full_name || cleanHandle || "warrior");
    const dicebearUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=0f172a&textColor=ffffff`;

    const rawUrl = (m.avatar_url && m.avatar_url.trim()) ? m.avatar_url.trim() : undefined;
    // LinkedIn CDN (media.licdn.com) is blocked by browser ad/privacy blockers (net::ERR_BLOCKED_BY_CLIENT)
    const isBlockedCdn = rawUrl?.includes("licdn.com");
    const userPhoto = isBlockedCdn ? undefined : rawUrl;

    const image = userPhoto || githubUrl || dicebearUrl;
    const fallback = githubUrl || dicebearUrl;

    return { image, fallback };
  };

  return (
    <div className="min-h-screen bg-background-light font-display text-slate-900 pb-24 relative selection:bg-[#CAF0F8] selection:text-slate-900 overflow-hidden">
      <SEO
        title="The Arena | CODEX ITER Monthly Esports"
        description="Monthly CODEX Arena battleground. Compete in Algorithms (DSA) and Development to claim the top podium places!"
      />

      {/* ── LIVE BATTLE TICKER MARQUEE ── */}
      <div className="w-full bg-slate-900 text-white border-b-4 border-slate-900 py-2 font-mono text-xs font-bold overflow-hidden whitespace-nowrap z-50 relative select-none">
        <div className="inline-flex animate-marquee gap-8">
          <span>⚡ LIVE BATTLE MARQUEE: SEASON {monthName} IN FULL EFFECT</span>
          <span>🔥 TOP ALGO WARRIOR: {topDsaLeader ? topDsaLeader.full_name : '—'} ({topDsaLeader?.monthly_dsa_score || 0} XP)</span>
          <span>🛠️ TOP DEV WARRIOR: {topDevLeader ? topDevLeader.full_name : '—'} ({topDevLeader?.monthly_dev_score || 0} XP)</span>
          <span>⚔️ {daysRemaining} DAYS REMAINING TO CLAIM APEX LEGEND TITLE</span>
          <span>💥 KEEP CODING & COMMITTING TO LEAP IN RANK!</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-3 sm:p-8 md:p-12 relative z-10">
        {/* ── Arcade / Esports Cyber Header ── */}
        <ScrollReveal className="mb-8 sm:mb-12">
          <div className="border-4 border-slate-900 p-5 sm:p-10 bg-white brutalist-shadow relative overflow-hidden">
            {/* Background Cyber Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
            
            {/* Swords Decorative Icon */}
            <div className="absolute -right-8 -bottom-8 opacity-10 rotate-12 pointer-events-none select-none">
              <span className="material-symbols-outlined text-[200px] sm:text-[320px] text-slate-900">
                swords
              </span>
            </div>

            <div className="relative z-10 flex flex-col items-start gap-4 sm:gap-6">
              {/* Top Row: Badges + Rank Mechanism Button */}
              <div className="w-full flex items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
                  <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-3 sm:px-4 py-1 font-mono font-bold text-xs uppercase border border-slate-900 brutalist-shadow-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    SEASON: ACTIVE COMBAT
                  </div>
                  <div className="bg-[#FACC15] text-slate-900 px-3 sm:px-4 py-1 font-mono font-black text-xs uppercase border-2 border-slate-900 brutalist-shadow-sm">
                    ⚡ {monthName} LEAGUE
                  </div>
                </div>

                {/* ── RANK MECHANISM BUTTON ── */}
                <button
                  onClick={() => setIsRankModalOpen(true)}
                  className="bg-slate-900 hover:bg-[#0707f2] text-white font-mono font-black text-xs sm:text-sm px-3 sm:px-5 py-1.5 sm:py-2 border-2 border-slate-900 brutalist-shadow-sm flex items-center gap-2 transition-all cursor-pointer active:translate-y-0.5"
                >
                  <span className="text-base sm:text-lg">❓</span>
                  <span className="hidden sm:inline">RANK MECHANISM</span>
                  <span className="sm:hidden">RULES</span>
                </button>
              </div>

              {/* Title Header */}
              <h1 className="text-5xl xs:text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-slate-900 tracking-tighter uppercase leading-none flex items-baseline gap-2.5 sm:gap-4 flex-wrap">
                <span className="[text-shadow:2px_2px_0px_#94a3b8] sm:[text-shadow:4px_4px_0px_#94a3b8]">THE</span>
                <span className="relative inline-block text-red-600 [text-shadow:3px_3px_0px_#0f172a] sm:[text-shadow:5px_5px_0px_#0f172a]">
                  ARENA
                  <span className="block h-1.5 sm:h-2.5 w-full bg-red-600 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] mt-1 sm:mt-2" />
                </span>
              </h1>

              {/* HUD Countdown & Stats Bar */}
              <div className="w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-4 border-t-4 border-slate-900 mt-2">
                <div className="inline-flex items-center gap-3 bg-white text-slate-900 font-black px-4 sm:px-6 py-2.5 text-lg sm:text-2xl border-4 border-slate-900 brutalist-shadow">
                  <span className="material-symbols-outlined text-red-500 text-2xl sm:text-3xl animate-bounce">
                    timer
                  </span>
                  <span>RESET IN: <span className="text-red-500 font-mono">{daysRemaining} DAYS</span></span>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center font-mono">
                  <div className="bg-slate-100 p-2 sm:px-4 sm:py-2 border-2 border-slate-900 brutalist-shadow-sm">
                    <div className="text-[9px] sm:text-xs font-bold text-slate-500">WARRIORS</div>
                    <div className="text-sm sm:text-xl font-black">{totalCombatants}</div>
                  </div>
                  <div className="bg-slate-100 p-2 sm:px-4 sm:py-2 border-2 border-slate-900 brutalist-shadow-sm">
                    <div className="text-[9px] sm:text-xs font-bold text-slate-500">DSA SOLVED</div>
                    <div className="text-sm sm:text-xl font-black text-red-600">{totalDsaSolved}</div>
                  </div>
                  <div className="bg-slate-100 p-2 sm:px-4 sm:py-2 border-2 border-slate-900 brutalist-shadow-sm">
                    <div className="text-[9px] sm:text-xs font-bold text-slate-500">COMMITS</div>
                    <div className="text-sm sm:text-xl font-black text-blue-600">{totalDevCommits}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* ── TOP #1 DIVISION CHAMPIONS BANNER ── */}
        {!isLoading && topDsaLeader && topDevLeader && (
          <ScrollReveal delay={0.03} className="mb-10">
            <div className="border-4 border-slate-900 bg-slate-900 text-white p-5 sm:p-6 brutalist-shadow relative overflow-hidden">
              <div className="flex items-center justify-between border-b-2 border-slate-700 pb-3 mb-4">
                <span className="font-mono text-xs font-black uppercase text-[#FACC15] tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
                  DIVISION CHAMPIONS • {monthName} LEAGUE
                </span>
                <span className="font-mono text-[10px] text-slate-300 uppercase hidden sm:inline">CURRENT #1 LEADERS</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* #1 Algo Champion Card */}
                <div className="flex items-center justify-between bg-red-950/80 border-2 border-red-500 p-4 brutalist-shadow-sm">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 border-2 border-white bg-slate-800 overflow-hidden font-black text-white text-xl flex items-center justify-center">
                        <AvatarImage
                          url={topDsaLeader.avatar_url}
                          handle={topDsaLeader.handle}
                          name={topDsaLeader.full_name}
                        />
                      </div>
                      <span className="absolute -top-2 -right-2 text-lg">👑</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-mono font-black text-red-400 uppercase tracking-wide">⚔️ #1 ALGORITHMS LEADER</div>
                      <div className="text-lg sm:text-xl font-black truncate uppercase text-white">{topDsaLeader.full_name}</div>
                      <div className="text-[10px] font-mono text-slate-300">SOLVED: {topDsaLeader.monthly_problems_solved || 0} (LC: {topDsaLeader.monthly_leetcode || 0} | CF: {topDsaLeader.monthly_codeforces || 0} | CC: {topDsaLeader.monthly_codechef || 0} | GFG: {topDsaLeader.monthly_gfg || 0})</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 pl-3 border-l border-red-800/80">
                    <div className="text-2xl sm:text-3xl font-black font-mono text-[#FACC15]">{Math.floor(topDsaLeader.monthly_dsa_score || 0)}</div>
                    <div className="text-[9px] font-mono text-red-300 uppercase font-bold">DSA XP</div>
                  </div>
                </div>

                {/* #1 Dev Champion Card */}
                <div className="flex items-center justify-between bg-blue-950/80 border-2 border-blue-500 p-4 brutalist-shadow-sm">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 border-2 border-white bg-slate-800 overflow-hidden font-black text-white text-xl flex items-center justify-center">
                        <AvatarImage
                          url={topDevLeader.avatar_url}
                          handle={topDevLeader.handle}
                          name={topDevLeader.full_name}
                        />
                      </div>
                      <span className="absolute -top-2 -right-2 text-lg">👑</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-mono font-black text-blue-400 uppercase tracking-wide">🛠️ #1 DEV LEADER</div>
                      <div className="text-lg sm:text-xl font-black truncate uppercase text-white">{topDevLeader.full_name}</div>
                      <div className="text-[10px] font-mono text-slate-300">{topDevLeader.monthly_commits || 0} COMMITS</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 pl-3 border-l border-blue-800/80">
                    <div className="text-2xl sm:text-3xl font-black font-mono text-[#FACC15]">{Math.floor(topDevLeader.monthly_dev_score || 0)}</div>
                    <div className="text-[9px] font-mono text-blue-300 uppercase font-bold">DEV XP</div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* ── TOURNAMENT CONTROL HUB & SEARCH CONSOLE ── */}
        <div id="division-battleground" ref={battlegroundRef} className="scroll-mt-20 mb-8 sm:mb-10">
          <div className="border-4 border-slate-900 bg-white brutalist-shadow p-4 sm:p-6 space-y-4">
            {/* Row 1: Division Selector & Search */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b-2 border-slate-900">
              {/* Category Segmented Buttons */}
              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                <button
                  onClick={() => setActiveCategory("DSA")}
                  className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 font-black text-xs sm:text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 border-2 sm:border-4 border-slate-900 cursor-pointer ${
                    activeCategory === "DSA"
                      ? "bg-red-600 text-white shadow-[3px_3px_0px_#0f172a] -translate-y-0.5"
                      : "bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Swords className="w-4 h-4" />
                  <span>ALGORITHMS</span>
                  <span className={`text-[10px] px-1.5 py-0.5 font-mono font-bold border ${activeCategory === "DSA" ? "bg-red-800 text-white border-red-400" : "bg-slate-100 text-slate-800 border-slate-400"}`}>
                    {dsaSorted.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveCategory("DEV")}
                  className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 font-black text-xs sm:text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 border-2 sm:border-4 border-slate-900 cursor-pointer ${
                    activeCategory === "DEV"
                      ? "bg-[#0707f2] text-white shadow-[3px_3px_0px_#0f172a] -translate-y-0.5"
                      : "bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Code2 className="w-4 h-4" />
                  <span>DEVELOPMENT</span>
                  <span className={`text-[10px] px-1.5 py-0.5 font-mono font-bold border ${activeCategory === "DEV" ? "bg-blue-900 text-white border-blue-400" : "bg-slate-100 text-slate-800 border-slate-400"}`}>
                    {devSorted.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveCategory("ALL")}
                  className={`w-full sm:w-auto px-4 sm:px-5 py-2.5 font-black text-xs sm:text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 border-2 sm:border-4 border-slate-900 cursor-pointer ${
                    activeCategory === "ALL"
                      ? "bg-slate-900 text-white shadow-[3px_3px_0px_#0f172a] -translate-y-0.5"
                      : "bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Zap className="w-4 h-4 text-[#FACC15]" />
                  <span>DUAL SCREEN</span>
                </button>
              </div>

              {/* Live Warrior Radar Search */}
              <div className="relative min-w-[260px] sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="arena-warrior-search"
                  name="warriorSearch"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="SEARCH BY NAME OR @HANDLE..."
                  autoComplete="off"
                  aria-label="Search warrior by name or handle"
                  className="w-full bg-slate-50 border-2 border-slate-900 pl-9 pr-8 py-2 text-xs sm:text-sm font-mono font-bold uppercase placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Row 2: League Tier Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] font-black uppercase text-slate-500 mr-1 flex items-center gap-1">
                  <Radar className="w-3.5 h-3.5 text-red-500 animate-spin" />
                  DIVISION TIER:
                </span>
                {(["ALL", "APEX", "DIAMOND", "CONTENDER"] as const).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setSelectedTier(tier)}
                    className={`px-3 py-1 font-mono font-black uppercase tracking-wider text-[11px] border border-slate-900 transition-all cursor-pointer ${
                      selectedTier === tier
                        ? "bg-slate-900 text-white shadow-[2px_2px_0px_#0f172a]"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {tier === "ALL"
                      ? "ALL RANKS"
                      : tier === "APEX"
                      ? "👑 APEX (#1-#3)"
                      : tier === "DIAMOND"
                      ? "💎 DIAMOND (#4-#10)"
                      : "⚡ CONTENDERS (#11+)"}
                  </button>
                ))}
              </div>

              <div className="font-mono text-[11px] text-slate-500 uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>
                  RADAR MATCHES:{" "}
                  <span className="font-black text-slate-900">
                    {activeCategory === "DSA"
                      ? filteredDsa.length
                      : activeCategory === "DEV"
                      ? filteredDev.length
                      : filteredDsa.length + filteredDev.length}
                  </span>{" "}
                  SIGNALS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── BATTLEGROUND CONTENT ── */}
        {isLoading ? (
          <div className="text-center text-slate-900 font-black text-2xl sm:text-4xl animate-pulse uppercase tracking-widest my-20 border-4 border-slate-900 p-12 bg-white brutalist-shadow">
            ⚔️ CALIBRATING DIVISION RADAR SENSORS...
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* ══════════════════════════════════════════════════════════════════════════════════ */}
            {/* 1. DEDICATED ALGORITHMS DIVISION VIEW */}
            {/* ══════════════════════════════════════════════════════════════════════════════════ */}
            {activeCategory === "DSA" && (
              <motion.div
                key="dsa-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-8"
              >
                {/* ── APEX PODIUM SHOWCASE (TOP 3) ── */}
                {!searchQuery && selectedTier === "ALL" && dsaSorted.length >= 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                      <div className="font-mono text-xs font-black uppercase text-red-600 flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        <span>ALGORITHMS APEX TRIO • THE CHAMPIONS PODIUM</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 uppercase hidden sm:inline">RANKS #1 - #3</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 sm:gap-4 md:gap-6 items-end justify-items-center pt-3 sm:pt-6">
                      {/* #2 Master Gladiator (Left) */}
                      {(() => {
                        const m = dsaSorted[1];
                        if (!m) return null;
                        const streak = getStreakBadge(m.current_streak || 0);
                        const gapToFirst = Math.ceil((dsaSorted[0]?.monthly_dsa_score || 0) - (m.monthly_dsa_score || 0));
                        const avatars = getCompetitorAvatars(m);
                        return (
                          <div className="order-1 flex flex-col items-center justify-end w-full">
                            <HoloCard
                              image={avatars.image}
                              fallbackImage={avatars.fallback}
                              alt={`${m.full_name} - Algorithms Rank 2`}
                              aspectRatio={PODIUM_CARD_RATIO}
                              width={310}
                              className="w-full max-w-[310px]"
                            >
                              {/* Top Bar */}
                              <div className="flex items-center justify-between gap-1">
                                <span className="bg-slate-200 text-slate-950 font-mono font-black text-[9px] sm:text-[11px] px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded shadow-md border border-slate-400">
                                  <span className="sm:hidden">🥈 #2</span>
                                  <span className="hidden sm:inline">🥈 RANK #2</span>
                                </span>
                                <span className="bg-black/70 backdrop-blur-md text-slate-300 border border-slate-600/50 text-[8px] sm:text-[10px] font-mono font-black px-1 sm:px-2 py-0.5 rounded uppercase hidden xs:inline sm:inline">
                                  RUNNER UP
                                </span>
                              </div>

                              {/* Unified Card Details Container */}
                              <div className="bg-slate-950/85 backdrop-blur-md border border-slate-700/80 rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 space-y-0.5 sm:space-y-1.5 shadow-2xl">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-1 sm:pb-1.5">
                                  <div className="min-w-0 flex-1">
                                    <div className="font-mono font-black text-[10px] sm:text-sm text-white uppercase truncate drop-shadow">
                                      {m.full_name}
                                    </div>
                                    <div className="font-mono text-[8px] sm:text-xs text-slate-400 font-bold truncate">
                                      @{m.handle}
                                    </div>
                                  </div>
                                  {streak && (
                                    <span className={`hidden sm:inline-block flex-shrink-0 text-[9px] font-mono px-2 py-0.5 rounded border border-slate-900 uppercase shadow-sm ${streak.style}`}>
                                      {streak.label} ({m.current_streak}d)
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-baseline justify-between">
                                  <span className="font-mono text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider">DSA XP</span>
                                  <span className="font-mono text-xs sm:text-xl font-black text-slate-100">{Math.floor(m.monthly_dsa_score || 0)}</span>
                                </div>
                                <div className="hidden sm:flex text-[10px] font-mono text-slate-300 justify-between">
                                  <span>SOLVED: <strong className="text-white font-bold">{m.monthly_problems_solved || 0}</strong></span>
                                  <span>LC:{m.monthly_leetcode || 0} • CF:{m.monthly_codeforces || 0}</span>
                                </div>
                                {gapToFirst > 0 && (
                                  <div className="hidden sm:block bg-slate-900/90 border border-slate-700 py-0.5 px-1 text-center font-mono text-[9px] font-bold text-slate-300 rounded">
                                    ▲ +{gapToFirst} XP TO DETHRONE #1
                                  </div>
                                )}
                                <Link
                                  to={`/profile/${m.handle}`}
                                  className="mt-0.5 sm:mt-1 block w-full text-center bg-white/10 hover:bg-white/20 text-white font-mono font-black text-[8px] sm:text-[11px] py-1 sm:py-1.5 uppercase rounded border border-white/20 transition-all hover:scale-[1.01]"
                                >
                                  <span className="sm:hidden">DOSSIER ↗</span>
                                  <span className="hidden sm:inline">VIEW DOSSIER ↗</span>
                                </Link>
                              </div>
                            </HoloCard>
                            <div className="w-full mt-1.5 sm:mt-2.5 bg-slate-200 border-2 border-slate-900 py-0.5 sm:py-1.5 text-center font-mono font-black text-[9px] sm:text-xs text-slate-800 shadow-[1px_1px_0px_#0f172a] sm:shadow-[2px_2px_0px_#0f172a]">
                              2ND PODIUM
                            </div>
                          </div>
                        );
                      })()}

                      {/* #1 Apex Legend (Center, Taller) */}
                      {(() => {
                        const m = dsaSorted[0];
                        if (!m) return null;
                        const streak = getStreakBadge(m.current_streak || 0);
                        const avatars = getCompetitorAvatars(m);
                        return (
                          <div className="order-2 flex flex-col items-center justify-end w-full -translate-y-2 sm:-translate-y-5 z-10">
                            <HoloCard
                              image={avatars.image}
                              fallbackImage={avatars.fallback}
                              alt={`${m.full_name} - Algorithms Rank 1`}
                              aspectRatio={PODIUM_CARD_RATIO}
                              width={335}
                              className="w-full max-w-[335px]"
                            >
                              {/* Top Bar */}
                              <div className="flex items-center justify-between gap-1">
                                <span className="bg-amber-400 text-slate-950 font-mono font-black text-[9px] sm:text-xs px-1.5 sm:px-3 py-0.5 sm:py-1 rounded shadow-lg flex items-center gap-1 sm:gap-1.5 border border-amber-300">
                                  <span>👑</span>
                                  <span className="sm:hidden">#1 APEX</span>
                                  <span className="hidden sm:inline">RANK #1 • APEX</span>
                                </span>
                                <span className="bg-black/70 backdrop-blur-md text-amber-300 border border-amber-400/50 text-[8px] sm:text-[10px] font-mono font-black px-1 sm:px-2 py-0.5 rounded uppercase hidden xs:inline sm:inline">
                                  CHAMPION
                                </span>
                              </div>

                              {/* Unified Card Details Container */}
                              <div className="bg-slate-950/90 backdrop-blur-md border border-amber-400/40 rounded-lg sm:rounded-xl p-1.5 sm:p-3 space-y-0.5 sm:space-y-1.5 shadow-2xl">
                                <div className="flex items-center justify-between border-b border-amber-400/20 pb-1 sm:pb-1.5">
                                  <div className="min-w-0 flex-1">
                                    <div className="font-mono font-black text-[10px] sm:text-base text-white uppercase truncate drop-shadow flex items-center gap-1 sm:gap-1.5">
                                      <span>👑</span>
                                      <span className="truncate">{m.full_name}</span>
                                    </div>
                                    <div className="font-mono text-[8px] sm:text-xs text-amber-300 font-bold truncate">
                                      @{m.handle}
                                    </div>
                                  </div>
                                  {streak && (
                                    <span className={`hidden sm:inline-block flex-shrink-0 text-[10px] font-mono px-2 py-0.5 rounded border border-amber-400/60 uppercase shadow-md ${streak.style}`}>
                                      {streak.label} ({m.current_streak}d)
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-baseline justify-between">
                                  <span className="font-mono text-[8px] sm:text-[10px] font-black text-amber-300 uppercase tracking-wider">APEX DSA XP</span>
                                  <span className="font-mono text-sm sm:text-2xl font-black text-amber-400 drop-shadow">{Math.floor(m.monthly_dsa_score || 0)}</span>
                                </div>
                                <div className="hidden sm:flex text-[10px] font-mono text-slate-300 justify-between">
                                  <span>SOLVED: <strong className="text-amber-300 font-bold">{m.monthly_problems_solved || 0}</strong></span>
                                  <span>LC:{m.monthly_leetcode || 0} • CF:{m.monthly_codeforces || 0}</span>
                                </div>
                                <Link
                                  to={`/profile/${m.handle}`}
                                  className="mt-0.5 sm:mt-1 block w-full text-center bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono font-black text-[8px] sm:text-[11px] py-1 sm:py-1.5 uppercase rounded border border-amber-300 transition-all shadow-[0_4px_12px_rgba(250,204,21,0.4)] hover:scale-[1.01]"
                                >
                                  <span className="sm:hidden">DOSSIER ↗</span>
                                  <span className="hidden sm:inline">INSPECT CHAMPION ↗</span>
                                </Link>
                              </div>
                            </HoloCard>
                            <div className="w-full mt-1.5 sm:mt-2.5 bg-amber-400 border-2 border-slate-900 py-1.5 sm:py-2.5 text-center font-mono font-black text-[10px] sm:text-sm text-slate-950 shadow-[1px_1px_0px_#0f172a] sm:shadow-[3px_3px_0px_#0f172a] flex items-center justify-center gap-1">
                              <span>👑</span>
                              <span>1ST APEX</span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* #3 Master Warrior (Right) */}
                      {(() => {
                        const m = dsaSorted[2];
                        if (!m) return null;
                        const streak = getStreakBadge(m.current_streak || 0);
                        const gapToSecond = Math.ceil((dsaSorted[1]?.monthly_dsa_score || 0) - (m.monthly_dsa_score || 0));
                        const avatars = getCompetitorAvatars(m);
                        return (
                          <div className="order-3 flex flex-col items-center justify-end w-full">
                            <HoloCard
                              image={avatars.image}
                              fallbackImage={avatars.fallback}
                              alt={`${m.full_name} - Algorithms Rank 3`}
                              aspectRatio={PODIUM_CARD_RATIO}
                              width={310}
                              className="w-full max-w-[310px]"
                            >
                              {/* Top Bar */}
                              <div className="flex items-center justify-between gap-1">
                                <span className="bg-amber-600 text-white font-mono font-black text-[9px] sm:text-[11px] px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded shadow-md border border-amber-500">
                                  <span className="sm:hidden">🥉 #3</span>
                                  <span className="hidden sm:inline">🥉 RANK #3</span>
                                </span>
                                <span className="bg-black/70 backdrop-blur-md text-amber-300 border border-amber-700/50 text-[8px] sm:text-[10px] font-mono font-black px-1 sm:px-2 py-0.5 rounded uppercase hidden xs:inline sm:inline">
                                  PODIUM
                                </span>
                              </div>

                              {/* Unified Card Details Container */}
                              <div className="bg-slate-950/85 backdrop-blur-md border border-amber-900/60 rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 space-y-0.5 sm:space-y-1.5 shadow-2xl">
                                <div className="flex items-center justify-between border-b border-amber-950 pb-1 sm:pb-1.5">
                                  <div className="min-w-0 flex-1">
                                    <div className="font-mono font-black text-[10px] sm:text-sm text-white uppercase truncate drop-shadow">
                                      {m.full_name}
                                    </div>
                                    <div className="font-mono text-[8px] sm:text-xs text-amber-200/90 font-bold truncate">
                                      @{m.handle}
                                    </div>
                                  </div>
                                  {streak && (
                                    <span className={`hidden sm:inline-block flex-shrink-0 text-[9px] font-mono px-2 py-0.5 rounded border border-slate-900 uppercase shadow-md ${streak.style}`}>
                                      {streak.label} ({m.current_streak}d)
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-baseline justify-between">
                                  <span className="font-mono text-[8px] sm:text-[10px] font-black text-amber-200/70 uppercase tracking-wider">DSA XP</span>
                                  <span className="font-mono text-xs sm:text-xl font-black text-amber-400">{Math.floor(m.monthly_dsa_score || 0)}</span>
                                </div>
                                <div className="hidden sm:flex text-[10px] font-mono text-slate-300 justify-between">
                                  <span>SOLVED: <strong className="text-white font-bold">{m.monthly_problems_solved || 0}</strong></span>
                                  <span>LC:{m.monthly_leetcode || 0} • CF:{m.monthly_codeforces || 0}</span>
                                </div>
                                {gapToSecond > 0 && (
                                  <div className="hidden sm:block bg-amber-950/60 border border-amber-800/60 py-0.5 px-1 text-center font-mono text-[9px] font-bold text-amber-300 rounded">
                                    ▲ +{gapToSecond} XP TO OVERTAKE #2
                                  </div>
                                )}
                                <Link
                                  to={`/profile/${m.handle}`}
                                  className="mt-0.5 sm:mt-1 block w-full text-center bg-white/10 hover:bg-white/20 text-white font-mono font-black text-[8px] sm:text-[11px] py-1 sm:py-1.5 uppercase rounded border border-white/20 transition-all hover:scale-[1.01]"
                                >
                                  <span className="sm:hidden">DOSSIER ↗</span>
                                  <span className="hidden sm:inline">VIEW DOSSIER ↗</span>
                                </Link>
                              </div>
                            </HoloCard>
                            <div className="w-full mt-1.5 sm:mt-2.5 bg-amber-600 text-white border-2 border-slate-900 py-0.5 sm:py-1 text-center font-mono font-black text-[8px] sm:text-[11px] shadow-[1px_1px_0px_#0f172a] sm:shadow-[2px_2px_0px_#0f172a]">
                              3RD PODIUM
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* ── ALGORITHMS DIVISION BATTLE ROSTER ── */}
                {(() => {
                  const isPodiumActive = !searchQuery && selectedTier === "ALL";
                  const rosterList = isPodiumActive ? filteredDsa.filter((m) => m.rank > 3) : filteredDsa;
                  const totalPages = Math.max(1, Math.ceil(rosterList.length / itemsPerPage));
                  const currentPage = Math.min(dsaPage, totalPages);
                  const pagedWarriors = rosterList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                  const leaderScore = dsaSorted[0]?.monthly_dsa_score || 1;

                  return (
                    <div ref={dsaRosterRef} className="border-4 border-slate-900 bg-white brutalist-shadow scroll-mt-24">
                      {/* Section Header */}
                      <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b-4 border-slate-900">
                        <div className="flex items-center gap-3">
                          <span className="p-2 bg-red-600 text-white border border-red-400">
                            <Swords className="w-5 h-5" />
                          </span>
                          <div>
                            <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tight">
                              ALGORITHMS DIVISION ROSTER
                            </h3>
                            <p className="font-mono text-[10px] sm:text-xs text-slate-400">
                              {isPodiumActive ? `RANKS #4 AND BELOW • COMBAT ARENA LADDER` : `FILTERED COMBATANTS • ${rosterList.length} MATCHES`}
                            </p>
                          </div>
                        </div>

                        <span className="font-mono text-xs font-black bg-red-500 text-white px-3 py-1 uppercase border border-red-400">
                          {rosterList.length} WARRIORS
                        </span>
                      </div>

                      {/* Roster Table List */}
                      {pagedWarriors.length === 0 ? (
                        <div className="p-12 text-center space-y-3 font-mono">
                          <Radar className="w-10 h-10 text-slate-400 mx-auto animate-pulse" />
                          <div className="text-base font-black text-slate-800 uppercase">NO COMBATANT FOUND IN RADAR</div>
                          <div className="text-xs text-slate-500">No algorithm warriors match the active filter criteria.</div>
                          <button
                            onClick={() => {
                              setSearchQuery("");
                              setSelectedTier("ALL");
                            }}
                            className="bg-slate-900 text-white px-4 py-1.5 text-xs font-bold uppercase border-2 border-slate-900 hover:bg-red-600 transition-colors"
                          >
                            RESET FILTERS
                          </button>
                        </div>
                      ) : (
                        <div className="divide-y border-t border-slate-200">
                          {pagedWarriors.map((member) => {
                            const rank = member.rank;
                            const powerPercent = Math.min(100, Math.round(((member.monthly_dsa_score || 0) / leaderScore) * 100));
                            
                            // Threat Radar: Gap to overtake warrior directly ahead in original list
                            const originalIdx = dsaSorted.findIndex((x) => x.member_id === member.member_id);
                            const prevMember = originalIdx > 0 ? dsaSorted[originalIdx - 1] : null;
                            const xpGap = prevMember ? Math.ceil((prevMember.monthly_dsa_score || 0) - (member.monthly_dsa_score || 0) + 1) : 0;

                            const rankDisplay = rank < 10 ? `#0${rank}` : `#${rank}`;
                            const rankBadgeBg =
                              rank === 1
                                ? "bg-amber-400 text-slate-950 font-black border-slate-900"
                                : rank === 2
                                ? "bg-slate-300 text-slate-950 font-bold border-slate-900"
                                : rank === 3
                                ? "bg-amber-600 text-white font-bold border-slate-900"
                                : rank <= 10
                                ? "bg-slate-900 text-white font-bold border-slate-900 shadow-[2px_2px_0px_#0f172a]"
                                : "bg-slate-100 text-slate-700 font-semibold border-slate-300 group-hover:border-slate-900 transition-colors";

                            const titleInfo = getRankTitle(rank);

                            return (
                              <Link
                                key={member.member_id}
                                to={`/profile/${member.handle}`}
                                className="block p-3 sm:px-5 sm:py-4 bg-white hover:bg-slate-50 border-l-4 border-transparent hover:border-red-600 transition-all duration-150 group cursor-pointer"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                                  {/* Left: Rank & Identity */}
                                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                    {/* Rank Number Badge */}
                                    <div className={`w-10 h-10 border-2 flex items-center justify-center font-mono text-xs sm:text-sm flex-shrink-0 ${rankBadgeBg}`}>
                                      {rankDisplay}
                                    </div>

                                    {/* Avatar */}
                                    <div className="w-10 h-10 border-2 border-slate-900 bg-slate-100 overflow-hidden flex items-center justify-center font-black text-sm flex-shrink-0 shadow-[2px_2px_0px_#0f172a] group-hover:translate-x-0.5 transition-transform">
                                      <AvatarImage url={member.avatar_url} handle={member.handle} name={member.full_name} />
                                    </div>

                                    {/* Name & Title */}
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-bold text-sm sm:text-base uppercase text-slate-900 truncate group-hover:text-red-600 transition-colors tracking-tight">
                                          {member.full_name}
                                        </span>
                                        <span className={`text-[10px] font-mono px-1.5 py-0.2 border ${titleInfo.color}`}>
                                          {titleInfo.title}
                                        </span>
                                        {member.current_streak && member.current_streak >= 3 ? (
                                          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-1.5 py-0.2 border border-slate-900 bg-white text-slate-900 shadow-[1px_1px_0px_#0f172a]">
                                            <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                                            <span>{member.current_streak}D STREAK</span>
                                          </span>
                                        ) : null}
                                      </div>

                                      {/* Subline: Solved counts & Platform chips */}
                                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-slate-600 mt-1">
                                        <span className="font-bold text-slate-900">
                                          {member.monthly_problems_solved || 0} Solved
                                        </span>
                                        <span className="text-slate-300">•</span>
                                        <span className="bg-slate-100 px-1.5 py-0.2 border border-slate-300 font-medium text-slate-700">LC {member.monthly_leetcode || 0}</span>
                                        <span className="bg-slate-100 px-1.5 py-0.2 border border-slate-300 font-medium text-slate-700">CF {member.monthly_codeforces || 0}</span>
                                        <span className="bg-slate-100 px-1.5 py-0.2 border border-slate-300 font-medium text-slate-700">CC {member.monthly_codechef || 0}</span>
                                        <span className="bg-slate-100 px-1.5 py-0.2 border border-slate-300 font-medium text-slate-700">GFG {member.monthly_gfg || 0}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right: Power Gauge + Threat Radar + Score */}
                                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-shrink-0">
                                    {/* Threat Radar Pill */}
                                    {rank > 1 && xpGap > 0 && (
                                      <div className="hidden lg:flex flex-col items-end min-w-[85px]">
                                        <span className="font-mono text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                          GAP TO #{rank - 1}
                                        </span>
                                        <span className="font-mono text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 border border-red-200">
                                          +{xpGap} XP
                                        </span>
                                      </div>
                                    )}

                                    {/* Laser Power Gauge */}
                                    <div className="w-20 hidden md:block">
                                      <div className="flex justify-between font-mono text-[9px] text-slate-400 mb-0.5 font-bold">
                                        <span>PACE</span>
                                        <span>{powerPercent}%</span>
                                      </div>
                                      <div className="w-full h-1.5 bg-slate-100 border border-slate-300 overflow-hidden">
                                        <div
                                          className="h-full bg-red-600"
                                          style={{ width: `${powerPercent}%` }}
                                        />
                                      </div>
                                    </div>

                                    {/* Big XP Score */}
                                    <div className="text-right min-w-[72px]">
                                      <div className="font-mono font-black text-xl sm:text-2xl text-slate-900 leading-none tabular-nums">
                                        {Math.floor(member.monthly_dsa_score || 0)}
                                      </div>
                                      <div className="font-mono text-[9px] font-bold text-red-600 uppercase tracking-wider mt-0.5">DSA XP</div>
                                    </div>

                                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition-transform hidden sm:block" />
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="bg-slate-50 p-4 border-t-2 border-slate-900 flex items-center justify-between">
                          <button
                            disabled={currentPage <= 1}
                            onClick={() => {
                              setDsaPage((p) => Math.max(1, p - 1));
                              scrollToDsaList();
                            }}
                            className="bg-white border-2 border-slate-900 px-3 py-1.5 font-mono text-xs font-black uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors flex items-center gap-1 shadow-[2px_2px_0px_#0f172a]"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            PREV
                          </button>

                          <span className="font-mono text-xs font-bold text-slate-700">
                            PAGE <span className="font-black text-slate-900">{currentPage}</span> OF {totalPages}
                          </span>

                          <button
                            disabled={currentPage >= totalPages}
                            onClick={() => {
                              setDsaPage((p) => Math.min(totalPages, p + 1));
                              scrollToDsaList();
                            }}
                            className="bg-white border-2 border-slate-900 px-3 py-1.5 font-mono text-xs font-black uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors flex items-center gap-1 shadow-[2px_2px_0px_#0f172a]"
                          >
                            NEXT
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════════════════ */}
            {/* 2. DEDICATED DEVELOPMENT DIVISION VIEW */}
            {/* ══════════════════════════════════════════════════════════════════════════════════ */}
            {activeCategory === "DEV" && (
              <motion.div
                key="dev-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-8"
              >
                {/* ── APEX PODIUM SHOWCASE (TOP 3) ── */}
                {!searchQuery && selectedTier === "ALL" && devSorted.length >= 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                      <div className="font-mono text-xs font-black uppercase text-blue-600 flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        <span>DEVELOPMENT APEX TRIO • THE CHAMPIONS PODIUM</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 uppercase hidden sm:inline">RANKS #1 - #3</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 sm:gap-4 md:gap-6 items-end justify-items-center pt-3 sm:pt-6">
                      {/* #2 Master Gladiator (Left) */}
                      {(() => {
                        const m = devSorted[1];
                        if (!m) return null;
                        const streak = getStreakBadge(m.current_streak || 0);
                        const gapToFirst = Math.ceil((devSorted[0]?.monthly_dev_score || 0) - (m.monthly_dev_score || 0));
                        const avatars = getCompetitorAvatars(m);
                        return (
                          <div className="order-1 flex flex-col items-center justify-end w-full">
                            <HoloCard
                              image={avatars.image}
                              fallbackImage={avatars.fallback}
                              alt={`${m.full_name} - Development Rank 2`}
                              aspectRatio={PODIUM_CARD_RATIO}
                              width={310}
                              className="w-full max-w-[310px]"
                            >
                              {/* Top Bar */}
                              <div className="flex items-center justify-between gap-1">
                                <span className="bg-slate-200 text-slate-950 font-mono font-black text-[9px] sm:text-[11px] px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded shadow-md border border-slate-400">
                                  <span className="sm:hidden">🥈 #2</span>
                                  <span className="hidden sm:inline">🥈 RANK #2</span>
                                </span>
                                <span className="bg-black/70 backdrop-blur-md text-slate-300 border border-slate-600/50 text-[8px] sm:text-[10px] font-mono font-black px-1 sm:px-2 py-0.5 rounded uppercase hidden xs:inline sm:inline">
                                  RUNNER UP
                                </span>
                              </div>

                              {/* Unified Card Details Container */}
                              <div className="bg-slate-950/85 backdrop-blur-md border border-slate-700/80 rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 space-y-0.5 sm:space-y-1.5 shadow-2xl">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-1 sm:pb-1.5">
                                  <div className="min-w-0 flex-1">
                                    <div className="font-mono font-black text-[10px] sm:text-sm text-white uppercase truncate drop-shadow">
                                      {m.full_name}
                                    </div>
                                    <div className="font-mono text-[8px] sm:text-xs text-slate-400 font-bold truncate">
                                      @{m.handle}
                                    </div>
                                  </div>
                                  {streak && (
                                    <span className={`hidden sm:inline-block flex-shrink-0 text-[9px] font-mono px-2 py-0.5 rounded border border-slate-900 uppercase shadow-sm ${streak.style}`}>
                                      {streak.label} ({m.current_streak}d)
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-baseline justify-between">
                                  <span className="font-mono text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider">DEV XP</span>
                                  <span className="font-mono text-xs sm:text-xl font-black text-slate-100">{Math.floor(m.monthly_dev_score || 0)}</span>
                                </div>
                                <div className="hidden sm:flex text-[10px] font-mono text-slate-300 justify-between">
                                  <span>COMMITS: <strong className="text-white font-bold">{m.monthly_commits || 0}</strong></span>
                                  <span>PRS: <strong className="text-white font-bold">{m.monthly_prs || 0}</strong></span>
                                </div>
                                {gapToFirst > 0 && (
                                  <div className="hidden sm:block bg-slate-900/90 border border-slate-700 py-0.5 px-1 text-center font-mono text-[9px] font-bold text-slate-300 rounded">
                                    ▲ +{gapToFirst} XP TO DETHRONE #1
                                  </div>
                                )}
                                <Link
                                  to={`/profile/${m.handle}`}
                                  className="mt-0.5 sm:mt-1 block w-full text-center bg-white/10 hover:bg-white/20 text-white font-mono font-black text-[8px] sm:text-[11px] py-1 sm:py-1.5 uppercase rounded border border-white/20 transition-all hover:scale-[1.01]"
                                >
                                  <span className="sm:hidden">DOSSIER ↗</span>
                                  <span className="hidden sm:inline">VIEW DOSSIER ↗</span>
                                </Link>
                              </div>
                            </HoloCard>
                            <div className="w-full mt-1.5 sm:mt-2.5 bg-slate-200 border-2 border-slate-900 py-0.5 sm:py-1.5 text-center font-mono font-black text-[9px] sm:text-xs text-slate-800 shadow-[1px_1px_0px_#0f172a] sm:shadow-[2px_2px_0px_#0f172a]">
                              2ND PODIUM
                            </div>
                          </div>
                        );
                      })()}

                      {/* #1 Apex Legend (Center, Taller) */}
                      {(() => {
                        const m = devSorted[0];
                        if (!m) return null;
                        const streak = getStreakBadge(m.current_streak || 0);
                        const avatars = getCompetitorAvatars(m);
                        return (
                          <div className="order-2 flex flex-col items-center justify-end w-full -translate-y-2 sm:-translate-y-5 z-10">
                            <HoloCard
                              image={avatars.image}
                              fallbackImage={avatars.fallback}
                              alt={`${m.full_name} - Development Rank 1`}
                              aspectRatio={PODIUM_CARD_RATIO}
                              width={335}
                              className="w-full max-w-[335px]"
                            >
                              {/* Top Bar */}
                              <div className="flex items-center justify-between gap-1">
                                <span className="bg-amber-400 text-slate-950 font-mono font-black text-[9px] sm:text-xs px-1.5 sm:px-3 py-0.5 sm:py-1 rounded shadow-lg flex items-center gap-1 sm:gap-1.5 border border-amber-300">
                                  <span>👑</span>
                                  <span className="sm:hidden">#1 APEX</span>
                                  <span className="hidden sm:inline">RANK #1 • APEX</span>
                                </span>
                                <span className="bg-black/70 backdrop-blur-md text-amber-300 border border-amber-400/50 text-[8px] sm:text-[10px] font-mono font-black px-1 sm:px-2 py-0.5 rounded uppercase hidden xs:inline sm:inline">
                                  CHAMPION
                                </span>
                              </div>

                              {/* Unified Card Details Container */}
                              <div className="bg-slate-950/90 backdrop-blur-md border border-amber-400/40 rounded-lg sm:rounded-xl p-1.5 sm:p-3 space-y-0.5 sm:space-y-1.5 shadow-2xl">
                                <div className="flex items-center justify-between border-b border-amber-400/20 pb-1 sm:pb-1.5">
                                  <div className="min-w-0 flex-1">
                                    <div className="font-mono font-black text-[10px] sm:text-base text-white uppercase truncate drop-shadow flex items-center gap-1 sm:gap-1.5">
                                      <span>👑</span>
                                      <span className="truncate">{m.full_name}</span>
                                    </div>
                                    <div className="font-mono text-[8px] sm:text-xs text-amber-300 font-bold truncate">
                                      @{m.handle}
                                    </div>
                                  </div>
                                  {streak && (
                                    <span className={`hidden sm:inline-block flex-shrink-0 text-[10px] font-mono px-2 py-0.5 rounded border border-amber-400/60 uppercase shadow-md ${streak.style}`}>
                                      {streak.label} ({m.current_streak}d)
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-baseline justify-between">
                                  <span className="font-mono text-[8px] sm:text-[10px] font-black text-amber-300 uppercase tracking-wider">APEX DEV XP</span>
                                  <span className="font-mono text-sm sm:text-2xl font-black text-amber-400 drop-shadow">{Math.floor(m.monthly_dev_score || 0)}</span>
                                </div>
                                <div className="hidden sm:flex text-[10px] font-mono text-slate-300 justify-between">
                                  <span>COMMITS: <strong className="text-amber-300 font-bold">{m.monthly_commits || 0}</strong></span>
                                  <span>PRS: <strong className="text-amber-300 font-bold">{m.monthly_prs || 0}</strong></span>
                                </div>
                                <Link
                                  to={`/profile/${m.handle}`}
                                  className="mt-0.5 sm:mt-1 block w-full text-center bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono font-black text-[8px] sm:text-[11px] py-1 sm:py-1.5 uppercase rounded border border-amber-300 transition-all shadow-[0_4px_12px_rgba(250,204,21,0.4)] hover:scale-[1.01]"
                                >
                                  <span className="sm:hidden">DOSSIER ↗</span>
                                  <span className="hidden sm:inline">INSPECT CHAMPION ↗</span>
                                </Link>
                              </div>
                            </HoloCard>
                            <div className="w-full mt-1.5 sm:mt-2.5 bg-amber-400 border-2 border-slate-900 py-1.5 sm:py-2.5 text-center font-mono font-black text-[10px] sm:text-sm text-slate-950 shadow-[1px_1px_0px_#0f172a] sm:shadow-[3px_3px_0px_#0f172a] flex items-center justify-center gap-1">
                              <span>👑</span>
                              <span>1ST APEX</span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* #3 Master Warrior (Right) */}
                      {(() => {
                        const m = devSorted[2];
                        if (!m) return null;
                        const streak = getStreakBadge(m.current_streak || 0);
                        const gapToSecond = Math.ceil((devSorted[1]?.monthly_dev_score || 0) - (m.monthly_dev_score || 0));
                        const avatars = getCompetitorAvatars(m);
                        return (
                          <div className="order-3 flex flex-col items-center justify-end w-full">
                            <HoloCard
                              image={avatars.image}
                              fallbackImage={avatars.fallback}
                              alt={`${m.full_name} - Development Rank 3`}
                              aspectRatio={PODIUM_CARD_RATIO}
                              width={310}
                              className="w-full max-w-[310px]"
                            >
                              {/* Top Bar */}
                              <div className="flex items-center justify-between gap-1">
                                <span className="bg-amber-600 text-white font-mono font-black text-[9px] sm:text-[11px] px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded shadow-md border border-amber-500">
                                  <span className="sm:hidden">🥉 #3</span>
                                  <span className="hidden sm:inline">🥉 RANK #3</span>
                                </span>
                                <span className="bg-black/70 backdrop-blur-md text-amber-300 border border-amber-700/50 text-[8px] sm:text-[10px] font-mono font-black px-1 sm:px-2 py-0.5 rounded uppercase hidden xs:inline sm:inline">
                                  PODIUM
                                </span>
                              </div>

                              {/* Unified Card Details Container */}
                              <div className="bg-slate-950/85 backdrop-blur-md border border-amber-900/60 rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 space-y-0.5 sm:space-y-1.5 shadow-2xl">
                                <div className="flex items-center justify-between border-b border-amber-950 pb-1 sm:pb-1.5">
                                  <div className="min-w-0 flex-1">
                                    <div className="font-mono font-black text-[10px] sm:text-sm text-white uppercase truncate drop-shadow">
                                      {m.full_name}
                                    </div>
                                    <div className="font-mono text-[8px] sm:text-xs text-amber-200/90 font-bold truncate">
                                      @{m.handle}
                                    </div>
                                  </div>
                                  {streak && (
                                    <span className={`hidden sm:inline-block flex-shrink-0 text-[9px] font-mono px-2 py-0.5 rounded border border-slate-900 uppercase shadow-md ${streak.style}`}>
                                      {streak.label} ({m.current_streak}d)
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-baseline justify-between">
                                  <span className="font-mono text-[8px] sm:text-[10px] font-black text-amber-200/70 uppercase tracking-wider">DEV XP</span>
                                  <span className="font-mono text-xs sm:text-xl font-black text-amber-400">{Math.floor(m.monthly_dev_score || 0)}</span>
                                </div>
                                <div className="hidden sm:flex text-[10px] font-mono text-slate-300 justify-between">
                                  <span>COMMITS: <strong className="text-white font-bold">{m.monthly_commits || 0}</strong></span>
                                  <span>PRS: <strong className="text-white font-bold">{m.monthly_prs || 0}</strong></span>
                                </div>
                                {gapToSecond > 0 && (
                                  <div className="hidden sm:block bg-amber-950/60 border border-amber-800/60 py-0.5 px-1 text-center font-mono text-[9px] font-bold text-amber-300 rounded">
                                    ▲ +{gapToSecond} XP TO OVERTAKE #2
                                  </div>
                                )}
                                <Link
                                  to={`/profile/${m.handle}`}
                                  className="mt-0.5 sm:mt-1 block w-full text-center bg-white/10 hover:bg-white/20 text-white font-mono font-black text-[8px] sm:text-[11px] py-1 sm:py-1.5 uppercase rounded border border-white/20 transition-all hover:scale-[1.01]"
                                >
                                  <span className="sm:hidden">DOSSIER ↗</span>
                                  <span className="hidden sm:inline">VIEW DOSSIER ↗</span>
                                </Link>
                              </div>
                            </HoloCard>
                            <div className="w-full mt-1.5 sm:mt-2.5 bg-amber-600 text-white border-2 border-slate-900 py-0.5 sm:py-1 text-center font-mono font-black text-[8px] sm:text-[11px] shadow-[1px_1px_0px_#0f172a] sm:shadow-[2px_2px_0px_#0f172a]">
                              3RD PODIUM
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* ── DEVELOPMENT DIVISION BATTLE ROSTER ── */}
                {(() => {
                  const isPodiumActive = !searchQuery && selectedTier === "ALL";
                  const rosterList = isPodiumActive ? filteredDev.filter((m) => m.rank > 3) : filteredDev;
                  const totalPages = Math.max(1, Math.ceil(rosterList.length / itemsPerPage));
                  const currentPage = Math.min(devPage, totalPages);
                  const pagedWarriors = rosterList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                  const leaderScore = devSorted[0]?.monthly_dev_score || 1;

                  return (
                    <div ref={devRosterRef} className="border-4 border-slate-900 bg-white brutalist-shadow">
                      {/* Section Header */}
                      <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b-4 border-slate-900">
                        <div className="flex items-center gap-3">
                          <span className="p-2 bg-blue-600 text-white border border-blue-400">
                            <Code2 className="w-5 h-5" />
                          </span>
                          <div>
                            <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tight">
                              DEVELOPMENT DIVISION ROSTER
                            </h3>
                            <p className="font-mono text-[10px] sm:text-xs text-slate-400">
                              {isPodiumActive ? `RANKS #4 AND BELOW • COMBAT ARENA LADDER` : `FILTERED COMBATANTS • ${rosterList.length} MATCHES`}
                            </p>
                          </div>
                        </div>

                        <span className="font-mono text-xs font-black bg-blue-600 text-white px-3 py-1 uppercase border border-blue-400">
                          {rosterList.length} WARRIORS
                        </span>
                      </div>

                      {/* Roster Table List */}
                      {pagedWarriors.length === 0 ? (
                        <div className="p-12 text-center space-y-3 font-mono">
                          <Radar className="w-10 h-10 text-slate-400 mx-auto animate-pulse" />
                          <div className="text-base font-black text-slate-800 uppercase">NO COMBATANT FOUND IN RADAR</div>
                          <div className="text-xs text-slate-500">No development warriors match the active filter criteria.</div>
                          <button
                            onClick={() => {
                              setSearchQuery("");
                              setSelectedTier("ALL");
                            }}
                            className="bg-slate-900 text-white px-4 py-1.5 text-xs font-bold uppercase border-2 border-slate-900 hover:bg-blue-600 transition-colors"
                          >
                            RESET FILTERS
                          </button>
                        </div>
                      ) : (
                        <div className="divide-y border-t border-slate-200">
                          {pagedWarriors.map((member) => {
                            const rank = member.rank;
                            const powerPercent = Math.min(100, Math.round(((member.monthly_dev_score || 0) / leaderScore) * 100));

                            // Threat Radar: Gap to overtake warrior directly ahead in original list
                            const originalIdx = devSorted.findIndex((x) => x.member_id === member.member_id);
                            const prevMember = originalIdx > 0 ? devSorted[originalIdx - 1] : null;
                            const xpGap = prevMember ? Math.ceil((prevMember.monthly_dev_score || 0) - (member.monthly_dev_score || 0) + 1) : 0;

                            const rankDisplay = rank < 10 ? `#0${rank}` : `#${rank}`;
                            const rankBadgeBg =
                              rank === 1
                                ? "bg-amber-400 text-slate-950 font-black border-slate-900"
                                : rank === 2
                                ? "bg-slate-300 text-slate-950 font-bold border-slate-900"
                                : rank === 3
                                ? "bg-amber-600 text-white font-bold border-slate-900"
                                : rank <= 10
                                ? "bg-slate-900 text-white font-bold border-slate-900 shadow-[2px_2px_0px_#0f172a]"
                                : "bg-slate-100 text-slate-700 font-semibold border-slate-300 group-hover:border-slate-900 transition-colors";

                            const titleInfo = getRankTitle(rank);

                            return (
                              <Link
                                key={member.member_id}
                                to={`/profile/${member.handle}`}
                                className="block p-3 sm:px-5 sm:py-4 bg-white hover:bg-slate-50 border-l-4 border-transparent hover:border-blue-600 transition-all duration-150 group cursor-pointer"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                                  {/* Left: Rank & Identity */}
                                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                    {/* Rank Number Badge */}
                                    <div className={`w-10 h-10 border-2 flex items-center justify-center font-mono text-xs sm:text-sm flex-shrink-0 ${rankBadgeBg}`}>
                                      {rankDisplay}
                                    </div>

                                    {/* Avatar */}
                                    <div className="w-10 h-10 border-2 border-slate-900 bg-slate-100 overflow-hidden flex items-center justify-center font-black text-sm flex-shrink-0 shadow-[2px_2px_0px_#0f172a] group-hover:translate-x-0.5 transition-transform">
                                      <AvatarImage url={member.avatar_url} handle={member.handle} name={member.full_name} />
                                    </div>

                                    {/* Name & Title */}
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-bold text-sm sm:text-base uppercase text-slate-900 truncate group-hover:text-blue-600 transition-colors tracking-tight">
                                          {member.full_name}
                                        </span>
                                        <span className={`text-[10px] font-mono px-1.5 py-0.2 border ${titleInfo.color}`}>
                                          {titleInfo.title}
                                        </span>
                                        {member.current_streak && member.current_streak >= 3 ? (
                                          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-1.5 py-0.2 border border-slate-900 bg-white text-slate-900 shadow-[1px_1px_0px_#0f172a]">
                                            <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                                            <span>{member.current_streak}D STREAK</span>
                                          </span>
                                        ) : null}
                                      </div>

                                      {/* Subline: Commits & PRs */}
                                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-slate-600 mt-1">
                                        <span className="font-bold text-slate-900 flex items-center gap-1">
                                          <GitCommit className="w-3.5 h-3.5 text-blue-600" />
                                          {member.monthly_commits || 0} Commits
                                        </span>
                                        <span className="text-slate-300">•</span>
                                        <span className="bg-blue-50 px-1.5 py-0.2 border border-blue-200 font-semibold text-blue-900 flex items-center gap-1">
                                          <GitPullRequest className="w-3.5 h-3.5 text-purple-600" />
                                          {member.monthly_prs || 0} PRs
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right: Power Gauge + Threat Radar + Score */}
                                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-shrink-0">
                                    {/* Threat Radar Pill */}
                                    {rank > 1 && xpGap > 0 && (
                                      <div className="hidden lg:flex flex-col items-end min-w-[85px]">
                                        <span className="font-mono text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                          GAP TO #{rank - 1}
                                        </span>
                                        <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 border border-blue-200">
                                          +{xpGap} XP
                                        </span>
                                      </div>
                                    )}

                                    {/* Laser Power Gauge */}
                                    <div className="w-20 hidden md:block">
                                      <div className="flex justify-between font-mono text-[9px] text-slate-400 mb-0.5 font-bold">
                                        <span>PACE</span>
                                        <span>{powerPercent}%</span>
                                      </div>
                                      <div className="w-full h-1.5 bg-slate-100 border border-slate-300 overflow-hidden">
                                        <div
                                          className="h-full bg-blue-600"
                                          style={{ width: `${powerPercent}%` }}
                                        />
                                      </div>
                                    </div>

                                    {/* Big XP Score */}
                                    <div className="text-right min-w-[72px]">
                                      <div className="font-mono font-black text-xl sm:text-2xl text-slate-900 leading-none tabular-nums">
                                        {Math.floor(member.monthly_dev_score || 0)}
                                      </div>
                                      <div className="font-mono text-[9px] font-bold text-blue-600 uppercase tracking-wider mt-0.5">DEV XP</div>
                                    </div>

                                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition-transform hidden sm:block" />
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="bg-slate-50 p-4 border-t-2 border-slate-900 flex items-center justify-between">
                          <button
                            disabled={currentPage <= 1}
                            onClick={() => {
                              setDevPage((p) => Math.max(1, p - 1));
                              scrollToDevList();
                            }}
                            className="bg-white border-2 border-slate-900 px-3 py-1.5 font-mono text-xs font-black uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors flex items-center gap-1 shadow-[2px_2px_0px_#0f172a]"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            PREV
                          </button>

                          <span className="font-mono text-xs font-bold text-slate-700">
                            PAGE <span className="font-black text-slate-900">{currentPage}</span> OF {totalPages}
                          </span>

                          <button
                            disabled={currentPage >= totalPages}
                            onClick={() => {
                              setDevPage((p) => Math.min(totalPages, p + 1));
                              scrollToDevList();
                            }}
                            className="bg-white border-2 border-slate-900 px-3 py-1.5 font-mono text-xs font-black uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors flex items-center gap-1 shadow-[2px_2px_0px_#0f172a]"
                          >
                            NEXT
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════════════════ */}
            {/* 3. DUAL SCREEN / HEAD-TO-HEAD BATTLEGROUND VIEW */}
            {/* ══════════════════════════════════════════════════════════════════════════════════ */}
            {activeCategory === "ALL" && (
              <motion.div
                key="dual-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"
              >
                {/* ── Left Column: Algorithms Warfare ── */}
                <div className="border-4 border-slate-900 bg-white brutalist-shadow">
                  {/* Division Header */}
                  <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b-4 border-slate-900">
                    <div className="flex items-center gap-2.5">
                      <span className="p-1.5 bg-red-600 text-white">
                        <Swords className="w-4 h-4" />
                      </span>
                      <h3 className="font-black text-lg sm:text-xl uppercase tracking-tight">
                        ALGORITHMS WARFARE
                      </h3>
                    </div>
                    <span className="font-mono text-[10px] font-black bg-red-600 text-white px-2 py-0.5 uppercase">
                      {filteredDsa.length} COMBATANTS
                    </span>
                  </div>

                  {/* List Rows */}
                  <div className="divide-y border-t border-slate-200">
                    {filteredDsa.slice(0, 10).map((member) => {
                      const rank = member.rank;
                      const rankDisplay = rank < 10 ? `#0${rank}` : `#${rank}`;
                      const rankBadgeBg =
                        rank === 1
                          ? "bg-amber-400 text-slate-950 font-black border-slate-900"
                          : rank === 2
                          ? "bg-slate-300 text-slate-950 font-bold border-slate-900"
                          : rank === 3
                          ? "bg-amber-600 text-white font-bold border-slate-900"
                          : rank <= 10
                          ? "bg-slate-900 text-white font-bold border-slate-900"
                          : "bg-slate-100 text-slate-700 font-semibold border-slate-300";

                      return (
                        <Link
                          key={member.member_id}
                          to={`/profile/${member.handle}`}
                          className="p-3 sm:px-4 sm:py-3.5 flex items-center justify-between gap-3 bg-white hover:bg-slate-50 border-l-4 border-transparent hover:border-red-600 transition-colors block group cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 border-2 flex items-center justify-center font-mono text-xs flex-shrink-0 ${rankBadgeBg}`}>
                              {rankDisplay}
                            </div>
                            <div className="w-8 h-8 border-2 border-slate-900 bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-xs shadow-[1px_1px_0px_#0f172a]">
                              <AvatarImage url={member.avatar_url} handle={member.handle} name={member.full_name} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-sm uppercase truncate text-slate-900 group-hover:text-red-600 transition-colors tracking-tight">
                                  {member.full_name}
                                </span>
                                {member.current_streak && member.current_streak >= 3 ? (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-mono px-1 py-0.2 border border-slate-900 bg-white text-slate-900">
                                    <Flame className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                                    <span>{member.current_streak}D</span>
                                  </span>
                                ) : null}
                              </div>
                              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                                {member.monthly_problems_solved || 0} solved (LC:{member.monthly_leetcode || 0} CF:{member.monthly_codeforces || 0})
                              </div>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0 pl-2">
                            <div className="font-mono font-black text-base text-slate-900 leading-none tabular-nums">
                              {Math.floor(member.monthly_dsa_score || 0)}
                            </div>
                            <div className="font-mono text-[8px] font-bold text-red-600 uppercase tracking-wider mt-0.5">DSA XP</div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  <div className="p-3 bg-slate-50 border-t-2 border-slate-900 text-center">
                    <button
                      onClick={() => setActiveCategory("DSA")}
                      className="text-xs font-mono font-black uppercase text-red-600 hover:text-slate-900 flex items-center justify-center gap-1 mx-auto cursor-pointer"
                    >
                      <span>EXPAND FULL ALGORITHMS LADDER</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* ── Right Column: Development Conflict ── */}
                <div className="border-4 border-slate-900 bg-white brutalist-shadow">
                  {/* Division Header */}
                  <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b-4 border-slate-900">
                    <div className="flex items-center gap-2.5">
                      <span className="p-1.5 bg-blue-600 text-white">
                        <Code2 className="w-4 h-4" />
                      </span>
                      <h3 className="font-black text-lg sm:text-xl uppercase tracking-tight">
                        DEVELOPMENT CONFLICT
                      </h3>
                    </div>
                    <span className="font-mono text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 uppercase">
                      {filteredDev.length} COMBATANTS
                    </span>
                  </div>

                  {/* List Rows */}
                  <div className="divide-y border-t border-slate-200">
                    {filteredDev.slice(0, 10).map((member) => {
                      const rank = member.rank;
                      const rankDisplay = rank < 10 ? `#0${rank}` : `#${rank}`;
                      const rankBadgeBg =
                        rank === 1
                          ? "bg-amber-400 text-slate-950 font-black border-slate-900"
                          : rank === 2
                          ? "bg-slate-300 text-slate-950 font-bold border-slate-900"
                          : rank === 3
                          ? "bg-amber-600 text-white font-bold border-slate-900"
                          : rank <= 10
                          ? "bg-slate-900 text-white font-bold border-slate-900"
                          : "bg-slate-100 text-slate-700 font-semibold border-slate-300";

                      return (
                        <Link
                          key={member.member_id}
                          to={`/profile/${member.handle}`}
                          className="p-3 sm:px-4 sm:py-3.5 flex items-center justify-between gap-3 bg-white hover:bg-slate-50 border-l-4 border-transparent hover:border-blue-600 transition-colors block group cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 border-2 flex items-center justify-center font-mono text-xs flex-shrink-0 ${rankBadgeBg}`}>
                              {rankDisplay}
                            </div>
                            <div className="w-8 h-8 border-2 border-slate-900 bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-xs shadow-[1px_1px_0px_#0f172a]">
                              <AvatarImage url={member.avatar_url} handle={member.handle} name={member.full_name} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-sm uppercase truncate text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight">
                                  {member.full_name}
                                </span>
                                {member.current_streak && member.current_streak >= 3 ? (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-mono px-1 py-0.2 border border-slate-900 bg-white text-slate-900">
                                    <Flame className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                                    <span>{member.current_streak}D</span>
                                  </span>
                                ) : null}
                              </div>
                              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                                {member.monthly_commits || 0} commits • {member.monthly_prs || 0} PRs
                              </div>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0 pl-2">
                            <div className="font-mono font-black text-base text-slate-900 leading-none tabular-nums">
                              {Math.floor(member.monthly_dev_score || 0)}
                            </div>
                            <div className="font-mono text-[8px] font-bold text-blue-600 uppercase tracking-wider mt-0.5">DEV XP</div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  <div className="p-3 bg-slate-50 border-t-2 border-slate-900 text-center">
                    <button
                      onClick={() => setActiveCategory("DEV")}
                      className="text-xs font-mono font-black uppercase text-blue-600 hover:text-slate-900 flex items-center justify-center gap-1 mx-auto cursor-pointer"
                    >
                      <span>EXPAND FULL DEVELOPMENT LADDER</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* ── RANK MECHANISM MODAL OVERLAY ── */}
      <AnimatePresence>
        {isRankModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 pt-4 sm:pt-10 pb-12 bg-slate-900/85 backdrop-blur-sm overflow-y-auto">
            {/* Persistent Floating Close Button Outside Modal Box */}
            <button
              onClick={() => setIsRankModalOpen(false)}
              className="fixed top-3 right-3 sm:top-6 sm:right-6 bg-red-600 hover:bg-slate-900 text-white font-mono font-black text-base sm:text-lg px-3 py-1.5 sm:px-4 sm:py-2 border-2 sm:border-4 border-slate-900 brutalist-shadow z-50 flex items-center gap-1.5 cursor-pointer active:translate-y-0.5"
            >
              <span>✕</span>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">CLOSE</span>
            </button>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="bg-white border-4 border-slate-900 brutalist-shadow max-w-2xl w-full max-h-[85vh] overflow-y-auto p-5 sm:p-8 relative font-display text-slate-900 my-0 mt-2 sm:mt-4"
            >
              {/* Modal Header */}
              <div className="flex items-center gap-3 border-b-4 border-slate-900 pb-4 mb-6 pr-12">
                <span className="text-3xl">⚔️</span>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">ARENA RANK MECHANISM</h2>
                  <p className="font-mono text-xs text-slate-600">HOW XP SCORES & COMPETITIVE RANKS ARE CALCULATED</p>
                </div>
              </div>

              {/* Modal Content Sections */}
              <div className="flex flex-col gap-6 text-sm">
                {/* 1. Score Formulas */}
                <div className="bg-slate-50 border-2 border-slate-900 p-4">
                  <h3 className="font-black text-base uppercase text-slate-900 mb-2 flex items-center gap-2">
                    <span>⚡ 1. DIVISION XP FORMULAS</span>
                  </h3>
                  <div className="space-y-2 font-mono text-xs">
                    <div className="bg-red-100 border border-red-900 p-2.5 text-red-950">
                      <div className="font-bold">⚔️ ALGORITHMS (DSA) SCORE:</div>
                      <div>Total Problems Solved aggregated across all platform profiles (LeetCode + Codeforces + CodeChef + GFG) in the current month.</div>
                    </div>
                    <div className="bg-blue-100 border border-blue-900 p-2.5 text-blue-950">
                      <div className="font-bold">🛠️ DEVELOPMENT SCORE:</div>
                      <div>Aggregated monthly GitHub activity count: <span className="font-bold">Total Commits + Total Pull Requests</span>.</div>
                    </div>
                  </div>
                </div>

                {/* 2. Rank Titles */}
                <div className="bg-slate-50 border-2 border-slate-900 p-4">
                  <h3 className="font-black text-base uppercase text-slate-900 mb-2 flex items-center gap-2">
                    <span>👑 2. BATTLE RANK TITLES</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                    <div className="bg-black text-[#FACC15] p-2 border border-slate-900 font-bold">RANK #1: 👑 APEX LEGEND</div>
                    <div className="bg-slate-900 text-white p-2 border border-slate-900 font-bold">RANK #2: ⚔️ MASTER GLADIATOR</div>
                    <div className="bg-amber-900 text-amber-200 p-2 border border-slate-900 font-bold">RANK #3: 🥉 MASTER WARRIOR</div>
                    <div className="bg-[#0707f2] text-white p-2 border border-slate-900 font-bold">RANK #4-5: 💎 DIAMOND WARRIOR</div>
                    <div className="bg-slate-200 text-slate-800 p-2 border border-slate-900 font-bold col-span-1 sm:col-span-2">RANK #6+: ⚡ CONTENDER</div>
                  </div>
                </div>

                {/* 3. Threat Radar & Streaks */}
                <div className="bg-slate-50 border-2 border-slate-900 p-4">
                  <h3 className="font-black text-base uppercase text-slate-900 mb-2 flex items-center gap-2">
                    <span>📡 3. THREAT RADAR & STREAKS</span>
                  </h3>
                  <ul className="list-disc list-inside space-y-1.5 font-mono text-xs text-slate-700">
                    <li><span className="font-bold text-slate-900">THREAT RADAR:</span> Shows the exact additional XP required to overtake the contender directly ahead of you.</li>
                    <li><span className="font-bold text-slate-900 font-mono">💥 RAMPAGE (14+ Days):</span> Active daily coding streak of 14 consecutive days.</li>
                    <li><span className="font-bold text-slate-900 font-mono">⚡ UNSTOPPABLE (7+ Days):</span> Active daily coding streak of 7 consecutive days.</li>
                    <li><span className="font-bold text-slate-900 font-mono">🔥 ON FIRE (3+ Days):</span> Active daily coding streak of 3 consecutive days.</li>
                  </ul>
                </div>

                {/* Monthly Reset Info */}
                <div className="bg-[#FACC15] border-2 border-slate-900 p-3 text-slate-900 font-mono text-xs font-bold flex items-center gap-2">
                  <span className="text-xl">⏳</span>
                  <div>Arena scores reset automatically at the end of every calendar month. Champion titles are awarded based on final standings!</div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-6 pt-4 border-t-2 border-slate-900 flex justify-end">
                <button
                  onClick={() => setIsRankModalOpen(false)}
                  className="bg-slate-900 text-white font-mono font-black text-xs px-6 py-2.5 border-2 border-slate-900 brutalist-shadow-sm hover:bg-[#0707f2] transition-colors cursor-pointer"
                >
                  GOT IT, WARRIOR!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
