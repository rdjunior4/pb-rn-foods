import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return new Response(JSON.stringify({ error: "Email, código e nova senha são obrigatórios." }), { status: 400 });
    }

    if (newPassword.length < 4) {
      return new Response(JSON.stringify({ error: "A senha deve ter pelo menos 4 caracteres." }), { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Validate the reset code
    const { data: resetData, error: resetError } = await supabase
      .from("password_reset_codes")
      .select("*")
      .eq("email", email.trim().toLowerCase())
      .eq("code", code.trim())
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (resetError || !resetData) {
      return new Response(JSON.stringify({ error: "Código de verificação inválido ou expirado." }), { status: 400 });
    }

    // 2. Mark code as used
    await supabase
      .from("password_reset_codes")
      .update({ used: true })
      .eq("email", email.trim().toLowerCase())
      .eq("code", code.trim());

    // 3. Find user by email
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      return new Response(JSON.stringify({ error: "Erro ao buscar usuário." }), { status: 500 });
    }

    const user = authData.users.find((u) => u.email === email.trim().toLowerCase());
    if (!user) {
      return new Response(JSON.stringify({ error: "Usuário não encontrado." }), { status: 404 });
    }

    // 4. Update password using service role
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (updateError) {
      console.error("Password update error:", updateError);
      return new Response(JSON.stringify({ error: "Erro ao atualizar senha." }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error("Reset password error:", err);
    return new Response(JSON.stringify({ error: "Erro interno do servidor." }), { status: 500 });
  }
});
