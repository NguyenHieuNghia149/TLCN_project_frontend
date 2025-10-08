import React from 'react'

export const CommunityHeaderBreadcrumb: React.FC = () => {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container mx-auto flex items-center justify-between p-4">
        <div>
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li>
              <a href="/dashboard" className="hover:text-blue-500">
                Prepare
              </a>
            </li>
            <li className="flex items-center">
              <span className="mx-1 text-gray-400">›</span>
              <span>Problem Solving</span>
            </li>
          </ol>
          <h1 className="mt-2 text-2xl font-semibold">Problem Solving</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <p>
              <span className="font-medium">39 more points</span> to get your
              next star!
            </p>
            <div className="mt-1 h-2 w-40 rounded bg-gray-200">
              <div
                className="h-2 rounded bg-orange-400"
                style={{ width: '44%' }}
              ></div>
            </div>
            <div className="mt-1 flex justify-between text-xs">
              <span>
                Rank: <strong>2,379,706</strong>
              </span>
              <span>
                Points: <strong>61/100</strong>
              </span>
            </div>
          </div>

          <div className="relative flex flex-col items-center">
            <svg
              viewBox="0 0 91 100"
              className="h-12 w-12"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="badge-bronze-gradient"
                  x1="52.5"
                  y1="2.5"
                  x2="52.5"
                  y2="102.5"
                >
                  <stop offset="0" stopColor="#ffc5ab" />
                  <stop offset="1" stopColor="#ffa38a" />
                </linearGradient>
              </defs>
              <path
                fill="url(#badge-bronze-gradient)"
                stroke="#bd6e52"
                d="M90.3892 44.9106L90.3893 44.914C90.5873 51.9976 90.3892 59.5788 89.8948 65.4581..."
              />
            </svg>
            <span className="mt-1 text-xs font-medium text-orange-600">
              Bronze
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
