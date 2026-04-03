import { apiClient } from '@/config/axios.config'
import type {
  LanguageCatalogEntry,
  UpdateLanguagePayload,
} from '@/types/language.types'

type LanguageCatalogListResponse = {
  items?: LanguageCatalogEntry[]
}

export class LanguageService {
  async getLanguages(): Promise<LanguageCatalogEntry[]> {
    const response =
      await apiClient.get<LanguageCatalogListResponse>('/languages')
    return response.data?.items ?? []
  }

  async getAdminLanguages(): Promise<LanguageCatalogEntry[]> {
    const response =
      await apiClient.get<LanguageCatalogListResponse>('/admin/languages')
    return response.data?.items ?? []
  }

  async updateLanguage(
    id: string,
    payload: UpdateLanguagePayload
  ): Promise<LanguageCatalogEntry> {
    const response = await apiClient.put<LanguageCatalogEntry>(
      '/admin/languages/' + id,
      payload
    )

    if (!response.data) {
      throw new Error('Language update response is missing data')
    }

    return response.data
  }
}

export const languageService = new LanguageService()
