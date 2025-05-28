import React from 'react';
import RegisterForm from '../components/auth/RegisterForm';
import { GitBranchPlus } from 'lucide-react';

const Register: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center mb-6">
          <GitBranchPlus className="h-12 w-12 text-primary-600" />
          <h1 className="ml-2 text-3xl font-bold text-gray-900">SkillTree</h1>
        </div>
        <p className="text-gray-600 max-w-md">
          Join our skill tree platform to track and showcase your professional development.
        </p>
      </div>

      <RegisterForm />
    </div>
  );
};

export default Register;