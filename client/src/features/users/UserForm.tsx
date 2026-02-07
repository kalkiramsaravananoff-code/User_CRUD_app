import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { userFields } from "./userFields";
import type { User } from "./types";

type FormValues = Omit<User, "_id" | "createdAt" | "updatedAt">;

export function UserForm({
  initialValues,
  submitText,
  onSubmit,
  onCancel,
  loading = false,
}: {
  initialValues?: FormValues;
  submitText: string;
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    defaultValues: initialValues ?? {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      email: "",
      dateOfBirth: "",
      address: "",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    reset(
      initialValues ?? {
        firstName: "",
        lastName: "",
        phoneNumber: "",
        email: "",
        dateOfBirth: "",
        address: "",
      }
    );
  }, [initialValues, reset]);

  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit((vals) => onSubmit(vals))}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {userFields.map((f) => {
          const extra: any = {};
          if (f.name === "phoneNumber") {
            extra.inputMode = "numeric";
            extra.maxLength = 10;
            extra.onInput = (e: React.FormEvent<HTMLInputElement>) => {
              const el = e.currentTarget;
              el.value = el.value.replace(/\D/g, "").slice(0, 10);
            };
          }

          return (
            <Input
              key={String(f.name)}
              label={f.label}
              required={f.required}
              type={f.type}
              placeholder={f.placeholder}
              error={(errors as any)?.[f.name]?.message as string | undefined}
              {...register(f.name, f.rules)}
              {...extra}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          loading={isSubmitting || loading}
          disabled={(!isDirty && !!initialValues) || loading}
        >
          {submitText}
        </Button>
      </div>
    </form>
  );
}
