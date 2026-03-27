export interface Media {
  _id?: string;
  title: string;
  description: string;
  url: string;
  publicId: string;
  type: 'image' | 'video';
  category: string;
  createdAt: string;
  firestoreError?: boolean;
}

export interface ContactMessage {
  _id?: string;
  name: string;
  email: string;
  mobile?: string;
  message: string;
  createdAt: string;
}

export interface Profile {
  _id?: string;
  name: string;
  websiteName?: string;
  tagline?: string;
  description?: string;
  myStory?: string;
  skills?: string[];
  equipment?: string[];
  email: string;
  phone?: string;
  instagram?: string;
  logoUrl?: string;
  profilePicUrl?: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: {
    username: string;
  };
}
