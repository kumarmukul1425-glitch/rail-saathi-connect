import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Share2, MessageCircle, QrCode, X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TicketData {
  pnr: string;
  trainNumber: string;
  trainName: string;
  sourceCode: string;
  destinationCode: string;
  date: string;
  seatClass: string;
  passengers: { name: string; age: string | number; gender: string }[];
  totalFare: number;
}

export default function TicketShare({ ticket }: { ticket: TicketData }) {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const ticketText = `🚂 *RailSaathi Ticket*\n\n📋 *PNR:* ${ticket.pnr}\n🚆 *Train:* ${ticket.trainNumber} - ${ticket.trainName}\n📍 *Route:* ${ticket.sourceCode} → ${ticket.destinationCode}\n📅 *Date:* ${ticket.date}\n💺 *Class:* ${ticket.seatClass}\n👥 *Passengers:* ${ticket.passengers.map((p) => `${p.name} (${p.age}y/${p.gender})`).join(", ")}\n💰 *Fare:* ₹${ticket.totalFare}\n\nBooked via RailSaathi 🇮🇳`;

  const qrData = JSON.stringify({
    pnr: ticket.pnr,
    train: ticket.trainNumber,
    route: `${ticket.sourceCode}-${ticket.destinationCode}`,
    date: ticket.date,
    class: ticket.seatClass,
    passengers: ticket.passengers.length,
    fare: ticket.totalFare,
  });

  const shareWhatsApp = () => {
    const encoded = encodeURIComponent(ticketText);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  const copyTicket = async () => {
    try {
      await navigator.clipboard.writeText(ticketText.replace(/\*/g, ""));
      setCopied(true);
      toast.success("Ticket details copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          onClick={shareWhatsApp}
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 text-xs border-green-500/30 text-green-600 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          WhatsApp
        </Button>
        <Button
          onClick={() => setShowQR(true)}
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 text-xs"
        >
          <QrCode className="w-3.5 h-3.5" />
          QR Code
        </Button>
        <Button
          onClick={copyTicket}
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 text-xs"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowQR(false)}>
          <div
            className="bg-card rounded-2xl p-6 border border-border w-full max-w-xs text-center relative"
            style={{ boxShadow: "var(--shadow-prominent)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setShowQR(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>

            <QrCode className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="text-sm font-bold text-foreground mb-1">Scan Ticket QR</h3>
            <p className="text-xs text-muted-foreground mb-4">Share this QR code with fellow passengers</p>

            <div className="bg-white rounded-xl p-4 inline-block mb-4">
              <QRCodeSVG
                value={qrData}
                size={180}
                level="M"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#1a365d"
              />
            </div>

            <div className="bg-secondary/50 rounded-lg p-2.5 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">PNR</span>
                <span className="font-bold text-primary">{ticket.pnr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Train</span>
                <span className="font-semibold">{ticket.trainNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Route</span>
                <span className="font-semibold">{ticket.sourceCode} → {ticket.destinationCode}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
