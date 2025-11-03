import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download, Printer, QrCode, Recycle, MapPin, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface TrashSealPreviewProps {
  customer: {
    customerDetails: {
      fullName: string;
      customerAccountNumber: string;
      isActive: boolean;
      city?: string;
      state?: string;
      lga?: string;
    };
  };
}

export const TrashSealPreview = ({ customer }: TrashSealPreviewProps) => {
  const [open, setOpen] = useState(false);
  const sealRef = useRef<HTMLDivElement>(null);

  const details = customer.customerDetails;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !sealRef.current) return;

    const sealHtml = sealRef.current.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Trash Seal - ${details.customerAccountNumber}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: #f5f5f5;
              font-family: system-ui, -apple-system, sans-serif;
            }
            .seal-container {
              width: 320px;
              min-height: 400px;
              background: white;
              border: 6px solid hsl(var(--primary, 142 76% 36%));
              border-radius: 12px;
              padding: 24px;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            }
            @media print {
              body {
                background: white;
              }
              .seal-container {
                box-shadow: none;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="seal-container">
            ${sealHtml}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);

    toast.success("Print dialog opened");
  };

  const handleDownload = () => {
    if (!sealRef.current) return;

    // Create a canvas to convert the seal to an image
    const seal = sealRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      toast.error("Failed to generate image");
      return;
    }

    // Set canvas size (seal dimensions)
    canvas.width = seal.offsetWidth * 2; // 2x for better quality
    canvas.height = seal.offsetHeight * 2;

    toast.success("Use Print button for best quality output");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <QrCode className="h-4 w-4" />
          Preview Trash Seal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Trash Seal Preview</DialogTitle>
          <DialogDescription>
            This seal will be placed on the trash can for operator scanning
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Print Actions */}
          <div className="flex gap-2 justify-end print:hidden">
            <Button onClick={handlePrint} size="sm" className="gap-2">
              <Printer className="h-4 w-4" />
              Print Seal
            </Button>
          </div>

          {/* Trash Seal Design */}
          <div className="flex justify-center">
            <div
              ref={sealRef}
              style={{
                width: "320px",
                minHeight: "400px",
                background: "white",
                border: "6px solid #22c55e",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
              }}
            >
              {/* Compact Header */}
              <div style={{ textAlign: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "2px solid #22c55e" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" />
                  </svg>
                  <div style={{ textAlign: "left" }}>
                    <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#111827", margin: 0 }}>COLLECT</h2>
                    <p style={{ fontSize: "10px", color: "#4b5563", marginTop: "-2px" }}>by BuyPower</p>
                  </div>
                </div>
              </div>

              {/* QR Code - Larger and Centered */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                <div style={{ background: "white", padding: "12px", borderRadius: "8px", border: "2px solid #d1d5db" }}>
                  <QRCodeSVG
                    value={details.customerAccountNumber}
                    size={160}
                    level="H"
                    includeMargin={false}
                    fgColor="#000000"
                    bgColor="#ffffff"
                  />
                </div>
              </div>

              {/* Account Number */}
              <div style={{ textAlign: "center", marginBottom: "16px" }}>
                <p style={{ fontSize: "20px", fontWeight: "bold", fontFamily: "monospace", color: "#111827", letterSpacing: "0.05em", margin: 0 }}>
                  {details.customerAccountNumber}
                </p>
              </div>

              {/* Address Only */}
              <div style={{ textAlign: "center", marginBottom: "16px", paddingLeft: "8px", paddingRight: "8px" }}>
                <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.375", margin: 0 }}>
                  {customer.customerDetails.address || 'No address provided'}
                </p>
              </div>

              {/* Simple Status Indicator */}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: details.isActive ? "#22c55e" : "#ef4444"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900 print:hidden">
            <p className="font-semibold mb-2">Printing Instructions:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Use high-quality sticker paper or laminated paper</li>
              <li>Print in color for best results</li>
              <li>Recommended size: 4" x 5" or A6</li>
              <li>Ensure QR code is clearly visible and scannable</li>
              <li>Laminate for weather resistance</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
