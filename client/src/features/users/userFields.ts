import type { RegisterOptions } from "react-hook-form";
import type { User } from "./types";

export type UserField = {
  name: keyof Omit<User, "_id" | "createdAt" | "updatedAt">;
  label: string;
  type: "text" | "email" | "tel" | "date";
  placeholder?: string;
  required?: boolean;
  rules: RegisterOptions;
};

export const userFields: UserField[] = [
  {
    name: "firstName",
    label: "First Name",
    type: "text",
    placeholder: "John",
    required: true,
    rules: { required: "First name is required", minLength: { value: 2, message: "Min 2 chars" } },
  },
  {
    name: "lastName",
    label: "Last Name",
    type: "text",
    placeholder: "Doe",
    required: true,
    rules: { required: "Last name is required", minLength: { value: 2, message: "Min 2 chars" } },
  },
  {
    name: "phoneNumber",
    label: "Phone Number",
    type: "tel",
    placeholder: "9876543210",
    required: true,
    rules: {
      required: "Phone is required",
      minLength: { value: 10, message: "Min 10 digits" },
      maxLength: { value: 20, message: "Max 20 digits" },
    },
  },
  {
    name: "email",
    label: "Email Address",
    type: "email",
    placeholder: "john@example.com",
    required: true,
    rules: {
      required: "Email is required",
      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" },
    },
  },
  {
    name: "dateOfBirth",
    label: "Date of Birth",
    type: "date",
    required: false,
    rules: {},
  },
  {
    name: "address",
    label: "Address",
    type: "text",
    placeholder: "123 Main St",
    required: false,
    rules: { maxLength: { value: 200, message: "Max 200 chars" } },
  },
];
