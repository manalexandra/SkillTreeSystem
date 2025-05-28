import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSkillTreeStore } from '../stores/skillTreeStore';
import Navbar from '../components/layout/Navbar';
import SkillTreeView from '../components/skill-tree/SkillTreeView';
import SkillNodeForm from '../components/skill-tree/SkillNodeForm';
import CreateTreeForm from '../components/skill-tree/CreateTreeForm';
import { Loader2, Plus, Edit, GitBranchPlus, TreeDeciduous } from 'lucide-react';
import type { SkillNode as SkillNodeType } from '../types';

const ManageTrees: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { trees, fetchTrees, loading: treesLoading } = useSkillTreeStore();
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
  const [showCreateTree, setShowCreateTree] = useState(false);
  const [showNodeForm, setShowNodeForm] = useState(false);
  const [editNode, setEditNode] = useState<SkillNodeType | undefined>(undefined);
  const navigate = useNavigate();

  // Redirect if not authenticated or not a manager
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'manager')) {
      navigate('/dashboard');
    }
  }, [authLoading, user, navigate]);

  // Fetch trees on mount
  useEffect(() => {
    if (user && user.role === 'manager') {
      fetchTrees();
    }
  }, [fetchTrees, user]);

  // Set first tree as selected by default
  useEffect(() => {
    if (trees.length > 0 && !selectedTreeId) {
      setSelectedTreeId(trees[0].id);
    }
  }, [trees, selectedTreeId]);

  const handleCreateTreeSuccess = (treeId: string) => {
    setSelectedTreeId(treeId);
  };

  const handleEditNode = (node: SkillNodeType) => {
    setEditNode(node);
    setShowNodeForm(true);
  };

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
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Manage Skill Trees</h1>
            <button
              onClick={() => setShowCreateTree(true)}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" />
              Create New Tree
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-start">
            {/* Sidebar with tree selection */}
            <div className="w-full md:w-64 mb-6 md:mb-0 md:mr-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Your Skill Trees</h2>
              
              {trees.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <TreeDeciduous className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600">No skill trees yet.</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Create your first tree to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {trees.map((tree) => (
                    <button
                      key={tree.id}
                      onClick={() => setSelectedTreeId(tree.id)}
                      className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
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
            <div className="flex-grow">
              {selectedTreeId ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Tree Structure</h3>
                    <button
                      onClick={() => {
                        setEditNode(undefined);
                        setShowNodeForm(true);
                      }}
                      className="flex items-center px-3 py-1.5 bg-secondary-600 text-white text-sm rounded-md hover:bg-secondary-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Node
                    </button>
                  </div>
                  
                  <SkillTreeView 
                    treeId={selectedTreeId} 
                    isEditable={true}
                    onEditNode={handleEditNode}
                  />
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <GitBranchPlus className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No Skill Tree Selected</h3>
                  <p className="text-gray-600">
                    {trees.length > 0
                      ? 'Please select a skill tree from the sidebar'
                      : 'Create your first skill tree to get started'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Forms */}
      {showCreateTree && (
        <CreateTreeForm 
          onClose={() => setShowCreateTree(false)} 
          onSuccess={handleCreateTreeSuccess}
        />
      )}
      
      {showNodeForm && selectedTreeId && (
        <SkillNodeForm 
          treeId={selectedTreeId} 
          node={editNode}
          onClose={() => {
            setShowNodeForm(false);
            setEditNode(undefined);
          }}
          isEdit={!!editNode}
        />
      )}
    </div>
  );
};

export default ManageTrees;