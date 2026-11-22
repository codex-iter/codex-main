
import { Link } from "react-router-dom";

export function ProfileSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-48 bg-slate-200 border-4 border-slate-200" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-slate-200 border-4 border-slate-200" />
        ))}
      </div>
      <div className="h-40 bg-slate-200 border-4 border-slate-200" />
    </div>
  );
}

export function NotFound({ handle }: { handle: string }) {
  return (
    <div className="border-4 border-slate-900 bg-white p-16 text-center brutalist-shadow">
      <span className="material-symbols-outlined text-6xl text-slate-300 mb-4 block">
        person_off
      </span>
      <h3 className="text-3xl font-black uppercase text-slate-900 mb-2">
        Member Not Found
      </h3>
      <p className="text-slate-500 font-medium max-w-sm mx-auto mb-6">
        No member with handle{" "}
        <span className="font-black text-primary">"{handle}"</span> exists in
        the CODEX database.
      </p>
      <Link
        to="/leaderboard"
        className="inline-block border-4 border-slate-900 bg-primary text-white px-6 py-3 font-black uppercase tracking-widest text-sm brutalist-shadow hover:bg-slate-900 transition-colors"
      >
        ← Back to Leaderboard
      </Link>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="border-4 border-red-500 bg-white p-12 text-center brutalist-shadow">
      <span className="material-symbols-outlined text-5xl text-red-400 mb-4 block">
        error
      </span>
      <h3 className="text-xl font-black uppercase text-red-600 mb-2">
        Failed to Load Profile
      </h3>
      <p className="text-slate-500 text-sm font-medium max-w-md mx-auto">
        {message}
      </p>
    </div>
  );
}
