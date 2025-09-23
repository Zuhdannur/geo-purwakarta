'use client';

import { useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as AlertDialog from '@radix-ui/react-alert-dialog';

type UserRecord = {
  id: string;
  username: string;
  password: string;
};

export default function UserDataPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const isEditing = useMemo(() => editingId !== null, [editingId]);

  useEffect(() => {
    // Seed with sample user for first-time UX; in real app load from API
    setUsers([
      { id: crypto.randomUUID(), username: 'admin', password: 'secret' },
      { id: crypto.randomUUID(), username: 'operator', password: 'purwakarta' }
    ]);
  }, []);

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleCreate = () => {
    if (!username.trim() || !password.trim()) return;
    const newUser: UserRecord = { id: crypto.randomUUID(), username: username.trim(), password: password.trim() };
    setUsers([newUser, ...users]);
    resetForm();
  };

  const startEdit = (user: UserRecord) => {
    setEditingId(user.id);
    setUsername(user.username);
    setPassword(user.password);
    setIsFormOpen(true);
  };

  const handleUpdate = () => {
    if (!editingId) return;
    setUsers(prev => prev.map(u => (u.id === editingId ? { ...u, username: username.trim(), password: password.trim() } : u)));
    resetForm();
  };

  const handleDelete = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    if (editingId === id) resetForm();
    setIsDeleteOpen(false);
    setPendingDeleteId(null);
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
          <p className="text-sm text-gray-600">Manage application users (UI only).</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setIsFormOpen(true); setEditingId(null); setUsername(''); setPassword(''); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
          >
            Add User
          </button>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search username..."
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-4 py-3 border-b">Username</th>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-4 py-3 border-b">Password</th>
                <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider px-4 py-3 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={3}>No users</td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800 border-t">{u.username}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 border-t">{u.password}</td>
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
      <Dialog.Root open={isFormOpen} onOpenChange={setIsFormOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed z-50 left-1/2 top-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-5 focus:outline-none">
            <div className="mb-4">
              <Dialog.Title className="text-lg font-semibold text-gray-900">{isEditing ? 'Edit User' : 'Create User'}</Dialog.Title>
              <Dialog.Description className="text-xs text-gray-500">Fill the required fields below.</Dialog.Description>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Username</label>
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <Dialog.Close asChild>
                <button
                  onClick={() => { resetForm(); }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm"
                >
                  Cancel
                </button>
              </Dialog.Close>
              {isEditing ? (
                <button
                  onClick={handleUpdate}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  Update
                </button>
              ) : (
                <button
                  onClick={handleCreate}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  Create
                </button>
              )}
            </div>
            <Dialog.Close asChild>
              <button aria-label="Close" className="absolute top-3 right-3 inline-flex items-center justify-center rounded-full p-1 text-gray-500 hover:bg-gray-100">
                <span className="sr-only">Close</span>
                ×
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation Dialog (Radix UI) */}
      <AlertDialog.Root open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <AlertDialog.Content className="fixed z-50 left-1/2 top-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-5 focus:outline-none">
            <AlertDialog.Title className="text-lg font-semibold text-gray-900">Delete User</AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-gray-700">
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialog.Description>
            <div className="mt-6 flex items-center justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <button
                  onClick={() => { setPendingDeleteId(null); }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm"
                >
                  Cancel
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  onClick={() => pendingDeleteId && handleDelete(pendingDeleteId)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  Delete
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}


