import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSkillTreeStore } from '../stores/skillTreeStore';
import SkillTreeView from '../components/skill-tree/SkillTreeView';
import Navbar from '../components/layout/Navbar';
import { GitBranchPlus, TreeDeciduous } from 'lucide-react';

import { fetchUserCount, fetchSkillTreeCount } from '../services/dashboardService';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { trees, fetchTrees, nodes } = useSkillTreeStore();
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Dashboard metrics state
  const [userCount, setUserCount] = useState<number | null>(null);
  const [treeCount, setTreeCount] = useState<number | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  // Fetch dashboard metrics
  useEffect(() => {
    let mounted = true;
    setMetricsLoading(true);
    Promise.all([fetchUserCount(), fetchSkillTreeCount()])
      .then(([users, trees]) => {
        if (mounted) {
          setUserCount(users);
          setTreeCount(trees);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setMetricsLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      {/* Dashboard Metrics */}
      <div className="container mx-auto px-4 pt-8 pb-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
            <div>
              <div className="text-gray-500 text-sm">Total Users</div>
              <div className="text-2xl font-bold text-gray-900">
                {metricsLoading ? <span className="text-gray-400">Loading...</span> : userCount}
              </div>
            </div>
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 3.13a4 4 0 110 7.75M8 3.13a4 4 0 100 7.75" /></svg>
          </div>
          <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
            <div>
              <div className="text-gray-500 text-sm">Total Skill Trees</div>
              <div className="text-2xl font-bold text-gray-900">
                {metricsLoading ? <span className="text-gray-400">Loading...</span> : treeCount}
              </div>
            </div>
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2C9.243 2 7 4.243 7 7c0 2.757 2.243 5 5 5s5-2.243 5-5c0-2.757-2.243-5-5-5zm0 14c-4.418 0-8 1.79-8 4v2h16v-2c0-2.21-3.582-4-8-4z" /></svg>
          </div>
        </div>
      </div>
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
                  {trees.map((tree) => {
  // Find the root node for the tree
  const rootNode = nodes.find(
    (n) => n.treeId === tree.id && n.parentId === null
  );
  const rootNodeId = rootNode ? rootNode.id : tree.id;
  return (
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
        <Link to={`/node/${rootNodeId}`} className="truncate text-primary-700 hover:underline">
          {tree.name}
        </Link>
      </div>
    </button>
  );
})}
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