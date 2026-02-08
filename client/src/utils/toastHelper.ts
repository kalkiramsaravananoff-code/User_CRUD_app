import toast from "react-hot-toast";
import { toastMessages, toastLoadingMessages, getErrorMessageByStatus } from "./toastMessages";

interface ApiError {
  response?: {
    status: number;
    data?: {
      message?: string;
    };
  };
  message?: string;
}

type AsyncAction = "create" | "update" | "delete" | "fetch";

/**
 * Helper function to show toast notifications for async API operations
 * Displays a loading toast and replaces it with success/error message
 */
export const showApiToast = async <T,>(
  actionType: AsyncAction,
  asyncFn: () => Promise<T>,
  successMessage?: string,
  errorMessage?: string
): Promise<T> => {
  const loadingMsg = toastLoadingMessages[actionType.toUpperCase() as keyof typeof toastLoadingMessages];
  
  // Show loading toast
  const toastId = toast.loading(loadingMsg);

  try {
    const result = await asyncFn();

    // Replace loading with success message (but not for fetch operations)
    if (actionType !== "fetch") {
      const successMsg = successMessage || toastMessages[`${actionType.toUpperCase()}_SUCCESS` as keyof typeof toastMessages];
      toast.success(successMsg, { id: toastId });
    } else {
      // For fetch, just dismiss the loading toast without showing success
      toast.dismiss(toastId);
    }

    return result;
  } catch (error) {
    // Replace loading with error message
    const apiError = error as ApiError;
    
    // Prefer server message if available
    let errorMsg = apiError.response?.data?.message;
    
    // Fall back to status code mapping if no server message
    if (!errorMsg && apiError.response?.status) {
      errorMsg = getErrorMessageByStatus(apiError.response.status);
    }
    
    // Fall back to generic error message
    if (!errorMsg) {
      errorMsg = errorMessage || toastMessages[`${actionType.toUpperCase()}_ERROR` as keyof typeof toastMessages];
    }

    toast.error(errorMsg, { id: toastId });

    throw error; // Re-throw to let component handle it if needed
  }
};

/**
 * Simple helper to show a quick error toast (without loading state)
 */
export const showErrorToast = (message: string) => {
  toast.error(message);
};

/**
 * Simple helper to show a quick success toast (without loading state)
 */
export const showSuccessToast = (message: string) => {
  toast.success(message);
};
