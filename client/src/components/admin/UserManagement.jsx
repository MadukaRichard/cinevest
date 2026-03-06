/**
 * ===========================================
 * User Management Component
 * ===========================================
 * 
 * Admin interface for managing users.
 * Wired to real API with search, role filter, pagination.
 */

import { useState, useEffect, useCallback } from 'react';
import { Search, MoreVertical, Shield, Trash2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import toast from 'react-hot-toast';
import api from '../../utils/api';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = { page, limit: 20 };
      if (roleFilter) params.role = roleFilter;
      const res = await api.get('/admin/users', { params });
      setUsers(res.data.users || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [page, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleUpdate = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success(`User role updated to ${newRole}`);
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted');
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  // Client-side search filter
  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground text-sm">{total} total users</p>
        </div>
      </div>

      {/* Search + Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5" />}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary-500"
          >
            <option value="">All Roles</option>
            <option value="user">Users</option>
            <option value="vip">VIP</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-48 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredUsers.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">User</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm hidden sm:table-cell">Email</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Role</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm hidden md:table-cell">Joined</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="border-b border-border hover:bg-accent/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                            {user.name?.charAt(0) || '?'}
                          </div>
                          <span className="text-foreground font-medium truncate">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-sm hidden sm:table-cell">{user.email || '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          user.role === 'admin' ? 'bg-red-500/20 text-red-500' :
                          user.role === 'vip' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-blue-500/20 text-blue-500'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-sm hidden md:table-cell">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => { setSelectedUser(user); setIsModalOpen(true); }}
                          className="p-2 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No users found</p>
          </div>
        )}
      </Card>

      {/* User Actions Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Manage: ${selectedUser?.name || 'User'}`}
      >
        {selectedUser && (
          <div className="space-y-5">
            {/* User info */}
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium">
                {selectedUser.name?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-medium text-foreground">{selectedUser.name}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email || 'No email'}</p>
              </div>
            </div>

            {/* Role update */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Update Role</label>
              <div className="flex gap-2">
                {['user', 'vip', 'admin'].map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleUpdate(selectedUser._id, role)}
                    className={`px-4 py-2 rounded-lg capitalize text-sm font-medium transition-colors ${
                      selectedUser.role === role
                        ? 'bg-primary-500 text-white'
                        : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-border" />
            <Button
              variant="danger"
              className="w-full"
              onClick={() => handleDeleteUser(selectedUser._id)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete User
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default UserManagement;
