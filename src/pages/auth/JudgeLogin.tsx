import { LoginForm } from '@/components/auth/LoginForm';
import { Link } from 'react-router-dom';
const JudgeLogin = () => {
  return <div className="min-h-screen flex items-center justify-center bg-gradient-warm p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-xl flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl shadow-lg p-6 sm:p-8" style={{
        background: 'rgba(255, 255, 255, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(15px)',
        WebkitBackdropFilter: 'blur(15px)'
      }}>
          <LoginForm role="judge" redirectPath="/judge/dashboard" />
          
        </div>
      </div>
    </div>;
};
export default JudgeLogin;