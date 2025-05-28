import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import { GitBranchPlus, Users, Award, BarChart } from 'lucide-react';

const Home: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="bg-primary-700 text-white">
          <div className="container mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0 md:pr-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                Track Skills & Growth With Visual Skill Trees
              </h1>
              <p className="text-lg md:text-xl mb-8 text-primary-100">
                Help your team visualize their learning paths and track progress with our intuitive skill tree system.
              </p>
              {user ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-primary-700"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    to="/register"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-primary-700"
                  >
                    Get Started
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-primary-700"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="bg-white bg-opacity-10 p-6 rounded-lg max-w-sm">
                <div className="flex justify-center mb-4">
                  <GitBranchPlus className="h-16 w-16 text-primary-300" />
                </div>
                <div className="space-y-4">
                  <div className="p-3 bg-white bg-opacity-20 rounded">
                    <h3 className="font-medium mb-1">Frontend Development</h3>
                    <div className="h-2 bg-white bg-opacity-30 rounded-full overflow-hidden">
                      <div className="h-full bg-accent-500 rounded-full" style={{ width: '70%' }}></div>
                    </div>
                  </div>
                  <div className="p-3 bg-white bg-opacity-20 rounded">
                    <h3 className="font-medium mb-1">DevOps Fundamentals</h3>
                    <div className="h-2 bg-white bg-opacity-30 rounded-full overflow-hidden">
                      <div className="h-full bg-accent-500 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                  <div className="p-3 bg-white bg-opacity-20 rounded">
                    <h3 className="font-medium mb-1">Cloud Architecture</h3>
                    <div className="h-2 bg-white bg-opacity-30 rounded-full overflow-hidden">
                      <div className="h-full bg-accent-500 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Features Section */}
        <div className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Key Features</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
                <div className="w-12 h-12 mb-4 rounded-full bg-primary-100 flex items-center justify-center">
                  <GitBranchPlus className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Visual Skill Trees</h3>
                <p className="text-gray-600">
                  Create clear learning paths with customizable skill trees that visually show progression and dependencies.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
                <div className="w-12 h-12 mb-4 rounded-full bg-secondary-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-secondary-600" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Role-Based Access</h3>
                <p className="text-gray-600">
                  Managers create and assign skill trees; users track completion and progress through defined paths.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
                <div className="w-12 h-12 mb-4 rounded-full bg-accent-100 flex items-center justify-center">
                  <BarChart className="h-6 w-6 text-accent-600" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Progress Tracking</h3>
                <p className="text-gray-600">
                  Easily track completion of skills and visualize progress across different learning paths.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="bg-gray-50 py-12">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Improve Your Team's Skills?</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Start building skill trees for your team and track their progress today.
            </p>
            
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                to="/register"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Get Started for Free
              </Link>
            )}
          </div>
        </div>
      </main>
      
      <footer className="bg-gray-800 text-gray-300 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <GitBranchPlus className="h-6 w-6 text-primary-400" />
              <span className="ml-2 text-xl font-bold text-white">SkillTree</span>
            </div>
            <div className="text-sm">
              &copy; {new Date().getFullYear()} SkillTree System. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;