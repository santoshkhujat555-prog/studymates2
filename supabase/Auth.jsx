import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthForm } from '@/components/AuthForm';
import { useAuth } from '@/hooks/useAuth';

const Auth = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ Only allow verified users to proceed
    if (user) {
      if (user.email_confirmed_at) {
        navigate('/');
      } else {
        // stay on auth page & maybe show a message
        console.warn("Email not verified yet.");
      }
    }
  }, [user, navigate]);

  return <AuthForm />;
};

export default Auth;
