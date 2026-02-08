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
import { showApiToast } from "../utils/toastHelper";

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
      const data = await showApiToast("fetch", () => getUsers());
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
        const updated = await showApiToast("update", () =>
          updateUser(editing._id, vals)
        );
        setUsers((prev) =>
          prev.map((u) => (u._id === editing._id ? updated : u))
        );
      } else {
        // Create user
        const newUser = await showApiToast("create", () => createUser(vals));
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
      await showApiToast("delete", () => deleteUser(deleteTarget._id));
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-50 to-slate-100">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 19H9a6 6 0 016-6v0a6 6 0 016 6v0a2 2 0 01-2 2H7a2 2 0 01-2-2v0a6 6 0 016-6v0a6 6 0 016 6" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
                <p className="text-sm text-slate-500">Manage all user records</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:flex-nowrap">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 border border-blue-100">
              <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v2h8v-2zM2 15a4 4 0 008 0v2H0v-2z" />
              </svg>
              <span className="text-sm font-semibold text-blue-900">{users.length}</span>
            </div>
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="gap-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New User
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
            <svg className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}

        <Card
          title="Users"
          subtitle="Search, edit and delete user records"
          right={
            <div className="w-full sm:w-[260px]">
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
            <div className="py-12 text-center">
              <div className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 mb-4"></div>
              <p className="text-slate-600 font-medium">Loading users...</p>
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
                <div className="mt-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-8 text-center">
                  <svg className="mx-auto h-12 w-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <p className="text-slate-700 font-semibold mb-2">No users yet</p>
                  <p className="text-slate-600 text-sm mb-4">
                    Create your first user to get started
                  </p>
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
