import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Profile } from '../types';

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  loading: true,
});

export const useProfile = () => useContext(ProfileContext);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'profile'), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setProfile({ _id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Profile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error listening to profile updates:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, loading }}>
      {children}
    </ProfileContext.Provider>
  );
};
