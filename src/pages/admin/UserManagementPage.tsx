import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { asyncFetchBannedUsers } from '@/store/slices/adminSlice'
import { RootState, AppDispatch } from '@/store/stores'
import { BanUserModal } from '@/components/admin/BanUserModal'
import { BannedUsersList } from '@/components/admin/BannedUsersList'
import { apiClient } from '@/config/axios.config'

interface UserItem {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'banned'
  createdAt?: string
}

export const UserManagementPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { bannedUsers } = useSelector((state: RootState) => state.admin)

  const [activeUsers, setActiveUsers] = useState<UserItem[]>([])
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(false)
  const [isBanModalOpen, setIsBanModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<{
    id: string
    name: string
  } | null>(null)
  const [currentTab, setCurrentTab] = useState<'active' | 'banned'>('active')

  // Fetch active users
  const fetchActiveUsers = async (search?: string) => {
    setLoading(true)
    try {
      const response = await apiClient.get('/admin/users/active', {
        params: search ? { search } : {},
      })
      const users = response.data.data?.users || []
      setActiveUsers(users)
    } catch (error) {
      console.error('Failed to fetch active users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActiveUsers()
  }, [])

  const handleBanClick = (user: UserItem) => {
    setSelectedUser({ id: user.id, name: user.name })
    setIsBanModalOpen(true)
  }

  const handleBanSuccess = () => {
    // Refresh active users list
    fetchActiveUsers(searchText)
    // Refresh banned users list
    dispatch(
      asyncFetchBannedUsers({
        limit: bannedUsers.limit,
        offset: bannedUsers.offset,
      })
    )
  }

  const handleSearch = (value: string) => {
    setSearchText(value)
    fetchActiveUsers(value)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">
          User Management
        </h1>

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setCurrentTab('active')}
            className={`px-4 py-2 font-medium transition-colors ${
              currentTab === 'active'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Active Users
          </button>
          <button
            onClick={() => setCurrentTab('banned')}
            className={`px-4 py-2 font-medium transition-colors ${
              currentTab === 'banned'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Banned Users
          </button>
        </div>

        {/* Active Users Tab */}
        {currentTab === 'active' && (
          <div className="rounded-lg bg-white shadow">
            <div className="p-6">
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchText}
                  onChange={e => handleSearch(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="text-gray-500">Loading users...</div>
                </div>
              ) : activeUsers.length === 0 ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="text-gray-500">
                    {searchText
                      ? 'No users found'
                      : 'No active users available'}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300 bg-white">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border-b px-6 py-3 text-left text-sm font-medium text-gray-700">
                          User
                        </th>
                        <th className="border-b px-6 py-3 text-left text-sm font-medium text-gray-700">
                          Email
                        </th>
                        <th className="border-b px-6 py-3 text-left text-sm font-medium text-gray-700">
                          Role
                        </th>
                        <th className="border-b px-6 py-3 text-left text-sm font-medium text-gray-700">
                          Joined
                        </th>
                        <th className="border-b px-6 py-3 text-left text-sm font-medium text-gray-700">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeUsers.map(user => (
                        <tr
                          key={user.id}
                          className="border-b transition-colors hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {user.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                              {user.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {user.createdAt
                              ? new Date(user.createdAt).toLocaleDateString()
                              : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <button
                              onClick={() => handleBanClick(user)}
                              className="rounded bg-red-600 px-3 py-1 text-sm text-white transition-colors hover:bg-red-700"
                            >
                              Ban
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Banned Users Tab */}
        {currentTab === 'banned' && (
          <div className="rounded-lg bg-white p-6 shadow">
            <BannedUsersList />
          </div>
        )}
      </div>

      {/* Ban User Modal */}
      <BanUserModal
        isOpen={isBanModalOpen}
        userId={selectedUser?.id}
        userName={selectedUser?.name}
        onClose={() => {
          setIsBanModalOpen(false)
          setSelectedUser(null)
        }}
        onSuccess={handleBanSuccess}
      />
    </div>
  )
}
