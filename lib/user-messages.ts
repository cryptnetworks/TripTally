export type FeedbackTone = "success" | "error" | "info";

export type UserFeedback = {
  tone: FeedbackTone;
  message: string;
};

export type SafeApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "VALIDATION_FAILED"
  | "SERVICE_UNAVAILABLE"
  | "LOGIN_FAILED"
  | "INVALID_CREDENTIALS"
  | "EMAIL_VERIFICATION_REQUIRED"
  | "MFA_REQUIRED"
  | "INVALID_MFA_CODE"
  | "MFA_MISCONFIGURED"
  | "UNKNOWN";

const fallbackError = "Something went wrong. Please try again.";

const apiErrorMessages: Record<SafeApiErrorCode, string> = {
  BAD_REQUEST: "We could not understand that request. Please check the details and try again.",
  UNAUTHORIZED: "Please sign in to continue.",
  FORBIDDEN: "You do not have permission to do that.",
  NOT_FOUND: "We could not find what you were looking for.",
  CONFLICT: "That change conflicts with existing information.",
  RATE_LIMITED: "Too many attempts. Please wait a few minutes and try again.",
  VALIDATION_FAILED: "Please check the highlighted fields and try again.",
  SERVICE_UNAVAILABLE: "This service is temporarily unavailable. Please try again later.",
  LOGIN_FAILED: "Login could not be completed. Please try again.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  EMAIL_VERIFICATION_REQUIRED: "Please verify your email before logging in.",
  MFA_REQUIRED: "Enter your verification code to continue.",
  INVALID_MFA_CODE: "That verification code was not valid.",
  MFA_MISCONFIGURED: "Two-factor sign-in is not configured correctly. Contact an administrator.",
  UNKNOWN: fallbackError
};

const queryMessages: Record<string, Record<string, UserFeedback>> = {
  register: {
    exists: { tone: "error", message: "An account with that username or email already exists." },
    invalid: { tone: "error", message: "Please check the registration form and try again." },
    disabled: { tone: "error", message: "Public registration is currently disabled." },
    domain: { tone: "error", message: "That email domain is not allowed for registration." },
    "rate-limit": {
      tone: "error",
      message: "Too many registration attempts. Please wait a few minutes and try again."
    }
  },
  auth: {
    invalid: { tone: "error", message: "This link is invalid or has expired." },
    verified: { tone: "success", message: "Email verified. You can sign in now." },
    denied: { tone: "error", message: "Sign-in was denied for this account." },
    callback: { tone: "error", message: "Sign-in could not be completed. Please try again." }
  },
  trip: {
    invalid: { tone: "error", message: "Please check the trip details and try again." },
    forbidden: { tone: "error", message: "You do not have permission to change this trip." },
    "no-participants": {
      tone: "error",
      message: "Add at least one participant before recording expenses."
    },
    "participant-link-required": {
      tone: "error",
      message: "Your account must be linked to a participant before you can add expenses."
    },
    participant: { tone: "error", message: "Please enter a valid participant name or email." },
    receipts_disabled: { tone: "error", message: "Receipt uploads are not enabled." },
    "expense-created": { tone: "success", message: "Expense added." },
    "expense-updated": { tone: "success", message: "Expense updated." },
    "expense-deleted": { tone: "success", message: "Expense deleted." }
  },
  expense: {
    invalid: { tone: "error", message: "Please check the expense details and try again." },
    participants: {
      tone: "error",
      message: "Choose at least one participant to share this expense."
    },
    payer: { tone: "error", message: "Choose a payer you are allowed to use for this expense." }
  },
  receipt: {
    file: { tone: "error", message: "Choose a receipt file before uploading." },
    empty: { tone: "error", message: "That receipt file is empty." },
    too_large: { tone: "error", message: "That receipt file is too large." },
    type: {
      tone: "error",
      message: "Receipt files must be PDF, JPG, PNG, HEIC, or HEIF."
    },
    expense: { tone: "error", message: "Choose a valid expense for this receipt." },
    forbidden: { tone: "error", message: "You do not have permission to upload that receipt." },
    saved: { tone: "success", message: "Receipt review saved." }
  },
  account: {
    "profile.updated": { tone: "success", message: "Account details updated." },
    "profile.verify-email": {
      tone: "success",
      message: "Account details updated. Check your email to verify the new address."
    },
    "profile.duplicate": {
      tone: "error",
      message: "That username or email is already in use."
    },
    "profile.invalid": { tone: "error", message: "Please check your account details." },
    "password.updated": { tone: "success", message: "Password updated." },
    "password.current": { tone: "error", message: "Current password is incorrect." },
    "password.invalid": {
      tone: "error",
      message: "Use a valid password and matching confirmation."
    },
    "twoFactor.updated": { tone: "success", message: "Two-factor preference updated." },
    "twoFactor.authenticator-enabled": {
      tone: "success",
      message: "Authenticator app verification is enabled."
    },
    "twoFactor.setup-required": {
      tone: "error",
      message: "Set up and verify an authenticator app first."
    },
    "twoFactor.invalid-code": {
      tone: "error",
      message: "That authenticator code was not valid."
    },
    "twoFactor.invalid": { tone: "error", message: "Choose a valid two-factor option." },
    "payment.updated": { tone: "success", message: "Payment method saved." },
    "payment.deleted": { tone: "success", message: "Payment method removed." },
    "payment.invalid": {
      tone: "error",
      message: "Check the payment method details and try again."
    },
    "discord.linked": { tone: "success", message: "Discord account linked." },
    "discord.unlinked": { tone: "success", message: "Discord account unlinked." },
    "discord.invalid": {
      tone: "error",
      message: "That Discord link expired or was already used."
    },
    "link.success": { tone: "success", message: "Sign-in provider linked." },
    "link.removed": { tone: "success", message: "Sign-in provider removed." },
    "link.duplicate": {
      tone: "error",
      message: "That sign-in provider is already linked to another account."
    },
    "link.final-method": {
      tone: "error",
      message: "Add another sign-in method before removing this one."
    }
  },
  admin: {
    "invalid-role": { tone: "error", message: "Choose a valid role." },
    "self-lockout": { tone: "error", message: "You cannot lock yourself out." },
    "final-admin": { tone: "error", message: "At least one active admin must remain." },
    password: { tone: "error", message: "Use a password between 8 and 128 characters." },
    provider: { tone: "error", message: "Choose a valid sign-in provider." },
    lockout: {
      tone: "error",
      message: "Enable at least one sign-in method before disabling local login."
    }
  }
};

