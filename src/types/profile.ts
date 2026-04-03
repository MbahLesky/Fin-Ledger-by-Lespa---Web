export interface Profile {
  id: string;
  name?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  onboardingCompleted: boolean;
  preferredCurrency?: string | null;
  createdAt: string;
  updatedAt: string;
}

