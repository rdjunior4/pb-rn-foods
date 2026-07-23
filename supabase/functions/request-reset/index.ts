import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: "Email é obrigatório." }), { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Check if user exists
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("email", cleanEmail)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "E-mail não cadastrado." }), { status: 404 });
    }

    // 2. Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // 3. Store in DB (replace any existing code)
    await supabase.from("password_reset_codes").delete().eq("email", cleanEmail);
    const { error: insertError } = await supabase
      .from("password_reset_codes")
      .insert({ email: cleanEmail, code });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Erro ao gerar código." }), { status: 500 });
    }

    // 4. Send email via Resend
    if (resendApiKey) {
      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#f59e0b,#ea580c);padding:32px;text-align:center;">
      <h1 style="color:#fff;font-size:20px;margin:0;">PB&RN Foods</h1>
      <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:4px 0 0;">Redefinição de senha</p>
    </div>
    <div style="padding:32px;text-align:center;">
      <p style="color:#3f3f46;font-size:14px;margin:0 0 24px;">Use o código abaixo para redefinir sua senha:</p>
      <div style="background:#f4f4f5;border-radius:8px;padding:16px;margin:0 0 24px;">
        <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#18181b;font-family:monospace;">${code}</span>
      </div>
      <p style="color:#a1a1aa;font-size:12px;margin:0 0 8px;">Este código expira em 15 minutos.</p>
      <p style="color:#a1a1aa;font-size:12px;margin:0;">Se você não solicitou, ignore este e-mail.</p>
    </div>
  </div>
</body>
</html>`;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "PB&RN Foods <noreply@pbrnfoods.com.br>",
          to: [cleanEmail],
          subject: "Código de redefinição de senha - PB&RN Foods",
          html,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error("Resend error:", data);
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error("request-reset error:", err);
    return new Response(JSON.stringify({ error: "Erro interno do servidor." }), { status: 500 });
  }
});
