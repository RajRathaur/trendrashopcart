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

    const {
      orderId,
      orderNumber,
      customerName,
      customerEmail,
      phoneNumber,
      deliveryAddress,
      products,
      totalAmount,
      paymentMethod,
      orderDate,
    } = await req.json();

    if (!orderNumber || !customerName || !totalAmount) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formattedDate = orderDate
      ? new Date(orderDate).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
      : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    const paymentDisplay = paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment (UPI)";

    // Build product rows HTML
    const productRows = (products || [])
      .map(
        (p: { name: string; quantity: number; price: number }) => `
        <tr>
          <td style="color:#18181b;font-size:13px;padding:8px 0;border-bottom:1px solid #f1f1f1;">${p.name}</td>
          <td align="center" style="color:#18181b;font-size:13px;padding:8px 0;border-bottom:1px solid #f1f1f1;">${p.quantity}</td>
          <td align="right" style="color:#18181b;font-size:13px;font-weight:600;padding:8px 0;border-bottom:1px solid #f1f1f1;">₹${Number(p.price * p.quantity).toLocaleString("en-IN")}</td>
        </tr>`
      )
      .join("");

    // Get admin emails
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

    // ===== 1. ADMIN NOTIFICATION EMAIL =====
    const adminHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr>
          <td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);padding:32px 40px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">🛒 New Order Received</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Trendra Shopcart – Admin Alert</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <table width="100%" style="background-color:#f8fafc;border-radius:8px;margin-bottom:20px;" cellpadding="0" cellspacing="0">
              <tr><td style="padding:16px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="color:#71717a;font-size:13px;padding-bottom:10px;">Order ID</td><td align="right" style="color:#2563eb;font-size:14px;font-weight:700;padding-bottom:10px;">#${orderNumber}</td></tr>
                  <tr><td style="color:#71717a;font-size:13px;padding-bottom:10px;">Customer Name</td><td align="right" style="color:#18181b;font-size:14px;font-weight:600;padding-bottom:10px;">${customerName}</td></tr>
                  <tr><td style="color:#71717a;font-size:13px;padding-bottom:10px;">Phone</td><td align="right" style="color:#18181b;font-size:14px;font-weight:600;padding-bottom:10px;">${phoneNumber || "N/A"}</td></tr>
                  <tr><td style="color:#71717a;font-size:13px;padding-bottom:10px;">Address</td><td align="right" style="color:#18181b;font-size:14px;font-weight:600;padding-bottom:10px;">${deliveryAddress}</td></tr>
                  <tr><td style="color:#71717a;font-size:13px;padding-bottom:10px;">Payment</td><td align="right" style="color:#18181b;font-size:14px;font-weight:600;padding-bottom:10px;">${paymentDisplay}</td></tr>
                  <tr><td style="color:#71717a;font-size:13px;padding-bottom:10px;">Total</td><td align="right" style="color:#16a34a;font-size:16px;font-weight:700;padding-bottom:10px;">₹${Number(totalAmount).toLocaleString("en-IN")}</td></tr>
                  <tr><td style="color:#71717a;font-size:13px;">Order Date</td><td align="right" style="color:#18181b;font-size:14px;font-weight:600;">${formattedDate}</td></tr>
                </table>
              </td></tr>
            </table>
            ${productRows ? `
            <h3 style="color:#18181b;font-size:15px;margin:20px 0 12px;">Ordered Products</h3>
            <table width="100%" style="background-color:#f8fafc;border-radius:8px;" cellpadding="0" cellspacing="0">
              <tr><td style="padding:12px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color:#71717a;font-size:12px;font-weight:600;padding-bottom:8px;border-bottom:2px solid #e4e4e7;">Product</td>
                    <td align="center" style="color:#71717a;font-size:12px;font-weight:600;padding-bottom:8px;border-bottom:2px solid #e4e4e7;">Qty</td>
                    <td align="right" style="color:#71717a;font-size:12px;font-weight:600;padding-bottom:8px;border-bottom:2px solid #e4e4e7;">Amount</td>
                  </tr>
                  ${productRows}
                </table>
              </td></tr>
            </table>` : ""}
            <div style="text-align:center;margin-top:24px;">
              <a href="https://trendrashopcart.lovable.app/admin/orders" style="display:inline-block;background-color:#dc2626;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">View Order in Dashboard</a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e4e4e7;">
            <p style="color:#a1a1aa;font-size:12px;margin:0;">© ${new Date().getFullYear()} Trendra India Pvt. Ltd.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // ===== 2. CUSTOMER CONFIRMATION EMAIL =====
    const customerHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr>
          <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);padding:32px 40px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">✅ Order Confirmed!</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Trendra Shopcart</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="color:#18181b;font-size:16px;margin:0 0 8px;">Hi ${customerName},</p>
            <p style="color:#71717a;font-size:14px;margin:0 0 24px;">Thank you for shopping with Trendra Shopcart! Your order has been placed successfully.</p>
            
            <table width="100%" style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin-bottom:20px;" cellpadding="0" cellspacing="0">
              <tr><td style="padding:16px 20px;text-align:center;">
                <p style="color:#15803d;font-size:13px;margin:0;">Order Number</p>
                <p style="color:#15803d;font-size:22px;font-weight:700;margin:4px 0 0;">#${orderNumber}</p>
              </td></tr>
            </table>

            ${productRows ? `
            <h3 style="color:#18181b;font-size:15px;margin:20px 0 12px;">Your Items</h3>
            <table width="100%" style="background-color:#f8fafc;border-radius:8px;" cellpadding="0" cellspacing="0">
              <tr><td style="padding:12px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color:#71717a;font-size:12px;font-weight:600;padding-bottom:8px;border-bottom:2px solid #e4e4e7;">Product</td>
                    <td align="center" style="color:#71717a;font-size:12px;font-weight:600;padding-bottom:8px;border-bottom:2px solid #e4e4e7;">Qty</td>
                    <td align="right" style="color:#71717a;font-size:12px;font-weight:600;padding-bottom:8px;border-bottom:2px solid #e4e4e7;">Amount</td>
                  </tr>
                  ${productRows}
                </table>
              </td></tr>
            </table>` : ""}

            <table width="100%" style="background-color:#f8fafc;border-radius:8px;margin-top:20px;" cellpadding="0" cellspacing="0">
              <tr><td style="padding:16px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="color:#71717a;font-size:13px;padding-bottom:10px;">Total Amount</td><td align="right" style="color:#2563eb;font-size:16px;font-weight:700;padding-bottom:10px;">₹${Number(totalAmount).toLocaleString("en-IN")}</td></tr>
                  <tr><td style="color:#71717a;font-size:13px;padding-bottom:10px;">Payment Method</td><td align="right" style="color:#18181b;font-size:14px;font-weight:600;padding-bottom:10px;">${paymentDisplay}</td></tr>
                  <tr><td style="color:#71717a;font-size:13px;">Delivery Address</td><td align="right" style="color:#18181b;font-size:14px;font-weight:600;">${deliveryAddress}</td></tr>
                </table>
              </td></tr>
            </table>

            <div style="text-align:center;margin-top:24px;">
              <a href="https://trendrashopcart.lovable.app/orders" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Track Your Order</a>
            </div>

            <div style="background-color:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-top:24px;text-align:center;">
              <p style="color:#92400e;font-size:14px;margin:0;font-weight:600;">💛 Thank you for shopping with Trendra Shopcart!</p>
              <p style="color:#a16207;font-size:13px;margin:6px 0 0;">We're preparing your order with care.</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e4e4e7;">
            <p style="color:#a1a1aa;font-size:12px;margin:0;">If you have any questions, contact us at trendra.care.ac.in@gmail.com</p>
            <p style="color:#a1a1aa;font-size:11px;margin:8px 0 0;">© ${new Date().getFullYear()} Trendra India Pvt. Ltd. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // Send both emails in parallel
    const emailPromises = [];

    // Admin email
    emailPromises.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Trendra Shopcart <onboarding@resend.dev>",
          to: adminEmails,
          subject: `New Order Received – #${orderNumber} – Trendra Shopcart`,
          html: adminHtml,
        }),
      })
    );

    // Customer email (only if we have their email)
    if (customerEmail) {
      emailPromises.push(
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Trendra Shopcart <onboarding@resend.dev>",
            to: [customerEmail],
            subject: `Your Order Confirmation – #${orderNumber} – Trendra Shopcart`,
            html: customerHtml,
          }),
        })
      );
    }

    const results = await Promise.allSettled(emailPromises);
    const errors: string[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        const res = result.value;
        if (!res.ok) {
          const data = await res.json();
          console.error("Resend error:", data);
          errors.push(JSON.stringify(data));
        }
      } else {
        errors.push(result.reason?.message || "Unknown error");
      }
    }

    if (errors.length > 0) {
      console.warn("Some emails failed:", errors);
    }

    return new Response(JSON.stringify({ success: true, errors }), {
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
