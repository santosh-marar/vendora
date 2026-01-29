import { toast } from "sonner";
import { ZodError } from "zod";

export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    // Handle Zod validation errors
    error.issues.forEach((err) => {
      const field = err.path.join(".");
      toast.error(`${field}: ${err.message}`);
    });
    return;
  }

  if (error instanceof Error) {
    // Handle general JavaScript errors
    toast.error(error.message || "An unexpected error occurred.");
    return;
  }

  if (typeof error === "string") {
    // Handle string-based errors
    toast.error(error);
    return;
  }

  if (typeof error === "object" && error !== null) {
    // Handle API errors with a `message` field
    const apiError = error as { message?: string };
    if (apiError.message) {
      toast.error(apiError.message);
      return;
    }
  }

  // Fallback error message
  toast.error("An unknown error occurred.");
}
