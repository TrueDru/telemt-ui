/**
 * `error.code` -> short human message, from API.md "Common Error Codes".
 * Used to render the error envelope as a toast / inline message.
 */
export const ERROR_MESSAGES: Record<string, string> = {
  bad_request: "Invalid request.",
  access_not_editable: "User/secret data is managed via the Users page, not the config editor.",
  section_not_editable: "That config section can't be edited via the API.",
  unauthorized: "Authorization failed for this instance. Check its configured token.",
  forbidden: "This source IP isn't allowed to reach the Control API.",
  read_only: "This instance is in read-only mode.",
  not_found: "Not found.",
  method_not_allowed: "That action isn't supported for this resource.",
  revision_conflict: "Config changed since you loaded it. Reload and try again.",
  user_exists: "A user with that username already exists.",
  last_user_forbidden: "Can't delete the last configured user.",
  payload_too_large: "Request body too large.",
  internal_error: "Internal error on the telemt instance.",
  api_disabled: "The Control API is disabled on this instance.",
  // Synthetic codes raised by the BFF proxy itself, not by telemt.
  unknown_instance: "Unknown telemt instance.",
  upstream_unreachable: "Couldn't reach the telemt instance.",
};

export function errorMessage(code: string, fallback: string): string {
  return ERROR_MESSAGES[code] ?? fallback;
}

/** Builds a `{ok:false,error,request_id}` envelope for errors raised by the BFF proxy itself. */
export function errorEnvelopeBody(code: string, message?: string) {
  return {
    ok: false as const,
    error: { code, message: message ?? errorMessage(code, code) },
    request_id: 0,
  };
}

export class TelemtApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId: string | number;

  constructor(status: number, code: string, message: string, requestId: string | number) {
    super(message);
    this.name = "TelemtApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export class TelemtClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TelemtClientError";
  }
}
