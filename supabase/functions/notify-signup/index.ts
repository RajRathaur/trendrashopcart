import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { userName, userEmail, registrationDate } = await req.json();

    if (!userName || !userEmail) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formattedDate = registrationDate
      ? new Date(registrationDate).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
      : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    // Get admin emails from user_roles table
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: adminRoles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    const adminEmails: string[] = [];
    if (adminRoles?.length) {
      for (const role of adminRoles) {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(role.user_id);
        if (userData?.user?.email) {
          adminEmails.push(userData.user.email);
        }
      }
    }

    if (adminEmails.length === 0) {
      adminEmails.push("trendra.care.ac.in@gmail.com");
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr>
          <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);padding:32px 40px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">👤 New User Registration</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Trendra Shopcart – Admin Alert</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="color:#71717a;font-size:14px;margin:0 0 24px;">A new user has registered on your platform.</p>
            <table width="100%" style="background-color:#f8fafc;border-radius:8px;" cellpadding="0" cellspacing="0">
              <tr><td style="padding:16px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color:#71717a;font-size:13px;padding-bottom:12px;">User Name</td>
                    <td align="right" style="color:#18181b;font-size:14px;font-weight:600;padding-bottom:12px;">${userName}</td>
                  </tr>
                  <tr>
                    <td style="color:#71717a;font-size:13px;padding-bottom:12px;">Email</td>
                    <td align="right" style="color:#18181b;font-size:14px;font-weight:600;padding-bottom:12px;">${userEmail}</td>
                  </tr>
                  <tr>
                    <td style="color:#71717a;font-size:13px;">Registration Date</td>
                    <td align="right" style="color:#18181b;font-size:14px;font-weight:600;">${formattedDate}</td>
                  </tr>
                </table>
              </td></tr>
            </table>
            <div style="text-align:center;margin-top:24px;">
              <a href="https://trendrashopcart.lovable.app/admin" style="display:inline-block;background-color:#10b981;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">View Admin Dashboard</a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e4e4e7;">
            <p style="color:#a1a1aa;font-size:12px;margin:0;">© ${new Date().getFullYear()} Trendra India Pvt. Ltd. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Trendra Shopcart <onboarding@resend.dev>",
        to: adminEmails,
        subject: "New User Registration – Trendra Shopcart",
        html: htmlContent,
      }),
    });

    const resendData = await resendRes.json();
    if (!resendRes.ok) {
      console.error("Resend API error:", resendData);
      throw new Error(`Resend error: ${JSON.stringify(resendData)}`);
    }

    return new Response(JSON.stringify({ success: true, id: resendData.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
