/**
 * Minimal ambient types for the small slice of `mammoth`'s API this
 * project actually uses. mammoth does ship its own types, but this is a
 * safety net — if the published types don't resolve cleanly in this
 * project's bundler setup, this keeps the build from failing on that
 * alone. Matches mammoth's documented, stable `extractRawText` signature.
 */
declare module 'mammoth' {
  export interface ExtractRawTextInput {
    arrayBuffer: ArrayBuffer;
  }

  export interface ExtractRawTextResult {
    value: string;
    messages: unknown[];
  }

  export function extractRawText(input: ExtractRawTextInput): Promise<ExtractRawTextResult>;
}
