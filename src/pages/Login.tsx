import React from 'react';
import LoginForm from '../components/auth/LoginForm';
import { useLocation, Link } from 'react-router-dom';
import { GitBranchPlus, ArrowLeft } from 'lucide-react';

const Login: React.FC = () => {
  const location = useLocation();
  const message = location.state?.message;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex flex-col justify-center items-center p-4">
      <Link 
        to="/" 
        className="absolute top-8 left-8 flex items-center text-primary-600 hover:text-primary-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Home
      </Link>

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center mb-6">
          <div className="p-3 bg-white rounded-2xl shadow-md">
            <GitBranchPlus className="h-12 w-12 text-primary-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
        <p className="text-gray-600 max-w-md">
          Sign in to continue managing your team's skill development journey.
        </p>
      </div>

      {message && (
        <div className="mb-6 w-full max-w-md p-4 bg-success-50 rounded-lg border border-success-200 text-success-700 animate-fadeIn">
          <p className="text-center">{message}</p>
        </div>
      )}

      <div className="w-full max-w-md">
        <LoginForm />
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account yet?{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;