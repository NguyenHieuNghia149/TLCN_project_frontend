import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { languageService } from '@/services/api/language.service'
import type { UpdateLanguagePayload } from '@/types/language.types'

export const ACTIVE_LANGUAGES_QUERY_KEY = ['languages', 'active'] as const
export const ADMIN_LANGUAGES_QUERY_KEY = ['languages', 'admin'] as const

export function useLanguages() {
  return useQuery({
    queryKey: ACTIVE_LANGUAGES_QUERY_KEY,
    queryFn: () => languageService.getLanguages(),
  })
}

export function useAdminLanguages() {
  return useQuery({
    queryKey: ADMIN_LANGUAGES_QUERY_KEY,
    queryFn: () => languageService.getAdminLanguages(),
  })
}

export function useUpdateLanguage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateLanguagePayload
    }) => languageService.updateLanguage(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ACTIVE_LANGUAGES_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ADMIN_LANGUAGES_QUERY_KEY }),
      ])
    },
  })
}
