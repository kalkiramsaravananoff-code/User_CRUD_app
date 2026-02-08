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
      title="Delete user"
      description="This action cannot be undone. Please confirm to delete this user."
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex gap-3">
          <svg className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-800 font-medium">
            You are about to delete{" "}
            <span className="font-bold">
              {user ? `${user.firstName} ${user.lastName}` : "this user"}
            </span>
            . This cannot be reversed.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button 
            variant="secondary" 
            onClick={onClose} 
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={onConfirm} 
            loading={loading}
            className="w-full sm:w-auto"
          >
            Delete user
          </Button>
        </div>
      </div>
    </Modal>
  );
}
