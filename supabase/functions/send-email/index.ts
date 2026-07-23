import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

const FROM_EMAIL = "PB&RN Foods <noreply@pbrnfoods.com.br>";

function buildResetCodeEmail(code: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#f59e0b,#ea580c);padding:32px;text-align:center;">
      <h1 style="color:#fff;font-size:20px;margin:0;">PB&RN Foods</h1>
      <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:4px 0 0;">Redefinicao de senha</p>
    </div>
    <div style="padding:32px;text-align:center;">
      <p style="color:#3f3f46;font-size:14px;margin:0 0 24px;">Use o codigo abaixo para redefinir sua senha:</p>
      <div style="background:#f4f4f5;border-radius:8px;padding:16px;margin:0 0 24px;">
        <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#18181b;font-family:monospace;">${code}</span>
      </div>
      <p style="color:#a1a1aa;font-size:12px;margin:0 0 8px;">Este codigo expira em 15 minutos.</p>
      <p style="color:#a1a1aa;font-size:12px;margin:0;">Se voce nao solicitou, ignore este e-mail.</p>
    </div>
  </div>
</body>
</html>`;
}

function buildOrderConfirmEmail(orderId: string, customerName: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#f59e0b,#ea580c);padding:32px;text-align:center;">
      <h1 style="color:#fff;font-size:20px;margin:0;">Pedido Confirmado!</h1>
      <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:4px 0 0;">PB&RN Foods</p>
    </div>
    <div style="padding:32px;text-align:center;">
      <p style="color:#3f3f46;font-size:14px;margin:0 0 8px;">Ola, ${customerName}!</p>
      <p style="color:#3f3f46;font-size:14px;margin:0 0 24px;">Seu pedido <strong>#${orderId}</strong> foi recebido com sucesso.</p>
      <a href="#" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#ea580c);color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">Acompanhar pedido</a>
      <p style="color:#a1a1aa;font-size:12px;margin:24px 0 0;">Em caso de duvidas, entre em contato conosco.</p>
    </div>
  </div>
</body>
</html>`;
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const { type, to, code, orderId, customerName } = await req.json();

    if (!type || !to) {
      return new Response(JSON.stringify({ error: "type and to are required" }), { status: 400 });
    }

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), { status: 500 });
    }

    let subject: string;
    let html: string;

    switch (type) {
      case "reset-code":
        if (!code) {
          return new Response(JSON.stringify({ error: "code is required for reset-code" }), { status: 400 });
        }
        subject = "Codigo de redefinicao de senha - PB&RN Foods";
        html = buildResetCodeEmail(code);
        break;

      case "order-confirmation":
        if (!orderId || !customerName) {
          return new Response(JSON.stringify({ error: "orderId and customerName required" }), { status: 400 });
        }
        subject = `Pedido #${orderId} confirmado - PB&RN Foods`;
        html = buildOrderConfirmEmail(orderId, customerName);
        break;

      default:
        return new Response(JSON.stringify({ error: `Unknown type: ${type}` }), { status: 400 });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", data);
      return new Response(JSON.stringify({ error: data.message || "Failed to send email" }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true, id: data.id }), { status: 200 });
  } catch (err) {
    console.error("send-email error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});
