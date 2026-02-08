// Toast messages for all user CRUD operations
export const toastMessages = {
  // Success messages
  CREATE_SUCCESS: "User created successfully.",
  UPDATE_SUCCESS: "User details updated successfully.",
  DELETE_SUCCESS: "User deleted successfully.",
  
  // Generic error messages
  CREATE_ERROR: "Couldn't create the user. Please try again.",
  UPDATE_ERROR: "Couldn't update the user. Please try again.",
  DELETE_ERROR: "Couldn't delete the user. Please try again.",
  FETCH_ERROR: "Couldn't load users. Please try again.",
  
  // Specific error messages (by status code)
  DUPLICATE_EMAIL_PHONE: "A user with this email/phone already exists.",
  VALIDATION_ERROR: "Please fill in all required fields correctly.",
  UNAUTHORIZED: "Session expired. Please sign in again.",
  NOT_FOUND: "User not found. Please refresh and try again.",
  NETWORK_ERROR: "Network issue. Check your connection and try again.",
  SERVER_ERROR: "Something went wrong. Please try again shortly.",
  NO_CHANGES: "No changes to save.",
};

// Loading messages
export const toastLoadingMessages = {
  CREATE: "Creating user…",
  UPDATE: "Updating user…",
  DELETE: "Deleting user…",
  FETCH: "Loading users…",
};

// Map HTTP status codes to toast messages
export const getErrorMessageByStatus = (status: number): string => {
  switch (status) {
    case 400:
      return toastMessages.VALIDATION_ERROR;
    case 401:
      return toastMessages.UNAUTHORIZED;
    case 404:
      return toastMessages.NOT_FOUND;
    case 409:
      return toastMessages.DUPLICATE_EMAIL_PHONE;
    case 500:
    case 502:
    case 503:
      return toastMessages.SERVER_ERROR;
    default:
      return toastMessages.SERVER_ERROR;
  }
};
