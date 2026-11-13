import React, { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { UserDTO, CreateUserInput, UserRole } from '@lead-crm/shared';
import { UserCog, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import {
  Card,
  Button,
  Input,
  Select,
  Modal,
  Pill,
} from '../../components/ui/index.js';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('sales');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.get<UserDTO[]>('/users');
      setUsers(data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload: CreateUserInput = {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      };

      await api.post('/users', payload);
      setShowAddModal(false);
      setName('');
      setEmail('');
      setPassword('');
      fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user: UserDTO) => {
    try {
      await api.patch(`/users/${user.id}`, { active: !user.active });
      fetchUsers();
    } catch (err: unknown) {
      alert(`Error updating user: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDeleteUser = async (user: UserDTO) => {
    if (!confirm(`Are you sure you want to soft-delete user [${user.email}]?`)) return;
    try {
      await api.delete(`/users/${user.id}`);
      fetchUsers();
    } catch (err: unknown) {
      alert(`Error deleting user: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="font-serif text-3xl font-bold text-tx flex items-center gap-3">
            <UserCog className="w-7 h-7 text-tx" />
            <span>Team &amp; User Management</span>
          </h1>
          <p className="text-sm text-tx-muted mt-1 font-sans">
            Configure user roles, account activation, and view two-factor authentication compliance
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setShowAddModal(true);
            setError(null);
          }}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add Team Member</span>
        </Button>
      </div>

      {/* Users Table */}
      <Card className="p-6 space-y-4">
        <div className="pb-3 border-b border-border">
          <h2 className="font-serif text-lg font-bold text-tx">Active Accounts ({users.length})</h2>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center text-tx-muted text-xs">
            <span className="w-4 h-4 border-2 border-tx border-t-transparent rounded-full animate-spin mr-2" />
            Loading team users...
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-tx-muted text-xs">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-tx border-collapse">
              <thead>
                <tr className="border-b border-border text-tx-subtle text-[11px]">
                  <th className="py-2.5 px-3 font-medium">User</th>
                  <th className="py-2.5 px-3 font-medium">Email</th>
                  <th className="py-2.5 px-3 font-medium">Role</th>
                  <th className="py-2.5 px-3 font-medium">2FA Status</th>
                  <th className="py-2.5 px-3 font-medium">Account Status</th>
                  <th className="py-2.5 px-3 font-medium">Last Login</th>
                  <th className="py-2.5 px-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-sans">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-row-hover transition text-xs">
                    <td className="py-3 px-3 font-semibold text-tx flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-surface-2 border border-border text-tx flex items-center justify-center font-bold text-[10px] font-mono">
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-serif font-semibold">{u.name}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-tx-muted">{u.email}</td>
                    <td className="py-3 px-3">
                      <Pill active={u.role === 'admin'} className="text-[10px] uppercase font-mono py-0 px-2">
                        {u.role}
                      </Pill>
                    </td>
                    <td className="py-3 px-3">
                      {u.twoFactorEnabled ? (
                        <span className="flex items-center gap-1.5 text-tx font-medium">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Enabled</span>
                        </span>
                      ) : (
                        <span className="text-tx-subtle">Disabled</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <Pill active={u.active} className="text-[10px]">
                        {u.active ? 'Active' : 'Deactivated'}
                      </Pill>
                    </td>
                    <td className="py-3 px-3 text-tx-subtle font-mono text-[11px]">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(u)}
                        >
                          {u.active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-1.5 text-tx-subtle hover:text-tx rounded transition"
                          title="Soft delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Team Member"
      >
        {error && (
          <Card className="p-3 mb-4 text-xs text-tx">
            {error}
          </Card>
        )}

        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Full Name"
            required
            placeholder="e.g. Sarah Connor"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            type="email"
            label="Email Address"
            required
            placeholder="sarah@crm.local"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            type="password"
            label="Initial Password"
            required
            minLength={8}
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Select
            label="Role & Permissions"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            <option value="sales">Sales (Own leads, calls, email, chat)</option>
            <option value="manager">Manager (All team leads, assign, reports)</option>
            <option value="viewer">Viewer (Read-only)</option>
            <option value="admin">Administrator (Full access, console, keys)</option>
          </Select>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
            >
              Create Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
