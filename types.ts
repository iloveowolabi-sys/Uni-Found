export enum UserRole {
  STUDENT = 'STUDENT',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN'
}

export enum ItemStatus {
  PENDING = 'PENDING',
  LOST = 'LOST',
  FOUND = 'FOUND',
  CLAIMED = 'CLAIMED',
  RESOLVED = 'RESOLVED'
}

export enum Category {
  ELECTRONICS = 'Electronics',
  CLOTHING = 'Clothing',
  ID_CARDS = 'ID Cards',
  BOOKS = 'Books',
  KEYS = 'Keys',
  OTHER = 'Other'
}

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: UserRole;
  avatar?: string;
  isVerified?: boolean;
  password?: string;
  createdAt?: string;
}

export interface ItemReport {
  id: string;
  userId: string;
  type: 'LOST' | 'FOUND';
  title: string;
  description: string;
  category: Category;
  location: string;
  date: string; // ISO string
  dateReported?: string; // ISO string
  dateOccurred?: string; // ISO string
  status: ItemStatus;
  imageUrl?: string;
  claimedBy?: string;
  matchScore?: number;
  reporterName?: string;
  reporterEmail?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}