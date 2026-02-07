import React, { useMemo, useState, useEffect } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";

import { UserForm } from "../features/users/UserForm";
import { UserTable } from "../features/users/UserTable";
import { ConfirmDelete } from "../features/users/ConfirmDelete";
import type { User } from "../features/users/types";
import { getUsers, createUser, updateUser, deleteUser } from "../services/api";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter((u) =>
      [u.firstName, u.lastName, u.phoneNumber, u.email].some((v) =>
        String(v).toLowerCase().includes(s)
      )
    );
  }, [users, q]);

  const formInitial = useMemo(() => {
    if (!editing) return undefined;
    const { _id, createdAt, updatedAt, ...rest } = editing;
    return rest;
  }, [editing]);

  const handleSubmit = async (vals: any) => {
    try {
      setSubmitting(true);
      setError(null);

      if (editing) {
        // Update user
        const updated = await updateUser(editing._id, vals);
        setUsers((prev) =>
          prev.map((u) => (u._id === editing._id ? updated : u))
        );
      } else {
        // Create user
        const newUser = await createUser(vals);
        setUsers((prev) => [newUser, ...prev]);
      }

      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save user");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      setError(null);
      await deleteUser(deleteTarget._id);
      setUsers((prev) => prev.filter((u) => u._id !== deleteTarget._id));
      if (editing?._id === deleteTarget._id) setEditing(null);
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">User Management</h1>
            <p className="text-sm text-slate-600">
              CRUD app with validation and extensible fields
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge>Total: {users.length}</Badge>
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              + New User
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <Card
          title="Users"
          subtitle="Search, edit and delete user records"
          right={
            <div className="w-[260px]">
              <Input
                label="Search"
                hint="name / phone / email"
                required={false}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Type to search..."
              />
            </div>
          }
        >
          {loading ? (
            <div className="py-8 text-center text-slate-600">
              Loading users...
            </div>
          ) : (
            <>
              <UserTable
                users={filtered}
                onEdit={(u) => {
                  setEditing(u);
                  setFormOpen(true);
                }}
                onDelete={(u) => setDeleteTarget(u)}
              />

              {users.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <p className="text-sm text-slate-700">
                    No users yet. Create your first user to get started.
                  </p>
                  <div className="mt-3">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditing(null);
                        setFormOpen(true);
                      }}
                    >
                      Create first user
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </Card>
      </main>

      {/* Create/Edit Modal */}
      <Modal
        open={formOpen}
        title={editing ? "Edit User" : "Create User"}
        description={editing ? "Update user details and save changes." : "Fill the form and create a new user."}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      >
        <UserForm
          initialValues={formInitial}
          submitText={editing ? "Update User" : "Create User"}
          onCancel={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSubmit={handleSubmit}
          loading={submitting}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDelete
        open={Boolean(deleteTarget)}
        user={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={submitting}
      />
    </div>
  );
}
