import PDFDocument from "pdfkit";
import QRCode from "qrcode";

export type TicketPdfDetails = {
  id: string;
  user: { name: string };
  event: {
    name: string;
    description: string | null;
    date: Date;
    location: string | null;
  };
};

function formattedDate(date: Date) {
  return date.toLocaleString("en", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export async function createTicketPdf(ticket: TicketPdfDetails) {
  const qrCode = await QRCode.toBuffer(`AIHUB-TICKET:${ticket.id}`, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 360,
    color: { dark: "#172554", light: "#ffffff" },
  });

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const document = new PDFDocument({
      size: [760, 360],
      margin: 0,
      compress: true,
    });
    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("error", reject);
    document.on("end", () => resolve(Buffer.concat(chunks)));

    document.rect(0, 0, 760, 360).fill("#eef2f7");
    document.roundedRect(20, 20, 720, 320, 18).fill("#ffffff");
    document.roundedRect(20, 20, 720, 12, 6).fill("#243b63");

    document
      .fillColor("#64748b")
      .font("Helvetica-Bold")
      .fontSize(9)
      .text("QRpresso /  EVENT ADMISSION", 46, 52);
    document
      .fillColor("#172554")
      .font("Helvetica-Bold")
      .fontSize(25)
      .text(ticket.event.name, 46, 80, {
        width: 404,
        height: 62,
        ellipsis: true,
        lineGap: 2,
      });

    document
      .fillColor("#334155")
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("DATE & TIME", 46, 163);
    document
      .fillColor("#172554")
      .font("Helvetica")
      .fontSize(12)
      .text(formattedDate(ticket.event.date), 46, 180, {
        width: 404,
        height: 34,
        ellipsis: true,
      });

    let detailsY = 233;
    if (ticket.event.location) {
      document
        .fillColor("#334155")
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("LOCATION", 46, detailsY);
      document
        .fillColor("#172554")
        .font("Helvetica")
        .fontSize(12)
        .text(ticket.event.location, 46, detailsY + 16, {
          width: 404,
          height: 24,
          ellipsis: true,
        });
      detailsY += 51;
    }
    if (ticket.event.description && detailsY < 316) {
      const description = ticket.event.description.replace(/\s+/g, " ").trim();
      document
        .fillColor("#64748b")
        .font("Helvetica")
        .fontSize(9)
        .text(description, 46, detailsY, {
          width: 404,
          height: 34,
          ellipsis: true,
          lineGap: 2,
        });
    }

    document.save();
    document
      .moveTo(474, 50)
      .lineTo(474, 310)
      .dash(4, { space: 5 })
      .stroke("#cbd5e1");
    document.restore();

    document
      .fillColor("#64748b")
      .font("Helvetica-Bold")
      .fontSize(9)
      .text("TICKET HOLDER", 502, 56);
    document
      .fillColor("#172554")
      .font("Helvetica-Bold")
      .fontSize(18)
      .text(ticket.user.name, 502, 74, {
        width: 224,
        height: 42,
        ellipsis: true,
      });
    document.image(qrCode, 542, 126, {
      fit: [140, 140],
      align: "center",
      valign: "center",
    });
    document
      .fillColor("#64748b")
      .font("Helvetica")
      .fontSize(9)
      .text("Scan this code at check-in", 502, 278, {
        width: 224,
        align: "center",
      });
    document
      .fillColor("#94a3b8")
      .font("Helvetica")
      .fontSize(7)
      .text(`Ticket ${ticket.id}`, 502, 299, {
        width: 224,
        align: "center",
        ellipsis: true,
      });
    document.end();
  });
}
