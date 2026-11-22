
import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ScrollReveal, StaggerContainer, StaggerItem } from "../components/animations/ScrollReveal";
import SEO from "../components/SEO";
import { useMemberProfile } from "../hooks/useMemberProfile";
import { ProfileSkeleton, NotFound, ErrorState } from "../components/profile/ProfileStates";
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { HeroMetrics } from "../components/profile/HeroMetrics";
import { SkillDistribution } from "../components/profile/SkillDistribution";
import { ContestRankings } from "../components/profile/ContestRankings";
import { DifficultyBreakdown } from "../components/profile/DifficultyBreakdown";
import { OpenSourceContributions } from "../components/profile/OpenSourceContributions";
import { AchievementsAndBadges } from "../components/profile/AchievementsAndBadges";
import { PlatformOverview } from "../components/profile/PlatformOverview";
import { TopicBreakdown } from "../components/profile/TopicBreakdown";

export default function MemberProfile() {
  const { handle = "" } = useParams<{ handle: string }>();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [handle]);

  const {
    profile,
    latestSnapshot,
    loading,
    error,
    derivedStats,
    sortedTopics,
    badges,
  } = useMemberProfile(handle);

  return (
    <div className="bg-background-light min-h-screen font-display text-slate-900">
      {profile && (
        <SEO
          title={`${profile.full_name} | CODEX ITER`}
          description={`Solo coding profile for ${profile.full_name} — streaks, LeetCode, GFG, GitHub, and more.`}
        />
      )}
      {!profile && !loading && (
        <SEO
          title="Member Not Found | CODEX ITER"
          description="This CODEX member profile does not exist."
        />
      )}

      <main className="max-w-5xl mx-auto px-6 md:px-20 py-16">
        <ScrollReveal className="mb-10">
          <Link
            to="/leaderboard"
            className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-colors group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            Leaderboard
          </Link>
        </ScrollReveal>

        {loading && <ProfileSkeleton />}
        {!loading && error && <ErrorState message={error} />}
        {!loading && !error && profile === null && <NotFound handle={handle} />}

        {!loading && !error && profile && (
          <StaggerContainer className="space-y-12">
            <ProfileHeader profile={profile} />

            {!latestSnapshot && (
              <StaggerItem>
                <div className="border-4 border-slate-300 bg-white p-12 text-center mt-12">
                  <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">
                    hourglass_empty
                  </span>
                  <h3 className="text-xl font-black uppercase text-slate-400">
                    No Activity Data Yet
                  </h3>
                  <p className="text-slate-400 text-sm mt-2">
                    Stats will appear after the next scheduled sync.
                  </p>
                </div>
              </StaggerItem>
            )}

            {latestSnapshot && (
              <>
                <HeroMetrics stats={latestSnapshot} derived={derivedStats} />
                <SkillDistribution derived={derivedStats} />
                <ContestRankings stats={latestSnapshot} />
                <DifficultyBreakdown stats={latestSnapshot} derived={derivedStats} />
                <OpenSourceContributions handle={profile.github_handle} />
                <AchievementsAndBadges badges={badges} />
                <PlatformOverview profile={profile} stats={latestSnapshot} />
                <TopicBreakdown sortedTopics={sortedTopics} />
              </>
            )}
          </StaggerContainer>
        )}
      </main>
    </div>
  );
}
