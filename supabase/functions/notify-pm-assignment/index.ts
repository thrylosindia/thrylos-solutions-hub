import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-password",
};

interface NotifyRequest {
  managerName: string;
  managerEmail: string;
  clientName: string;
  projectName: string;
  phone: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { managerName, managerEmail, clientName, projectName, phone } = (await req.json()) as NotifyRequest;

    if (!managerEmail || !projectName) {
      return new Response(
        JSON.stringify({ error: "Manager email and project name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>THRYLOS Project Assignment</title>
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
<td align="center" style="padding:30px 20px 10px 20px;">
<h1 style="font-size:28px; margin:0; font-weight:800;">Hello ${managerName},</h1>
</td>
</tr>
<tr>
<td align="center">
<table width="90%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;border-radius:16px;padding:20px;">
<tr>
<td style="font-size:18px;font-weight:bold;padding:20px 20px 12px 20px;">🎉 New Client Project Assigned</td>
</tr>
<tr>
<td style="border-top:1px solid #ddd;padding:15px 20px 0 20px;"></td>
</tr>
<tr>
<td style="font-size:14px;color:#555;padding:10px 20px 0 20px;">Client Name</td>
</tr>
<tr>
<td style="font-size:16px;font-weight:bold;padding:2px 20px 0 20px;">${clientName || 'N/A'}</td>
</tr>
<tr>
<td style="font-size:14px;color:#555;padding:15px 20px 0 20px;">Project Title</td>
</tr>
<tr>
<td style="font-size:16px;font-weight:bold;padding:2px 20px 0 20px;">${projectName}</td>
</tr>
<tr>
<td style="font-size:14px;color:#555;padding:15px 20px 0 20px;">Contact Number</td>
</tr>
<tr>
<td style="font-size:16px;font-weight:bold;color:#e11d48;padding:2px 20px 20px 20px;">${phone || 'N/A'}</td>
</tr>
</table>
</td>
</tr>
<tr>
<td align="center" style="padding:30px 40px 10px 40px;font-size:16px;color:#444;">
Please review the project details and initiate planning, resource allocation, and execution at the earliest.
</td>
</tr>
<tr>
<td align="center" style="padding:20px 0 30px 0;">
<a href="https://thrylosindia.in/pm/dashboard" target="_blank" style="background:#4f7cff;color:#ffffff;font-size:16px;font-weight:bold;padding:14px 28px;border-radius:10px;text-decoration:none;display:inline-block;">
View Project Dashboard
</a>
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
        to: [{ email: managerEmail }],
        subject: `New Project Assigned: ${projectName}`,
        htmlContent: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Brevo API error:", errorData);
      throw new Error("Failed to send notification email");
    }

    console.log("PM assignment notification sent to:", managerEmail);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in notify-pm-assignment:", error);
    const message = error instanceof Error ? error.message : "Failed to send notification";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
