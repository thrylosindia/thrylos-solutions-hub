import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOTPRequest {
  email: string;
  fullName?: string;
  isSignup?: boolean;
  isPasswordReset?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName, isSignup, isPasswordReset } = (await req.json()) as SendOTPRequest;

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Valid email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // For login or password reset, check user exists
    if (!isSignup) {
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const userExists = existingUser?.users?.some(u => u.email === email);
      if (!userExists) {
        return new Response(
          JSON.stringify({ error: "No account found with this email. Please sign up first." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // For signup, check user doesn't already exist
    if (isSignup) {
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const userExists = existingUser?.users?.some(u => u.email === email);
      if (userExists) {
        return new Response(
          JSON.stringify({ error: "An account with this email already exists. Please login instead." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await supabase.from("otp_verifications").delete().eq("email", email);

    const { error: insertError } = await supabase.from("otp_verifications").insert({
      email,
      otp_code: otp,
      expires_at: expiresAt.toISOString(),
      verified: false,
    });

    if (insertError) {
      console.error("Failed to store OTP:", insertError);
      throw new Error("Failed to generate OTP");
    }

    const username = fullName || email.split('@')[0];

    let subject: string;
    let heading: string;
    let instruction: string;
    let subInstruction: string;

    if (isPasswordReset) {
      subject = "Reset Your THRYLOS Password";
      heading = `Hello ${username},`;
      instruction = "You requested to reset your password at THRYLOS. Use the code below to verify your identity.";
      subInstruction = "If you didn't request a password reset, you can safely ignore this email.";
    } else if (isSignup) {
      subject = "Welcome to THRYLOS - Verify Your Email";
      heading = `Welcome ${username}!`;
      instruction = "Use the code below to verify your email and create your account.";
      subInstruction = "If you didn't request to create an account, you can safely ignore this email.";
    } else {
      subject = "Your THRYLOS Login Code";
      heading = `Welcome back ${username}!`;
      instruction = "If you requested to log in to your THRYLOS ID, use the code below.";
      subInstruction = "If you didn't request to log in to your THRYLOS ID, you can safely ignore this email.";
    }

    const emailHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>THRYLOS</title>
</head>
<body style="margin:0; padding:0; background:#ffffff; font-family:Arial, Helvetica, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff">
<tr>
<td align="center" style="padding:30px 10px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border:1px solid #d1d5db;border-radius:12px;overflow:hidden;">
<tr>
<td align="center" bgcolor="#f3f4f6" style="padding:18px;">
<img src="https://github.com/user-attachments/assets/160c433a-e006-42ee-8923-f6360223e116" alt="THRYLOS Logo" width="120" style="display:block;">
</td>
</tr>
<tr>
<td align="center" style="padding:20px 20px 10px 20px;">
<h1 style="font-size:32px; margin:0; font-weight:800;">${heading}</h1>
</td>
</tr>
<tr>
<td align="center">
<table width="90%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;border-radius:16px;">
<tr>
<td style="padding:20px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="font-size:16px;color:#555;padding-bottom:8px;">${isPasswordReset ? 'Resetting password for' : 'Logging in to'}</td></tr>
<tr><td>
<table width="100%"><tr>
<td style="font-size:16px;font-weight:bold;">THRYLOS</td>
<td align="right"><img src="https://github.com/user-attachments/assets/eea77779-ee10-4d58-bf62-e374dff4a6ab" width="44" style="display:block;border-radius:6px;"></td>
</tr></table>
</td></tr>
<tr><td style="border-top:1px solid #ddd;padding-top:12px;padding-bottom:8px;"></td></tr>
<tr><td style="font-size:16px;color:#555;padding-bottom:8px;">From</td></tr>
<tr><td>
<table width="100%"><tr>
<td style="font-size:16px;font-weight:bold;">India</td>
<td align="right"><img src="https://github.com/user-attachments/assets/3738239c-dc89-4d91-b96d-c845c2adcf64" width="35" style="display:block;border-radius:6px;"></td>
</tr></table>
</td></tr>
</table>
</td></tr>
</table>
</td>
</tr>
<tr>
<td align="center" style="padding:30px 40px 10px 40px;font-size:16px;color:#444;">
${instruction}
</td>
</tr>
<tr>
<td align="center" style="padding:10px 0 20px 0;">
<div style="background:#4f7cff;color:#fff;font-size:32px;font-weight:bold;padding:18px 36px;border-radius:14px;display:inline-block;letter-spacing:4px;">
${otp}
</div>
</td>
</tr>
<tr>
<td align="center" style="padding:0 40px 40px 40px;font-size:14px;color:#666;">
${subInstruction}
</td>
</tr>
<tr>
<td bgcolor="#000000" style="padding:20px;">
<table width="100%"><tr>
<td style="color:#ffffff;font-size:14px;">&copy; ${new Date().getFullYear()} THRYLOS. All rights reserved.</td>
<td align="right"><img src="https://github.com/user-attachments/assets/160c433a-e006-42ee-8923-f6360223e116" width="90"></td>
</tr></table>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

    const emailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "THRYLOS", email: "noreply@thrylosindia.in" },
        to: [{ email }],
        subject,
        htmlContent: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Brevo API error:", errorData);
      throw new Error("Failed to send email");
    }

    console.log("OTP email sent via Brevo to:", email);

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in send-otp function:", error);
    const message = error instanceof Error ? error.message : "Failed to send OTP";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
