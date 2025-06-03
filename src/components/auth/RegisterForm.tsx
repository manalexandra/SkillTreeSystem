import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, UserPlus } from 'lucide-react';
import { addUser } from '../../services/userService';
import type { UserRole } from '../../types';

const RegisterForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await addUser(email, password, role);
      navigate('/login', { 
        state: { message: 'Registration successful. Please sign in with your new account.' }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
      <div className="flex justify-center mb-6">
        <div className="bg-secondary-100 p-3 rounded-full">
          <UserPlus className="h-8 w-8 text-secondary-600" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        Create your account
      </h2>
      
      {error && (
        <div className="bg-error-50 text-error-700 p-3 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Password must be at least 6 characters
          </p>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`border rounded-md p-3 cursor-pointer transition-colors ${
                role === 'user'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-primary-400'
              }`}
              onClick={() => setRole('user')}
            >
              <div className="font-medium">User</div>
              <div className="text-xs text-gray-500 mt-1">
                View and complete skills
              </div>
            </div>
            <div
              className={`border rounded-md p-3 cursor-pointer transition-colors ${
                role === 'manager'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-primary-400'
              }`}
              onClick={() => setRole('manager')}
            >
              <div className="font-medium">Manager</div>
              <div className="text-xs text-gray-500 mt-1">
                Create and manage skill trees
              </div>
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary-600 hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 ${
            loading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
                <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <a
            href="/login"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;