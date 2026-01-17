import { create } from 'zustand';

export interface UserInfo {
  id: string;
  username: string;
  name?: string;
  email?: string;
  avatar?: string;
}

interface UserState {
  isLoggedIn: boolean;
  userInfo: UserInfo | null;
  login: (userInfo: UserInfo) => void;
  logout: () => void;
}

export const userStore = create<UserState>((set) => ({
  isLoggedIn: false,
  userInfo: null,
  login: (userInfo: UserInfo) =>
    set(() => ({
      isLoggedIn: true,
      userInfo
    })),
  logout: () =>
    set(() => ({
      isLoggedIn: false,
      userInfo: null
    }))
}));
