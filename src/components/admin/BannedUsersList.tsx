import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  asyncFetchBannedUsers,
  asyncUnbanUser,
  setPaginationParams,
} from '@/store/slices/adminSlice'
import { RootState, AppDispatch } from '@/store/stores'
import { formatDistanceToNow } from 'date-fns'
import type { BannedUser } from '@/services/api/adminUser.service'

export const BannedUsersList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { bannedUsers, banOperation } = useSelector(
    (state: RootState) => state.admin
  )

  useEffect(() => {
    dispatch(
      asyncFetchBannedUsers({
        limit: bannedUsers.limit,
        offset: bannedUsers.offset,
      })
    )
  }, [dispatch, bannedUsers.limit, bannedUsers.offset])

  const handleUnban = (userId: string) => {
    if (confirm('Are you sure you want to unban this user?')) {
      dispatch(asyncUnbanUser(userId)).then(action => {
        if (action.type === asyncUnbanUser.fulfilled.type) {
          // Refresh the list
          dispatch(
            asyncFetchBannedUsers({
              limit: bannedUsers.limit,
              offset: bannedUsers.offset,
            })
          )
        }
      })
    }
  }

  const handlePageChange = (newOffset: number) => {
    dispatch(
      setPaginationParams({ limit: bannedUsers.limit, offset: newOffset })
    )
  }

  const totalPages = Math.ceil(bannedUsers.total / bannedUsers.limit)
  const currentPage = Math.floor(bannedUsers.offset / bannedUsers.limit) + 1

  if (bannedUsers.loading && bannedUsers.list.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Loading banned users...</div>
      </div>
    )
  }

  if (bannedUsers.error) {
    return (
      <div className="rounded-md border border-red-400 bg-red-100 p-4 text-red-700">
        Error loading banned users: {bannedUsers.error}
      </div>
    )
  }

  if (bannedUsers.list.length === 0) {
    return (
      <div className="rounded-md border border-blue-400 bg-blue-100 p-4 text-blue-700">
        No banned users
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-300 bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="border-b px-6 py-3 text-left text-sm font-medium text-gray-700">
              User
            </th>
            <th className="border-b px-6 py-3 text-left text-sm font-medium text-gray-700">
              Ban Reason
            </th>
            <th className="border-b px-6 py-3 text-left text-sm font-medium text-gray-700">
              Banned At
            </th>
            <th className="border-b px-6 py-3 text-left text-sm font-medium text-gray-700">
              Banned By
            </th>
            <th className="border-b px-6 py-3 text-left text-sm font-medium text-gray-700">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {bannedUsers.list.map((user: BannedUser) => (
            <tr
              key={user.id}
              className="border-b transition-colors hover:bg-gray-50"
            >
              <td className="px-6 py-4 text-sm text-gray-900">
                <div className="font-medium">{user.name}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </td>
              <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-700">
                {user.ban_reason}
              </td>
              <td className="px-6 py-4 text-sm text-gray-700">
                {formatDistanceToNow(new Date(user.banned_at), {
                  addSuffix: true,
                })}
              </td>
              <td className="px-6 py-4 text-sm text-gray-700">
                {user.bannedByAdmin?.name || 'System'}
              </td>
              <td className="px-6 py-4 text-sm">
                <button
                  onClick={() => handleUnban(user.id)}
                  disabled={banOperation.loading}
                  className="rounded bg-green-600 px-3 py-1 text-sm text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Unban
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between px-6">
        <div className="text-sm text-gray-600">
          Showing {bannedUsers.offset + 1} to{' '}
          {Math.min(bannedUsers.offset + bannedUsers.limit, bannedUsers.total)}{' '}
          of {bannedUsers.total} banned users
        </div>
        <div className="flex gap-2">
          <button
            onClick={() =>
              handlePageChange(
                Math.max(0, bannedUsers.offset - bannedUsers.limit)
              )
            }
            disabled={bannedUsers.offset === 0}
            className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <div className="rounded border border-gray-300 bg-gray-50 px-3 py-1">
            Page {currentPage} of {totalPages}
          </div>
          <button
            onClick={() =>
              handlePageChange(bannedUsers.offset + bannedUsers.limit)
            }
            disabled={currentPage === totalPages}
            className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
