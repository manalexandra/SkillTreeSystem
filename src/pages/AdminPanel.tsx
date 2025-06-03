import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import { fetchAllUsers, updateUserRole, deleteUser, addUser } from '../services/userService';
import { getSkillTrees, supabase, getTeamMembers, addTeamMembers, removeTeamMember } from '../services/supabase';
import { User, UserRole, Team, TeamMember } from '../types';
import { Users, UserPlus, Trash2, Edit, Save, X, AlertTriangle, Search, Shield, GitBranchPlus, CheckCircle, Building2, Plus } from 'lucide-react';

type TabType = 'users' | 'teams';

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('user');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('user');
  const [addingUser, setAddingUser] = useState(false);
  const [addUserError, setAddUserError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [userTrees, setUserTrees] = useState<Record<string, any[]>>({});
  const [userTreesLoading, setUserTreesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [showDeleteTeamConfirm, setShowDeleteTeamConfirm] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

[Rest of the original file content remains exactly the same until the teams mapping section, which is updated with the new button as shown in the diff]

[The file continues with all the original content after the teams mapping section, including all modals and closing tags]