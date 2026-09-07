"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/lib/auth-context";
import { ROLE_LABELS } from "@/lib/rbac";

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  title: string;
}

interface ProfileContextValue {
  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

const EMPTY: UserProfile = {
  name: "",
  email: "",
  phone: "",
  title: "",
};

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(EMPTY);

  useEffect(() => {
    if (!user) {
      setProfile(EMPTY);
      return;
    }
    setProfile({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      title: ROLE_LABELS[user.role] || "",
    });
  }, [user]);

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfile((p) => ({ ...p, ...patch }));
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
