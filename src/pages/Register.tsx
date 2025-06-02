import React from 'react';
import RegisterForm from '../components/auth/RegisterForm';
import { Link } from 'react-router-dom';
import { GitBranchPlus, ArrowLeft } from 'lucide-react';

const Register: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-secondary-100 flex flex-col justify-center items-center p-4">
      <Link 
        to="/" 
        className="absolute top-8 left-8 flex items-center text-secondary-600 hover:text-secondary-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Home
      </Link>

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center mb-6">
          <div className="p-3 bg-white rounded-2xl shadow-md">
            <GitBranchPlus className="h-12 w-12 text-secondary-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
        <p className="text-gray-600 max-w-md">
          Join our platform to start tracking and developing your team's skills.
        </p>
      </div>

      <div className="w-full max-w-md">
        <RegisterForm />
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-secondary-600 hover:text-secondary-500 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;