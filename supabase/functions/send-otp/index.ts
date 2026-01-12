import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
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
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName, isSignup } = (await req.json()) as SendOTPRequest;

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Valid email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user exists for login flow
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

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete existing OTPs for this email
    await supabase.from("otp_verifications").delete().eq("email", email);

    // Store OTP in database
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

    // Send OTP via Resend API directly
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #0a0a0a;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 480px; width: 100%; background: linear-gradient(145deg, #1a1a2e 0%, #16162a 100%); border-radius: 16px; border: 1px solid #2a2a4a;">
                <tr>
                  <td style="padding: 40px 32px; text-align: center;">
                    <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; background: linear-gradient(90deg, #f97316, #ec4899, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">THRYLOS</h1>
                    <p style="margin: 0 0 32px; color: #888; font-size: 14px;">Beyond Tech</p>
                    
                    <h2 style="margin: 0 0 16px; color: #fff; font-size: 20px; font-weight: 600;">
                      ${isSignup ? `Welcome${fullName ? `, ${fullName}` : ""}!` : "Your Login Code"}
                    </h2>
                    
                    <p style="margin: 0 0 24px; color: #aaa; font-size: 15px; line-height: 1.5;">
                      ${isSignup ? "Use the code below to verify your email and complete your signup:" : "Enter this code to log in to your account:"}
                    </p>
                    
                    <div style="background: linear-gradient(135deg, #1e1e3f 0%, #252550 100%); border: 2px solid #3b82f6; border-radius: 12px; padding: 24px; margin: 0 0 24px;">
                      <span style="font-family: 'Monaco', 'Courier New', monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #fff;">${otp}</span>
                    </div>
                    
                    <p style="margin: 0 0 8px; color: #666; font-size: 13px;">This code expires in 10 minutes.</p>
                    <p style="margin: 0; color: #666; font-size: 13px;">If you didn't request this, please ignore this email.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 32px; border-top: 1px solid #2a2a4a; text-align: center;">
                    <p style="margin: 0; color: #555; font-size: 12px;">© ${new Date().getFullYear()} THRYLOS Technologies. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "THRYLOS <noreply@thrylos.in>",
        to: [email],
        subject: isSignup ? "Welcome to THRYLOS - Verify Your Email" : "Your THRYLOS Login Code",
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend API error:", errorData);
      throw new Error("Failed to send email");
    }

    const emailResult = await emailResponse.json();
    console.log("OTP email sent:", emailResult);

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
