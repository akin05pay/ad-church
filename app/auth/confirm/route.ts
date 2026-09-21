import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function bootstrapWasClaimed(value: unknown) {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "claimed" in value &&
    (value as { claimed?: unknown }).claimed === true
  );
}

function invitationCount(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "claimed" in value &&
    typeof (value as { claimed?: unknown }).claimed === "number"
  ) {
    return (value as { claimed: number }).claimed;
  }
  return 0;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const requestedNext = searchParams.get("next") ?? "/app";
  const next = requestedNext.startsWith("/") ? requestedNext : "/app";

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL("/auth/error", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });

  if (error) {
    return NextResponse.redirect(new URL("/auth/error", request.url));
  }

  const [bootstrap, invitations] = await Promise.all([
    supabase.rpc("claim_initial_admin"),
    supabase.rpc("claim_role_invitations"),
  ]);

  const shouldOpenAdmin =
    (!bootstrap.error && bootstrapWasClaimed(bootstrap.data)) ||
    (!invitations.error && invitationCount(invitations.data) > 0);

  return NextResponse.redirect(
    new URL(shouldOpenAdmin ? "/admin" : next, request.url),
  );
}
