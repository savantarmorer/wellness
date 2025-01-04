import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HelloWorld = () => {
  const { currentUser } = useAuth();

  // If user is logged in, redirect to dashboard
  // If not, redirect to login page
  return currentUser ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

export default HelloWorld; 