import "server-only";

import nodemailer from "nodemailer";
import { db } from "@/lib/db";
import { createTicketPdf } from "@/lib/ticket-pdf";

function createSmtpTransport() {
  const host = process.env.MAIL_HOST;
  const from = process.env.MAIL_FROM;
  if (!host || !from) {
    throw new Error("Email is not configured. Set MAIL_HOST and MAIL_FROM.");
  }
  const port = Number(process.env.MAIL_PORT ?? "587");
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASSWORD;
  return {
    from,
    transport: nodemailer.createTransport({
      host,
      port,
      secure: process.env.MAIL_SECURE === "true" || port === 465,
      ...(user && pass ? { auth: { user, pass } } : {}),
    }),
  };
}

export async function emailTicket(ticketId: string) {
  const ticket = await db.ticket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      emailSentAt: true,
      user: { select: { name: true, email: true } },
      event: {
        select: {
          name: true,
          description: true,
          date: true,
          location: true,
          club: { select: { name: true } },
        },
      },
    },
  });
  if (!ticket) throw new Error("Ticket not found for email delivery.");
  if (ticket.emailSentAt) return { sent: true, alreadySent: true };

  const { from, transport } = createSmtpTransport();
  const pdf = await createTicketPdf(ticket);
  const filename = `${ticket.event.name.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 60) || "event"}-ticket.pdf`;
  try {
    await transport.sendMail({
      from,
      to: ticket.user.email,
      subject: `Your ticket for ${ticket.event.name}`,
      text: [
        `Hi ${ticket.user.name},`,
        "",
        `Your ticket for ${ticket.event.name} at ${ticket.event.club.name} is attached as a PDF.`,
        "Show the QR code at check-in.",
      ].join("\n"),
      attachments: [{ filename, content: pdf, contentType: "application/pdf" }],
    });
  } finally {
    transport.close();
  }

  await db.ticket.update({
    where: { id: ticket.id },
    data: { emailSentAt: new Date() },
  });
  return { sent: true, alreadySent: false };
}
