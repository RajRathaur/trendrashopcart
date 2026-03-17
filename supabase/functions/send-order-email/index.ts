import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const statusEmoji: Record<string, string> = {
  pending: "⏳",
  confirmed: "✅",
  shipped: "🚚",
  delivered: "📦",
  cancelled: "❌",
  returned: "🔄",
};

const statusMessages: Record<string, string> = {
  pending: "Your order is pending confirmation. We'll update you soon!",
  confirmed: "Great news! Your order has been confirmed and is being prepared.",
  shipped: "Your order has been shipped and is on its way to you!",
  delivered: "Your order has been delivered. We hope you love it!",
  cancelled: "Your order has been cancelled. If you have questions, contact us.",
  returned: "Your order return has been processed successfully.",
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

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Verify admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { orderNumber, status, totalAmount, shippingCity, shippingState, customerUserId } = await req.json();

    if (!customerUserId || !orderNumber || !status) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Testing mode: send all emails to test account only
    const customerEmail = "aksahuakhil@gmail.com";

    const emoji = statusEmoji[status] || "📋";
    const message = statusMessages[status] || `Your order status has been updated to: ${status}.`;
    const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Trendra</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Order Status Update</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <div style="text-align:center;margin-bottom:32px;">
                <span style="font-size:48px;">${emoji}</span>
                <h2 style="color:#18181b;margin:16px 0 8px;font-size:22px;">Order ${capitalizedStatus}</h2>
                <p style="color:#71717a;margin:0;font-size:15px;">${message}</p>
              </div>
              
              <table width="100%" style="background-color:#f8fafc;border-radius:8px;padding:20px;margin-bottom:24px;" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:12px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#71717a;font-size:13px;padding-bottom:8px;">Order Number</td>
                        <td align="right" style="color:#18181b;font-size:14px;font-weight:600;padding-bottom:8px;">#${orderNumber}</td>
                      </tr>
                      <tr>
                        <td style="color:#71717a;font-size:13px;padding-bottom:8px;">Status</td>
                        <td align="right" style="color:#2563eb;font-size:14px;font-weight:600;padding-bottom:8px;">${capitalizedStatus}</td>
                      </tr>
                      <tr>
                        <td style="color:#71717a;font-size:13px;padding-bottom:8px;">Total Amount</td>
                        <td align="right" style="color:#18181b;font-size:14px;font-weight:600;padding-bottom:8px;">₹${Number(totalAmount).toLocaleString("en-IN")}</td>
                      </tr>
                      <tr>
                        <td style="color:#71717a;font-size:13px;">Shipping To</td>
                        <td align="right" style="color:#18181b;font-size:14px;font-weight:600;">${shippingCity}, ${shippingState}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <div style="text-align:center;margin-top:24px;">
                <a href="https://trendrashopcart.lovable.app/orders" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
                  View My Orders
                </a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e4e4e7;">
              <p style="color:#a1a1aa;font-size:12px;margin:0;">
                This email was sent by Trendra. If you have questions, contact us at support@trendra.com
              </p>
              <p style="color:#a1a1aa;font-size:11px;margin:8px 0 0;">
                © ${new Date().getFullYear()} Trendra India Pvt. Ltd. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
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
        from: "Trendra <onboarding@resend.dev>",
        to: [customerEmail],
        subject: `${emoji} Order #${orderNumber} - ${capitalizedStatus}`,
        html: htmlContent,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error("Resend API error:", resendData);
      throw new Error(`Resend API error [${resendRes.status}]: ${JSON.stringify(resendData)}`);
    }

    return new Response(JSON.stringify({ success: true, id: resendData.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error sending email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
