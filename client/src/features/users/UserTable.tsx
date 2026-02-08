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
  if (users.length === 0) {
    return (
      <div className="py-12 text-center">
        <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM6 20H1v-2a6 6 0 016-6v0a6 6 0 016 6v2H6z" />
        </svg>
        <p className="mt-4 text-slate-600">No users found</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table - hidden on mobile */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {userFields.map((f) => (
                <th key={String(f.name)} className="px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                  {f.label}
                </th>
              ))}
              <th className="px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {users.map((u) => (
              <tr
                key={u._id}
                className="hover:bg-slate-50 transition-colors"
              >
                {userFields.map((f) => (
                  <td key={String(f.name)} className="px-4 py-4 text-slate-900">
                    <div className="truncate max-w-xs">
                      {formatValue((u as any)[f.name], f.name as string)}
                    </div>
                  </td>
                ))}
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={() => onEdit(u)}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="danger" 
                      onClick={() => onDelete(u)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view - visible only on lg: breakpoint */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:hidden">
        {users.map((u) => (
          <div
            key={u._id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Header with name */}
            <div className="mb-5 pb-5 border-b border-slate-100">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-lg font-bold text-white">
                    {u.firstName?.[0]?.toUpperCase()}{u.lastName?.[0]?.toUpperCase()}
                  </span>
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-slate-900 truncate">
                    {u.firstName} {u.lastName}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <svg className="h-4 w-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-slate-600 truncate">{u.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Details grid */}
            <div className="space-y-4">
              {/* Phone */}
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2.5 bg-blue-50 rounded-lg flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone</p>
                  <p className="mt-1 text-slate-900 font-medium">{u.phoneNumber}</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2.5 bg-amber-50 rounded-lg flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</p>
                  <p className="mt-1 text-slate-900 font-medium truncate">{u.email}</p>
                </div>
              </div>

              {/* Date of Birth */}
              {u.dateOfBirth && (
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2.5 bg-purple-50 rounded-lg flex-shrink-0">
                    <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Date of Birth</p>
                    <p className="mt-1 text-slate-900 font-medium">
                      {new Date(u.dateOfBirth).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Address */}
              {u.address && (
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2.5 bg-emerald-50 rounded-lg flex-shrink-0">
                    <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Address</p>
                    <p className="mt-1 text-slate-900 font-medium">{u.address}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-4 border-t border-slate-100">
              <Button
                size="sm"
                variant="secondary"
                className="flex-1"
                onClick={() => onEdit(u)}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="danger"
                className="flex-1"
                onClick={() => onDelete(u)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function formatValue(value: any, fieldName: string): string {
  if (!value) return '';
  
  if (fieldName === 'dateOfBirth' && value) {
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  return String(value);
}
