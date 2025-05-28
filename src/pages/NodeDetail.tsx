import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSkillTreeStore } from "../stores/skillTreeStore";
import { useAuth } from "../context/AuthContext";
import type { SkillNode as SkillNodeType } from "../types";

const NodeDetail: React.FC = () => {
  const { nodeId } = useParams<{ nodeId: string }>();
  const { user } = useAuth();
  const { nodes, markNodeCompleted, userProgress } = useSkillTreeStore();
  const [node, setNode] = useState<SkillNodeType | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !nodeId) return;
    // Find the node in all trees (or fetch if needed)
    const foundNode = nodes.find((n) => n.id === nodeId);
    if (foundNode) {
      setNode(foundNode);
      setLoading(false);
    } else {
      // Optionally: fetch data if not found
      setLoading(false);
    }
  }, [nodeId, nodes, user]);

  const handleMarkDone = () => {
    if (user && node) {
      markNodeCompleted(user.id, node.id, true);
    }
  };

  const handleUnmarkDone = () => {
    if (user && node) {
      markNodeCompleted(user.id, node.id, false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  if (!node) {
    return <div className="flex items-center justify-center min-h-screen text-red-500">Node not found.</div>;
  }

  const isCompleted = userProgress[node.id] === true;

  return (
    <div className="max-w-xl mx-auto mt-8 bg-white rounded-lg shadow p-6">
      <button onClick={() => navigate(-1)} className="mb-4 text-primary-600 hover:underline">&larr; Back</button>
      <h1 className="text-2xl font-bold mb-2">{node.title}</h1>
      <p className="mb-4 text-gray-700">{node.description}</p>
      <div className="mb-4">
        Status: {isCompleted ? (
          <span className="text-green-600 font-semibold">Done</span>
        ) : (
          <span className="text-yellow-600 font-semibold">Not Done</span>
        )}
      </div>
      {!isCompleted ? (
        <button
          onClick={handleMarkDone}
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
        >
          Mark as Done
        </button>
      ) : (
        <button
          onClick={handleUnmarkDone}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
        >
          Mark as Not Done
        </button>
      )}
    </div>
  );
};

export default NodeDetail;
