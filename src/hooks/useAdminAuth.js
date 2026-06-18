import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export function useAdminAuth() {
  const { user, status } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === 'loaded' && (!user || user.role !== 'admin')) {
      navigate('/', { replace: true });
    }
  }, [user, status, navigate]);

  return { user, isAdmin: user?.role === 'admin', isLoading: status === 'loading' };
}