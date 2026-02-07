import React from "react";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import type { User } from "./types";

export function ConfirmDelete({
  open,
  user,
  onClose,
  onConfirm,
  loading = false,
}: {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      title="Delete user?"
      description="This action cannot be undone."
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-900">
            You are about to delete{" "}
            <span className="font-extrabold">
              {user ? `${user.firstName} ${user.lastName}` : "this user"}
            </span>
            .
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
