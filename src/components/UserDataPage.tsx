'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type UserRecord = {
  id: number;
  username: string; // mapped from email
  password?: string; // only for create/update, not shown from API
};

export default function UserDataPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = useMemo(() => editingId !== null, [editingId]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetch('/api/users', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load users');
        const data = await res.json();
        const mapped: UserRecord[] = (Array.isArray(data) ? data : []).map((u: any) => ({ id: u.id, username: u.email }));
        setUsers(mapped);
      } catch (e: any) {
        setError(e?.message || 'Failed to load users');
      }
    };
    loadUsers();
  }, []);

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setEditingId(null);
    setIsFormOpen(false);
    setIsSubmitting(false);
    setError(null);
  };

  const handleCreate = async () => {
    if (!username.trim() || !password.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username.trim(), password: password.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Failed to create user');
      }
      const created = await res.json();
      setUsers(prev => [{ id: created.id, username: created.email }, ...prev]);
      resetForm();
    } catch (e: any) {
      setError(e?.message || 'Failed to create user');
      setIsSubmitting(false);
    }
  };

  const startEdit = (user: UserRecord) => {
    setEditingId(user.id);
    setUsername(user.username);
    setPassword('');
    setIsFormOpen(true);
  };

  const handleUpdate = async () => {
    if (editingId == null) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const payload: any = { email: username.trim() };
      if (password.trim()) payload.password = password.trim();
      const res = await fetch(`/api/users/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Failed to update user');
      }
      const updated = await res.json();
      setUsers(prev => prev.map(u => (u.id === editingId ? { id: updated.id, username: updated.email } : u)));
      resetForm();
    } catch (e: any) {
      setError(e?.message || 'Failed to update user');
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Failed to delete user');
      }
      setUsers(prev => prev.filter(u => u.id !== id));
      if (editingId === id) resetForm();
    } catch (e: any) {
      setError(e?.message || 'Failed to delete user');
    } finally {
      setIsDeleteOpen(false);
      setPendingDeleteId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return users;
    return users.filter(u => u.username.toLowerCase().includes(q));
  }, [users, search]);

  return (
    <div className="w-full h-full bg-white p-4 md:p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Data</h1>
          <p className="text-sm text-gray-600">Manage application users</p>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{error}</div>
      )}
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => { setIsFormOpen(true); setEditingId(null); setUsername(''); setPassword(''); }}>
            Add User
          </Button>
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search username..."
            className="w-56"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-4 py-3 border-b">Username (Email)</th>
                <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider px-4 py-3 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={2}>No users</td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800 border-t">{u.username}</td>
                    
                    <td className="px-4 py-3 text-sm text-gray-800 border-t">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEdit(u)}
                          className="px-3 py-1.5 text-xs rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => { setPendingDeleteId(u.id); setIsDeleteOpen(true); }}
                          className="px-3 py-1.5 text-xs rounded-md bg-red-50 text-red-700 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Dialog (Radix UI) */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit User' : 'Create User'}</DialogTitle>
            <DialogDescription>Fill the required fields below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Username (Email)</Label>
              <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter email" />
            </div>
            <div className="grid gap-2">
              <Label>Password {isEditing && <span className="text-xs text-muted-foreground">(leave blank to keep)</span>}</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={isEditing ? 'Leave blank to keep current password' : 'Enter password'} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => resetForm()}>Cancel</Button>
            {isEditing ? (
              <Button onClick={handleUpdate} disabled={isSubmitting}>Update</Button>
            ) : (
              <Button onClick={handleCreate} disabled={isSubmitting}>Create</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog (Radix UI) */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingDeleteId && handleDelete(pendingDeleteId)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


