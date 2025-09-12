export interface UserProfileSafe {
  email: string
  name: string | null
  phoneNumber: string | null
  avatarUrl: string | null
  active: boolean
  updatedAt: string | null
  addresses: string | null
  roles: string[]
}

export interface updateProfile{
  name:string
  addresses:string
}
