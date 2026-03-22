/** Deno global — provided by Supabase Edge Functions runtime */
declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: unknown): void;
};
