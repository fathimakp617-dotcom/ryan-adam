// Shared session validation helper for edge functions
export async function validateSession(supabase: any, email: string, token: string): Promise<boolean> {
  if (!email || !token) return false;
  
  try {
    const { data: session } = await supabase
      .from("staff_sessions")
      .select("id, expires_at")
      .eq("email", email.toLowerCase())
      .eq("session_token", token)
      .maybeSingle();
    
    if (!session) return false;
    
    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      // Clean up expired session
      await supabase.from("staff_sessions").delete().eq("id", session.id);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Session validation error:", error);
    return false;
  }
}

// Check if email is in allowed admin/shipping list
export function isEmailAuthorized(email: string, adminEmails: string[], shippingEmails: string[] = []): boolean {
  if (!email) return false;
  const normalizedEmail = email.toLowerCase().trim();
  return adminEmails.includes(normalizedEmail) || 
         shippingEmails.includes(normalizedEmail);
}
