"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type EmailStatus =
  | { kind: "not_found" }
  | { kind: "has_password" }
  | { kind: "google_only" }
  | { kind: "other_provider"; provider: string };

/**
 * Look up whether an email has a password identity, a Google identity, or
 * doesn't exist. Used AFTER a failed signInWithPassword to decide which error
 * message to show the user. Requires the service role key.
 */
export async function checkEmailStatus(email: string): Promise<EmailStatus> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { kind: "not_found" };

  const admin = createAdminClient();

  // Paginate through users looking for this email. listUsers maxes at 1000/page.
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data) return { kind: "not_found" };
    const user = data.users.find((u) => u.email?.toLowerCase() === trimmed);
    if (user) {
      const providers = (user.identities ?? []).map((i) => i.provider);
      if (providers.includes("email")) return { kind: "has_password" };
      if (providers.includes("google")) return { kind: "google_only" };
      if (providers.length > 0) return { kind: "other_provider", provider: providers[0] };
      return { kind: "not_found" };
    }
    if (data.users.length < 1000) return { kind: "not_found" };
    page += 1;
    if (page > 50) return { kind: "not_found" }; // safety cap (~50k users)
  }
}
