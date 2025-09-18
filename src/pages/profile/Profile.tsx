import React from 'react'

type UserProfile = {
  id: string
  fullName: string
  username: string
  email: string
  bio?: string
  avatarUrl?: string
  location?: string
  website?: string
  stats?: {
    solved: number
    submissions: number
    reputation: number
    streak: number
  }
}

const mockUser: UserProfile = {
  id: 'user-1',
  fullName: 'Jane Doe',
  username: 'janedoe',
  email: 'jane@example.com',
  bio: 'Passionate about algorithms, TypeScript, and building delightful UIs.',
  avatarUrl: 'https://api.dicebear.com/7.x/thumbs/svg?seed=Jane',
  location: 'Ho Chi Minh City, VN',
  website: 'https://example.com',
  stats: { solved: 124, submissions: 530, reputation: 860, streak: 12 },
}

const Profile: React.FC = () => {
  const user = mockUser

  return (
    <div className="p-6">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="h-36 w-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600" />
        <div className="-mt-12 flex flex-col gap-6 p-6 md:-mt-10 md:flex-row md:items-end md:gap-8">
          <img
            src={user.avatarUrl}
            alt={user.fullName}
            className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-xl md:h-28 md:w-28 dark:border-slate-900"
          />
          <div className="flex-1">
            <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-end">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                  {user.fullName}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  @{user.username} · {user.location}
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href="/settings/profile"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Edit Profile
                </a>
                <a
                  href="/settings/account"
                  className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-md transition hover:brightness-110"
                >
                  Account Settings
                </a>
              </div>
            </div>
            {user.bio && (
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {user.bio}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              <a
                href={user.website}
                target="_blank"
                rel="noreferrer"
                className="text-sky-600 hover:underline dark:text-sky-400"
              >
                {user.website}
              </a>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 dark:text-slate-400">
                {user.email}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-t border-slate-100 p-6 md:grid-cols-4 dark:border-slate-800">
          <StatCard label="Problems Solved" value={user.stats?.solved ?? 0} />
          <StatCard
            label="Total Submissions"
            value={user.stats?.submissions ?? 0}
          />
          <StatCard label="Reputation" value={user.stats?.reputation ?? 0} />
          <StatCard label="Current Streak" value={user.stats?.streak ?? 0} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
            Recent Activity
          </h2>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 p-3 dark:border-slate-800">
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  Solved: Two Sum
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Difficulty: Easy · 2 hours ago
                </p>
              </div>
              <a
                href="/problems/two-sum"
                className="text-sky-600 hover:underline dark:text-sky-400"
              >
                View
              </a>
            </li>
            <li className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 p-3 dark:border-slate-800">
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  Submitted: Longest Substring
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Difficulty: Medium · 1 day ago
                </p>
              </div>
              <a
                href="/problems/longest-substring"
                className="text-sky-600 hover:underline dark:text-sky-400"
              >
                View
              </a>
            </li>
            <li className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 p-3 dark:border-slate-800">
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  Discussion: Best practices for DP
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Discussion · 3 days ago
                </p>
              </div>
              <a
                href="/discuss/dp-best-practices"
                className="text-sky-600 hover:underline dark:text-sky-400"
              >
                Open
              </a>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
            Badges
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <Badge label="Starter" color="from-emerald-500 to-green-600" />
            <Badge label="Sprinter" color="from-sky-500 to-blue-600" />
            <Badge label="Algo Guru" color="from-fuchsia-500 to-violet-600" />
          </div>
        </div>
      </div>
    </div>
  )
}

const StatCard: React.FC<{ label: string; value: number }> = ({
  label,
  value,
}) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">
      {value}
    </div>
    <div className="mt-0.5 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
      {label}
    </div>
  </div>
)

const Badge: React.FC<{ label: string; color: string }> = ({
  label,
  color,
}) => (
  <div
    className={`flex items-center justify-center rounded-lg bg-gradient-to-r ${color} px-2 py-6 text-center text-sm font-semibold text-white shadow`}
  >
    {label}
  </div>
)

export default Profile