export function safeApiErrorMessage(code: string | null | undefined) {
  return apiErrorMessages[(code || "UNKNOWN") as SafeApiErrorCode] || fallbackError;
}

export function normalizeApiError(error: unknown, fallbackCode: SafeApiErrorCode = "UNKNOWN") {
  const code =
    typeof error === "string" && error in apiErrorMessages
      ? (error as SafeApiErrorCode)
      : fallbackCode;
  return {
    code,
    message: safeApiErrorMessage(code)
  };
}

export function queryFeedback(scope: keyof typeof queryMessages, code?: string | null) {
  if (!code) return null;
  return queryMessages[scope]?.[code] || { tone: "error" as const, message: fallbackError };
}

export function accountFeedback(query: {
  profile?: string;
  password?: string;
  twoFactor?: string;
  payment?: string;
  discord?: string;
  link?: string;
}) {
  for (const key of ["profile", "password", "twoFactor", "payment", "discord", "link"] as const) {
    const value = query[key];
    if (!value) continue;
    const feedback = queryFeedback("account", `${key}.${value}`);
    if (feedback) return feedback;
  }
  return null;
}

function parseJsonObject(value: string | null | undefined) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function stringField(object: Record<string, unknown>, key: string, fallback: string) {
  const value = object[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function formatActivityMessage(entry: {
  action: string;
  actor?: { username?: string | null; email?: string | null } | null;
  afterJson?: string | null;
  beforeJson?: string | null;
  metadataJson?: string | null;
}) {
  const actor = entry.actor?.username || entry.actor?.email || "Someone";
  const after = parseJsonObject(entry.afterJson);
  const before = parseJsonObject(entry.beforeJson);
  const metadata = parseJsonObject(entry.metadataJson);
  const expenseTitle = stringField(after, "title", stringField(before, "title", "an expense"));
  const tripName = stringField(after, "name", stringField(before, "name", "this trip"));
  const participantName = stringField(after, "name", stringField(before, "name", "a participant"));
  const receiptName = stringField(after, "originalFilename", "a receipt");
  const provider = stringField(metadata, "provider", "a sign-in provider");

  switch (entry.action) {
    case "trip.create":
      return `${actor} created ${tripName}.`;
    case "trip.update":
      return `${actor} updated trip details.`;
    case "trip.delete":
      return `${actor} deleted this trip.`;
    case "participant.create":
      return `${actor} added ${participantName} to this trip.`;
    case "participant.update":
      return `${actor} updated ${participantName}.`;
    case "participant.delete":
      return `${actor} removed ${participantName} from this trip.`;
    case "expense.create":
      return `${actor} added an expense for ${expenseTitle}.`;
    case "expense.update":
      return `${actor} updated ${expenseTitle}.`;
    case "expense.delete":
      return `${actor} deleted ${expenseTitle}.`;
    case "receipt.upload":
      return `${actor} uploaded ${receiptName}.`;
    case "receipt.review":
      return `${actor} saved receipt review changes.`;
    case "user.role_changed":
      return `${actor} changed a user's role.`;
    case "user.disabled":
      return `${actor} disabled a user account.`;
    case "user.enabled":
      return `${actor} enabled a user account.`;
    case "user.deleted":
      return `${actor} deleted a user account.`;
    case "user.password_reset_by_admin":
      return `${actor} reset a user's password.`;
    case "auth.provider_config_changed":
      return `${actor} updated ${provider} sign-in settings.`;
    default:
      return `${actor} made a change.`;
  }
}
