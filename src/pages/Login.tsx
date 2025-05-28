import React from 'react';
import LoginForm from '../components/auth/LoginForm';
import { useLocation } from 'react-router-dom';
import { GitBranchPlus } from 'lucide-react';

const Login: React.FC = () => {
  const location = useLocation();
  const message = location.state?.message;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center mb-6">
          <GitBranchPlus className="h-12 w-12 text-primary-600" />
          <h1 className="ml-2 text-3xl font-bold text-gray-900">SkillTree</h1>
        </div>
        <p className="text-gray-600 max-w-md">
          Track your team's skills and professional development with our intuitive skill tree system.
        </p>
      </div>

      {message && (
        <div className="mb-4 w-full max-w-md p-4 bg-green-50 rounded-lg border border-green-200 text-green-800">
          {message}
        </div>
      )}

      <LoginForm />
    </div>
  );
};

export default Login;