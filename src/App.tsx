import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ManageTrees from './pages/ManageTrees';
import NodeDetail from './pages/NodeDetail';
import RoadmapView from "./pages/RoadmapView";
import AdminPanel from "./pages/AdminPanel";
import PeopleOverview from './pages/PeopleOverview';
import PersonDetail from './pages/PersonDetail';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/manage" element={<ManageTrees />} />
          <Route path="/node/:nodeId" element={<NodeDetail />} />
          <Route path="/roadmap" element={<RoadmapView />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/people" element={<PeopleOverview />} />
          <Route path="/people/:userId" element={<PersonDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
   </AuthProvider>
  );
}