import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { auth, subscribeAuthStateChanged, getUserDoc, mapFirebaseUserToAppUser, signOutUser } from '@/api/firebaseClient';

const AuthContext = createContext(null);
let _resolvedUser = undefined;

async function getAppUser(authUser) {
  if (!authUser) return null;
  const userDoc = await getUserDoc(authUser.uid);
  return mapFirebaseUserToAppUser(authUser, userDoc);
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => (_resolvedUser !== undefined ? _resolvedUser : null));
  const [status, setStatus] = useState(() =>
    _resolvedUser !== undefined ? (_resolvedUser ? 'authenticated' : 'unauthenticated') : 'loading'
  );
  const [isAdmin, setIsAdmin] = useState(() => _resolvedUser?.role === 'admin');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (_resolvedUser !== undefined) {
      setUser(_resolvedUser);
      setStatus(_resolvedUser ? 'authenticated' : 'unauthenticated');
      setIsAdmin(_resolvedUser?.role === 'admin');
    }

    const unsubscribe = subscribeAuthStateChanged(async (authUser) => {
      if (!mountedRef.current) return;
      if (authUser) {
        setStatus('loading');
      }
      try {
        const appUser = await getAppUser(authUser);
        _resolvedUser = appUser;
        if (!mountedRef.current) return;
        if (appUser) {
          setUser(appUser);
          setStatus('authenticated');
          setIsAdmin(appUser.role === 'admin');
        } else {
          setUser(null);
          setStatus('unauthenticated');
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Failed to resolve app user:', err);
        if (!mountedRef.current) return;
        _resolvedUser = null;
        setUser(null);
        setStatus('unauthenticated');
        setIsAdmin(false);
      }
    });

    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const authUser = auth.currentUser;
      if (!authUser) {
        _resolvedUser = null;
        if (!mountedRef.current) return null;
        setUser(null);
        setStatus('unauthenticated');
        setIsAdmin(false);
        return null;
      }
      const appUser = await getAppUser(authUser);
      _resolvedUser = appUser;
      if (!mountedRef.current) return appUser;
      setUser(appUser);
      setStatus(appUser ? 'authenticated' : 'unauthenticated');
      setIsAdmin(appUser?.role === 'admin');
      return appUser;
    } catch {
      _resolvedUser = null;
      if (!mountedRef.current) return null;
      setUser(null);
      setStatus('unauthenticated');
      setIsAdmin(false);
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.warn('Sign out failed', err);
    }
    _resolvedUser = null;
    setUser(null);
    setStatus('unauthenticated');
    setIsAdmin(false);
  }, []);

  const checkAppState = useCallback(async () => {
    if (!mountedRef.current) return;
    setStatus('loading');
    _resolvedUser = undefined;
    try {
      const authUser = auth.currentUser;
      const appUser = await getAppUser(authUser);
      _resolvedUser = appUser;
      if (!mountedRef.current) return;
      if (appUser) {
        setUser(appUser);
        setStatus('authenticated');
        setIsAdmin(appUser.role === 'admin');
      } else {
        setUser(null);
        setStatus('unauthenticated');
        setIsAdmin(false);
      }
    } catch {
      if (!mountedRef.current) return;
      _resolvedUser = null;
      setUser(null);
      setStatus('unauthenticated');
      setIsAdmin(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      status,
      isAdmin,
      isAuthenticated: status === 'authenticated',
      isLoadingAuth: status === 'loading',
      isLoadingPublicSettings: status === 'loading',
      authChecked: status !== 'loading',
      refreshUser,
      logout,
      checkAppState,
      checkUserAuth: refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
