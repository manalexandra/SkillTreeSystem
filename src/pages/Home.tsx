import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import { GitBranchPlus, Users, Award, BarChart, ChevronRight, CheckCircle } from 'lucide-react';

const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section with Gradient Background */}
        <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
          <div className="container mx-auto px-4 py-20 md:py-32">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center justify-center p-2 bg-white/10 rounded-full backdrop-blur-sm mb-6">
                <GitBranchPlus className="h-6 w-6 text-primary-200" />
                <span className="ml-2 text-sm font-medium text-primary-100">Skill Development Platform</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Master Your Skills with Visual Learning Paths
              </h1>
              <p className="text-xl md:text-2xl mb-10 text-primary-100 max-w-2xl mx-auto">
                Transform your team's learning journey with interactive skill trees and progress tracking
              </p>

              {user ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-8 py-4 text-lg font-medium rounded-full bg-white text-primary-700 hover:bg-primary-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Go to Dashboard
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/register"
                    
                  className="inline-flex items-center px-8 py-4 text-lg bg-white text-primary-700 font-medium rounded-full border-2 border-white/30 hover:border-white/50 backdrop-blur-sm transition-all duration-200"
                  >
                    Get Started Free
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center px-8 py-4 text-lg font-medium rounded-full border-2 border-white/30 hover:border-white/50 backdrop-blur-sm transition-all duration-200"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-b from-transparent to-white/5"></div>
        </div>

        {/* Features Grid */}
        <div className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Everything You Need to Succeed
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Powerful features designed to make skill development engaging and effective
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl transform -rotate-6 group-hover:-rotate-3 transition-transform duration-300 opacity-10"></div>
                <div className="relative bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="w-14 h-14 mb-6 rounded-full bg-primary-100 flex items-center justify-center">
                    <GitBranchPlus className="h-7 w-7 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Visual Skill Trees</h3>
                  <p className="text-gray-600">
                    Create intuitive learning paths with customizable skill trees that visualize progression and dependencies.
                  </p>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-2xl transform -rotate-6 group-hover:-rotate-3 transition-transform duration-300 opacity-10"></div>
                <div className="relative bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="w-14 h-14 mb-6 rounded-full bg-secondary-100 flex items-center justify-center">
                    <Users className="h-7 w-7 text-secondary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Team Management</h3>
                  <p className="text-gray-600">
                    Assign and track skills across your entire team with role-based access control and progress monitoring.
                  </p>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-accent-500 to-accent-600 rounded-2xl transform -rotate-6 group-hover:-rotate-3 transition-transform duration-300 opacity-10"></div>
                <div className="relative bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="w-14 h-14 mb-6 rounded-full bg-accent-100 flex items-center justify-center">
                    <BarChart className="h-7 w-7 text-accent-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Progress Analytics</h3>
                  <p className="text-gray-600">
                    Get detailed insights into skill development with visual progress tracking and completion metrics.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof Section */}
        <div className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center p-2 bg-success-100 rounded-full mb-6">
                <CheckCircle className="h-5 w-5 text-success-600" />
                <span className="ml-2 text-sm font-medium text-success-700">Trusted by Teams</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-10">
                Join thousands of teams already growing with SkillTree
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
                <div className="aspect-[3/1] bg-gray-200 rounded-lg"></div>
                <div className="aspect-[3/1] bg-gray-200 rounded-lg"></div>
                <div className="aspect-[3/1] bg-gray-200 rounded-lg"></div>
                <div className="aspect-[3/1] bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Team's Skills?
            </h2>
            <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
              Join thousands of teams already using SkillTree to track and improve their skills.
            </p>

            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center px-8 py-4 text-lg font-medium rounded-full bg-white text-primary-700 hover:bg-primary-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Go to Dashboard
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            ) : (
              <Link
                to="/register"
                className="inline-flex items-center px-8 py-4 text-lg font-medium rounded-full bg-white text-primary-700 hover:bg-primary-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Get Started Free
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <GitBranchPlus className="h-6 w-6 text-primary-400" />
                <span className="ml-2 text-xl font-bold text-white">SkillTree</span>
              </div>
              <p className="text-gray-400">
                Empowering teams to grow and succeed together.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} SkillTree System. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;