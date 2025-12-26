import { Resend } from "resend";

export async function sendEmail({ to, subject, react }) {
  const resend = new Resend(process.env.RESEND_API_KEY || "");

  try {
    const data = await resend.emails.send({
      from: "Finance App <onboarding@resend.dev>",
      to,
      subject,
      react,
    });

    console.log(" Resend email success:", data);
    return { success: true, data };
  } catch (error) {
    console.error(" Resend email error:", error);
    return { success: false, error };
  }
}


// This page is for the Server action of sending email using Resend
