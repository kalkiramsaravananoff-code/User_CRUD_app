import React from "react";
import { Button } from "../../components/ui/Button";
import { userFields } from "./userFields";
import type { User } from "./types";

export function UserTable({
  users,
  onEdit,
  onDelete,
}: {
  users: User[];
  onEdit: (u: User) => void;
  onDelete: (u: User) => void;
}) {
  // Only show required fields in the table
  const displayFields = userFields.filter((f) => f.required);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50">
          <tr className="text-slate-700">
            {displayFields.map((f) => (
              <th key={String(f.name)} className="px-4 py-3 text-xs font-extrabold uppercase tracking-wide">
                {f.label}
              </th>
            ))}
            <th className="px-4 py-3 text-xs font-extrabold uppercase tracking-wide">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="bg-white">
          {users.length === 0 ? (
            <tr>
              <td className="px-4 py-10 text-center text-slate-500" colSpan={displayFields.length + 1}>
                No users found.
              </td>
            </tr>
          ) : (
            users.map((u, idx) => (
              <tr
                key={u._id}
                className={[
                  "border-t border-slate-200 hover:bg-slate-50",
                  idx % 2 === 1 ? "bg-white" : "bg-slate-50/20",
                ].join(" ")}
              >
                {displayFields.map((f) => (
                  <td key={String(f.name)} className="px-4 py-3 text-slate-900">
                    {(u as any)[f.name]}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => onEdit(u)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => onDelete(u)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
