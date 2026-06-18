import { useAuth } from '@/lib/AuthContext';
import { Navigate } from 'react-router-dom';

export function withAdminAuth(Component) {
  return function AdminPageGuardComponent(props) {
    const { user, status } = useAuth();

    if (status === 'loading') {
      return <div className="p-6 text-center">Loading...</div>;
    }

    if (!user || user.role !== 'admin') {
      return <Navigate to="/" replace />;
    }

    return <Component {...props} />;
  };
}