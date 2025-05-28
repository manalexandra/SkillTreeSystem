import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSkillTreeStore } from '../stores/skillTreeStore';
import SkillTreeView from '../components/skill-tree/SkillTreeView';
import Navbar from '../components/layout/Navbar';
import { Loader2, GitBranchPlus, TreeDeciduous } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { trees, fetchTrees, loading: treesLoading } = useSkillTreeStore();
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  // Fetch trees on mount
  useEffect(() => {
    if (user) {
      fetchTrees();
    }
  }, [fetchTrees, user]);

  // Set first tree as selected by default
  useEffect(() => {
    if (trees.length > 0 && !selectedTreeId) {
      setSelectedTreeId(trees[0].id);
    }
  }, [trees, selectedTreeId]);

  if (authLoading || treesLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="flex-grow container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow">
          <div className="flex flex-col lg:flex-row lg:min-h-[600px]">
            {/* Sidebar with tree selection */}
            <div className="lg:w-64 p-6 border-b lg:border-b-0 lg:border-r border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Your Skill Trees</h2>
              
              {trees.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <TreeDeciduous className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600">No skill trees available yet.</p>
                  {user?.role === 'manager' && (
                    <p className="text-sm text-gray-500 mt-2">
                      Go to the Manage section to create your first tree!
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {trees.map((tree) => (
                    <button
                      key={tree.id}
                      onClick={() => setSelectedTreeId(tree.id)}
                      className={`w-full text-left px-4 py-3 rounded-md transition-all duration-200 ${
                        selectedTreeId === tree.id
                          ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <GitBranchPlus className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{tree.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Main content area */}
            <div className="flex-grow p-6">
              {selectedTreeId ? (
                <SkillTreeView treeId={selectedTreeId} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <GitBranchPlus className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No Skill Tree Selected</h3>
                    <p className="text-gray-600">
                      {trees.length > 0
                        ? 'Please select a skill tree from the sidebar'
                        : 'No skill trees available yet'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;