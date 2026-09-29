export interface WriteOutcome {
  error: { message: string } | null;
  rowCount: number;
}

export function resultFromWrite(
  result: WriteOutcome,
  successMessage: string,
  failureMessage: string,
): { success: boolean; message: string } {
  if (result.error || result.rowCount < 1) {
    return { success: false, message: failureMessage };
  }
  return { success: true, message: successMessage };
}
