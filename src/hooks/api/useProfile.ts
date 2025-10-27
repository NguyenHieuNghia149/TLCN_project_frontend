import { useState, useEffect } from 'react'
import {
  profileAPI,
  ProfileData,
  UpdateProfileData,
} from '../../services/api/profile.api'

export const useProfile = (userId?: string) => {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await profileAPI.getProfile(userId)
        setProfile(response.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch profile')
        console.error('Error fetching profile:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [userId])

  const updateProfile = async (data: UpdateProfileData) => {
    try {
      setError(null)
      const response = await profileAPI.updateProfile(data)
      setProfile(response.data)
      return response.data
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update profile'
      setError(errorMessage)
      throw err
    }
  }

  const refetch = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await profileAPI.getProfile(userId)
      setProfile(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile')
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  return {
    profile,
    loading,
    error,
    refetch,
    updateProfile,
  }
}
