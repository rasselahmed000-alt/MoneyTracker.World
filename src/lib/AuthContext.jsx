import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext(null);

let _authPromise = null;
let _resolvedUser = undefined;

function getAuthOnce() {
  if (!_authPromise) {
    _authPromise = base44.auth.me()
      .then(u  => { _resolvedUser = u || null; return _resolvedUser; })
      .catch(() => { _resolvedUser = null; return null; });
  }
  return _authPromise;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser]     = useState(() => _resolvedUser !== undefined ? _resolvedUser : null);
  const [status, setStatus] = useState(() =>
    _resolvedUser !== undefined
      ? (_resolvedUser ? 'authenticated' : 'unauthenticated')
      : 'loading'
  );
  const [isAdmin, setIsAdmin] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (_resolvedUser !== undefined) {
      // Check role from cached user
      if (_resolvedUser?.role === 'admin') setIsAdmin(true);
      return;
    }

    getAuthOnce().then(u => {
      if (!mountedRef.current) return;
      if (u) {
        setUser(u);
        setStatus('authenticated');
        setIsAdmin(u.role === 'admin');
      }
      else {
        setUser(null);
        setStatus('unauthenticated');
        setIsAdmin(false);
      }
    });

    return () => { mountedRef.current = false; };
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      _authPromise = null;
      _resolvedUser = undefined;
      const u = await base44.auth.me();
      if (!mountedRef.current) return;
      if (u) {
        _authPromise = Promise.resolve(u);
        _resolvedUser = u;
        setUser({ ...u });
        setIsAdmin(u.role === 'admin');
      }
    } catch {}
  }, []);

  const logout = useCallback(() => {
    _authPromise = null;
    _resolvedUser = undefined;
    setUser(null);
    setStatus('unauthenticated');
    setIsAdmin(false);
    base44.auth.logout();
  }, []);

  const checkAppState = useCallback(async () => {
    if (!mountedRef.current) return;
    setStatus('loading');
    _authPromise = null;
    _resolvedUser = undefined;
    try {
      const u = await getAuthOnce();
      if (!mountedRef.current) return;
      if (u) {
        setUser(u);
        setStatus('authenticated');
        setIsAdmin(u.role === 'admin');
      }
      else {
        setUser(null);
        setStatus('unauthenticated');
        setIsAdmin(false);
      }
    } catch {
      if (!mountedRef.current) return;
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
      isAuthenticated:         status === 'authenticated',
      isLoadingAuth:           status === 'loading',
      isLoadingPublicSettings: status === 'loading',
      authChecked:             status !== 'loading',
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