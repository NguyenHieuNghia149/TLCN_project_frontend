export interface LanguageCatalogEntry {
  id: string
  key: string
  displayName: string
  isActive: boolean
  sortOrder: number
}

export interface UpdateLanguagePayload {
  displayName?: string
  isActive?: boolean
  sortOrder?: number
}
