import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const NOTIFY_EMAIL = Deno.env.get("NOTIFY_EMAIL") ?? "pretonewslab@gmail.com";

Deno.serve(async (req: Request) => {
    // Only allow POST
    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    try {
        const payload = await req.json();

        // Supabase webhook sends the row in payload.record
        const lead = payload?.record;

        if (!lead) {
            return new Response("No lead data found in payload", { status: 400 });
        }

        const roleLabel: Record<string, string> = {
            candidato: "Candidato(a)",
            assessor: "Assessor(a)",
            secretario: "Secretário(a)",
            outro: "Outro",
        };

        const html = `
      <div style="font-family: Inter, system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px; border-radius: 12px;">
        <div style="background: #0f172a; padding: 20px 24px; border-radius: 10px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 22px;">⚡</span>
          <span style="color: white; font-size: 18px; font-weight: 700; letter-spacing: -0.5px;">Novo Lead — Politika</span>
        </div>

        <p style="color: #334155; font-size: 15px; margin: 0 0 20px;">
          Um novo interessado acabou de preencher o formulário de acesso. Aqui estão os dados:
        </p>

        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0;">
          <tr>
            <td style="padding: 14px 20px; font-size: 13px; font-weight: 600; color: #64748b; background: #f1f5f9; width: 35%; border-bottom: 1px solid #e2e8f0;">Nome</td>
            <td style="padding: 14px 20px; font-size: 14px; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${lead.full_name ?? "—"}</td>
          </tr>
          <tr>
            <td style="padding: 14px 20px; font-size: 13px; font-weight: 600; color: #64748b; background: #f1f5f9; border-bottom: 1px solid #e2e8f0;">E-mail</td>
            <td style="padding: 14px 20px; font-size: 14px; color: #0f172a; border-bottom: 1px solid #e2e8f0;"><a href="mailto:${lead.email}" style="color: #2563eb;">${lead.email ?? "—"}</a></td>
          </tr>
          <tr>
            <td style="padding: 14px 20px; font-size: 13px; font-weight: 600; color: #64748b; background: #f1f5f9; border-bottom: 1px solid #e2e8f0;">WhatsApp</td>
            <td style="padding: 14px 20px; font-size: 14px; color: #0f172a; border-bottom: 1px solid #e2e8f0;"><a href="https://wa.me/55${(lead.whatsapp ?? "").replace(/\D/g, "")}" style="color: #16a34a;">${lead.whatsapp ?? "—"} 📱</a></td>
          </tr>
          <tr>
            <td style="padding: 14px 20px; font-size: 13px; font-weight: 600; color: #64748b; background: #f1f5f9; border-bottom: 1px solid #e2e8f0;">Cargo</td>
            <td style="padding: 14px 20px; font-size: 14px; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${roleLabel[lead.role] ?? lead.role ?? "—"}</td>
          </tr>
          <tr>
            <td style="padding: 14px 20px; font-size: 13px; font-weight: 600; color: #64748b; background: #f1f5f9;">Localidade</td>
            <td style="padding: 14px 20px; font-size: 14px; color: #0f172a;">${lead.location ?? "—"}</td>
          </tr>
        </table>

        <div style="margin-top: 24px; padding: 16px 20px; background: #dcfce7; border-radius: 10px; border-left: 4px solid #16a34a;">
          <p style="margin: 0; font-size: 14px; color: #15803d; font-weight: 600;">
            💡 Acione agora — Leads quentes têm taxa de conversão 3x maior quando contatados em até 2h.
          </p>
        </div>

        <p style="margin-top: 24px; font-size: 12px; color: #94a3b8; text-align: center;">
          Politika Sistemas de Inteligência · iapolitika.com.br
        </p>
      </div>
    `;

        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "Politika Leads <leads@iapolitika.com.br>",
                to: [NOTIFY_EMAIL],
                subject: `🔔 Novo Lead: ${lead.full_name ?? "Desconhecido"} — ${lead.role ?? ""} em ${lead.location ?? ""}`,
                html,
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("Resend error:", err);
            return new Response(`Failed to send email: ${err}`, { status: 500 });
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("Function error:", error);
        return new Response(`Internal error: ${error.message}`, { status: 500 });
    }
});
