import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Printer } from "lucide-react";
import { apiService } from "@/services/api";
import { toast } from "sonner";

const InvoiceDetail = () => {
  const { invoiceNumber } = useParams<{ invoiceNumber: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceNumber) return;

      setLoading(true);
      try {
        const response = await apiService.getPublicInvoiceDetails(invoiceNumber);
        let invoiceData = null;
        if (response?.data?.data) {
          invoiceData = response.data.data;
        } else if (response?.data) {
          invoiceData = response.data;
        } else if (response) {
          invoiceData = response;
        }
        setInvoice(invoiceData);
      } catch (error: any) {
        console.error("Error fetching invoice:", error);
        toast.error(error.message || "Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceNumber]);

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const getInvoiceMonth = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-NG", {
      month: "long",
      year: "numeric",
    });
  };

  const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (num === 0) return 'Zero Naira Only';

    const convertGroup = (n: number): string => {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertGroup(n % 100) : '');
      if (n < 1000000) return convertGroup(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convertGroup(n % 1000) : '');
      return convertGroup(Math.floor(n / 1000000)) + ' Million' + (n % 1000000 ? ' ' + convertGroup(n % 1000000) : '');
    };

    return convertGroup(Math.floor(num)) + ' Naira Only';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900">Invoice Not Found</h2>
            <p className="text-gray-500 mt-2">The invoice you're looking for doesn't exist.</p>
            <Button onClick={() => navigate(-1)} className="mt-4">
              Go Back
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const psp = invoice.psp || {};
  const customer = invoice.customer || {};
  const service = invoice.service || {};

  const totalAmount = invoice.totalAmount || 0;
  const amountPaid = invoice.amountPaid || 0;
  const outstandingAmount = totalAmount - amountPaid;
  const customerAccountNumber = customer.accountNumber || customer.customerAccountNumber || "N/A";

  return (
    <DashboardLayout>
      {/* Action Bar - Hidden when printing */}
      <div className="p-4 border-b bg-white print:hidden">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="bg-green-600 hover:bg-green-700">
              <Printer className="h-4 w-4 mr-2" />
              Print Invoice
            </Button>
          </div>
        </div>
      </div>

      {/* Invoice Content - EXACT LAWMA Style */}
      <div className="p-4 md:p-6 bg-gray-100 min-h-screen print:bg-white print:p-0">
        <div
          ref={printRef}
          data-print-content
          style={{
            fontFamily: "Arial, sans-serif",
            backgroundColor: "#f0ebe3", /* Warm cream/beige like LAWMA government paper */
            maxWidth: "850px",
            margin: "0 auto",
            padding: "15px",
            fontSize: "11px",
          }}
          className="print:shadow-none print:max-w-full"
        >
          {/* ROW 1 - LAGOS WASTE MANAGEMENT AUTHORITY */}
          <div style={{ textAlign: "center", marginBottom: "15px" }}>
            <h1 style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#000",
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "3px"
            }}>
              Lagos Waste Management Authority
            </h1>
          </div>

          {/* ROW 2 - Lagos Logo (centered) */}
          <div style={{ textAlign: "center", marginBottom: "15px" }}>
            <img
              src="https://acceleratingtozero.org/wp-content/uploads/2022/10/Lagos-logo.png"
              alt="Lagos State"
              style={{ height: "120px", display: "block", margin: "0 auto" }}
              crossOrigin="anonymous"
            />
          </div>

          {/* ROW 3 - LAWMA Box | LAWMA Address | Customer Codes */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "20px"
          }}>
            {/* Left - LAWMA Branding Box */}
            <div style={{
              backgroundColor: "#c94a2a",
              color: "white",
              padding: "12px 18px",
              borderRadius: "3px"
            }}>
              <div style={{ fontWeight: "bold", fontSize: "20px", fontStyle: "italic" }}>Lawma</div>
              <div style={{ fontWeight: "bold", fontSize: "20px", fontStyle: "italic" }}>Lawma</div>
              <div style={{ fontWeight: "bold", fontSize: "20px", fontStyle: "italic" }}>Lawma</div>
              <div style={{ fontSize: "7px", marginTop: "8px", fontStyle: "italic" }}>
                "New Trend in Cleaning & Professionalism"
              </div>
            </div>

            {/* Center - LAWMA Address */}
            <div style={{ textAlign: "center", fontSize: "11px", lineHeight: "1.6" }}>
              2, Otto Road, Ijora Olopa, Lagos.<br />
              Tel: 01-7400795, 8196986, Fax: 01-5844784<br />
              E-mail: newlawma@gmail.com<br />
              Website: www.lawma.org
            </div>

            {/* Right - Customer Codes */}
            <div style={{ fontSize: "11px" }}>
              <table>
                <tbody>
                  <tr>
                    <td style={{ textAlign: "right", paddingRight: "8px" }}>Ward Code</td>
                    <td style={{ borderBottom: "1px solid #000", minWidth: "100px", textAlign: "right" }}>{customer.wardCode || ""}</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: "right", paddingRight: "8px" }}>Local Govt. Code</td>
                    <td style={{ borderBottom: "1px solid #000", textAlign: "right" }}>{customer.lgaCode || ""}</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: "right", paddingRight: "8px" }}>Ward:</td>
                    <td style={{ borderBottom: "1px solid #000", textAlign: "right" }}>{customer.ward || ""}</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: "right", paddingRight: "8px" }}>Local Government:</td>
                    <td style={{ borderBottom: "1px solid #000", textAlign: "right" }}>{customer.lga || ""}</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: "right", paddingRight: "8px" }}>Property Code</td>
                    <td style={{ borderBottom: "1px solid #000", textAlign: "right" }}>{customer.propertyCode || ""}</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: "right", paddingRight: "8px" }}>Street:</td>
                    <td style={{ borderBottom: "1px solid #000", textAlign: "right" }}>{customer.street || customer.address || ""}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ROW 3 - PSP/Biller Company Section */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "20px",
            padding: "15px",
            marginBottom: "15px",
            backgroundColor: "#f5f5f5",
            border: "1px solid #ddd",
            borderRadius: "5px"
          }}>
            {/* Biller Logo */}
            {psp.logo ? (
              <img
                src={psp.logo}
                alt={psp.companyName}
                style={{ height: "60px", objectFit: "contain" }}
              />
            ) : (
              <div style={{
                width: "70px",
                height: "70px",
                backgroundColor: "#c94a2a",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "bold",
                fontSize: "28px"
              }}>
                {(psp.companyName || "P").charAt(0)}
              </div>
            )}

            {/* Biller Name & Address */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: "bold", fontSize: "20px", fontStyle: "italic", color: "#c94a2a" }}>
                {psp.companyName || "Service Provider"}
              </div>
              <div style={{ fontSize: "12px", marginTop: "5px", color: "#555" }}>
                {psp.address || "Lagos, Nigeria"}
              </div>
              {psp.phone && (
                <div style={{ fontSize: "11px", marginTop: "3px", color: "#666" }}>
                  Tel: {psp.phone}
                </div>
              )}
            </div>
          </div>

          {/* TAGLINE BANNER */}
          <div style={{
            backgroundColor: "#fff",
            border: "1px solid #000",
            padding: "5px",
            textAlign: "center",
            marginBottom: "10px",
            fontWeight: "bold",
            fontSize: "11px",
            color: "#d4380d"
          }}>
            PLACING OUR CUSTOMER AND THE ENVIRONMENT FIRST
          </div>

          {/* MAIN CONTENT - Two columns */}
          <div style={{ display: "flex", gap: "15px" }}>

            {/* LEFT COLUMN - Bill Summary */}
            <div style={{ flex: "1.5" }}>
              {/* BILL SUMMARY Header */}
              <div style={{
                backgroundColor: "#000",
                color: "#fff",
                padding: "5px 10px",
                fontWeight: "bold",
                fontSize: "12px",
                textAlign: "center"
              }}>
                BILL SUMMARY
              </div>

              {/* Bill Table */}
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "10px" }}>
                <thead>
                  <tr>
                    <th style={{ border: "1px solid #000", padding: "5px", textAlign: "left", backgroundColor: "#f0f0f0" }}>Name</th>
                    <th style={{ border: "1px solid #000", padding: "5px", textAlign: "center", backgroundColor: "#f0f0f0" }}>Unit</th>
                    <th style={{ border: "1px solid #000", padding: "5px", textAlign: "right", backgroundColor: "#f0f0f0" }}>Unit Price</th>
                    <th style={{ border: "1px solid #000", padding: "5px", textAlign: "right", backgroundColor: "#f0f0f0" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: "1px solid #000", padding: "5px" }}>
                      {service?.serviceName || service?.collectionName || invoice.description || "Service Charge"}
                    </td>
                    <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>1</td>
                    <td style={{ border: "1px solid #000", padding: "5px", textAlign: "right" }}>
                      {formatCurrency(invoice.amount || 0)}
                    </td>
                    <td style={{ border: "1px solid #000", padding: "5px", textAlign: "right" }}>
                      {formatCurrency(invoice.amount || 0)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} style={{ border: "1px solid #000", padding: "5px", fontStyle: "italic", color: "#666" }}>
                      Description: {invoice.description || service?.serviceName || "Monthly Service Charge"}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Invoice Month */}
              <div style={{
                border: "1px solid #000",
                padding: "8px",
                marginBottom: "10px",
                display: "flex",
                justifyContent: "space-between"
              }}>
                <span><strong>Invoice Month</strong></span>
                <span>{getInvoiceMonth(invoice.issueDate || invoice.createdAt)}</span>
              </div>

              {/* Charges Summary */}
              <table style={{ width: "100%", marginBottom: "10px" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "3px 0" }}>Current Charges:</td>
                    <td style={{ padding: "3px 0", textAlign: "right", borderBottom: "1px dotted #000" }}>
                      {formatCurrency(invoice.amount || 0)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "3px 0" }}>Net Arrears:</td>
                    <td style={{ padding: "3px 0", textAlign: "right", borderBottom: "1px dotted #000" }}>
                      {formatCurrency(amountPaid > 0 ? 0 : (invoice.arrears || 0))}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "3px 0", fontWeight: "bold" }}>Total:</td>
                    <td style={{ padding: "3px 0", textAlign: "right", fontWeight: "bold", borderBottom: "2px solid #000" }}>
                      {formatCurrency(totalAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Legal Text */}
              <div style={{
                fontSize: "9px",
                lineHeight: "1.4",
                marginBottom: "10px"
              }}>
                This bill is issued by LAWMA on behalf of the Lagos State Government by virtue of Section 18 of the Lagos
                Waste Management Authority Law No. 27 Vol. 40, Laws of Lagos State 2007, any person who fails or
                neglects to pay the tariff, fees or charges prescribed by the Lagos Waste Management Authority commits
                an offence and is liable on conviction to a fine or imprisonment.
              </div>

              {/* Customer Contact Notice */}
              <div style={{ fontSize: "10px", marginBottom: "10px" }}>
                <strong>Dear Customer,</strong><br />
                Please call the LAWMA Response Centre (LRC) on the following<br />
                Numbers: 08099540522, 08055443939, 01-8538601, 01-8177878
              </div>

              {/* Reference Codes */}
              <table style={{ width: "100%", marginBottom: "10px", fontSize: "10px" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "3px 0" }}>Reference Code:</td>
                    <td style={{ padding: "3px 0", borderBottom: "1px solid #000" }}>{invoice.invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "3px 0" }}>Property Code:</td>
                    <td style={{ padding: "3px 0", borderBottom: "1px solid #000" }}>{customer.propertyCode || customerAccountNumber}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* RIGHT COLUMN - Bank Account & Receipt */}
            <div style={{ flex: "1" }}>
              {/* APPROVED BANK ACCOUNT Box */}
              <div style={{
                border: "2px solid #000",
                padding: "10px",
                marginBottom: "10px"
              }}>
                <div style={{
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: "11px",
                  marginBottom: "15px",
                  borderBottom: "1px solid #000",
                  paddingBottom: "5px"
                }}>
                  APPROVED BANK ACCOUNT NUMBER
                </div>

                {/* Bank 1 */}
                <div style={{
                  textAlign: "center",
                  marginBottom: "15px",
                  padding: "10px",
                  backgroundColor: "#f5f5f5"
                }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px", color: "#0066b2" }}>
                    BuyPower MFB
                  </div>
                  <div style={{ fontSize: "9px", color: "#666" }}>
                    PLS PAY TO THIS ACCOUNT ONLY
                  </div>
                  <div style={{
                    fontSize: "22px",
                    fontWeight: "bold",
                    fontFamily: "monospace",
                    color: "#000",
                    letterSpacing: "2px",
                    marginTop: "5px"
                  }}>
                    {customerAccountNumber}
                  </div>
                </div>

                {/* Customer Receipt Box */}
                <div style={{
                  border: "2px dashed #000",
                  padding: "15px",
                  textAlign: "center",
                  minHeight: "80px"
                }}>
                  <div style={{ fontSize: "10px", fontWeight: "bold" }}>Customer Receipt</div>
                  <div style={{ fontSize: "9px", color: "#666" }}>Payment Confirmation</div>
                  <div style={{ marginTop: "20px", fontSize: "8px", color: "#999" }}>
                    DATE<br />
                    SIGNATURE<br />
                    and BANK STAMP
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div style={{
                textAlign: "center",
                padding: "10px",
                backgroundColor: invoice.status === "paid" ? "#d4edda" : "#fff3cd",
                border: `2px solid ${invoice.status === "paid" ? "#28a745" : "#ffc107"}`,
                fontWeight: "bold",
                fontSize: "14px"
              }}>
                {invoice.status === "paid" ? "PAID" : (invoice.status || "PENDING").toUpperCase()}
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION - PSP COPY */}
          <div style={{
            borderTop: "2px solid #000",
            marginTop: "15px",
            paddingTop: "10px"
          }}>
            <div style={{
              backgroundColor: "#000",
              color: "#fff",
              padding: "3px 10px",
              fontWeight: "bold",
              fontSize: "10px",
              display: "inline-block",
              marginBottom: "10px"
            }}>
              LAWMA COPY
            </div>

            <div style={{ display: "flex", gap: "20px" }}>
              {/* Left side - Customer details */}
              <div style={{ flex: "1" }}>
                <table style={{ width: "100%", fontSize: "10px" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "3px 0", width: "100px" }}><strong>Name:</strong></td>
                      <td style={{ padding: "3px 0", borderBottom: "1px solid #000" }}>
                        {customer.fullName || customer.name || "N/A"}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "3px 0" }}><strong>Address:</strong></td>
                      <td style={{ padding: "3px 0", borderBottom: "1px solid #000" }}>
                        {customer.address || "N/A"}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "3px 0" }}><strong>Amount Paid:</strong></td>
                      <td style={{ padding: "3px 0", borderBottom: "1px solid #000" }}>
                        {formatCurrency(amountPaid)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "3px 0" }}><strong>Amount in words:</strong></td>
                      <td style={{ padding: "3px 0", borderBottom: "1px solid #000", fontSize: "9px" }}>
                        {numberToWords(amountPaid || totalAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Right side - Codes */}
              <div style={{ flex: "1" }}>
                <table style={{ width: "100%", fontSize: "10px" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "3px 0" }}><strong>Customer Account Code:</strong></td>
                      <td style={{ padding: "3px 0", borderBottom: "1px solid #000" }}>{customerAccountNumber}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "3px 0" }}><strong>Property Class:</strong></td>
                      <td style={{ padding: "3px 0", borderBottom: "1px solid #000" }}>{customer.propertyClass || "Residential"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "3px 0" }}><strong>Amount Due:</strong></td>
                      <td style={{ padding: "3px 0", borderBottom: "1px solid #000" }}>{formatCurrency(outstandingAmount)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "3px 0" }}><strong>Invoice Month:</strong></td>
                      <td style={{ padding: "3px 0", borderBottom: "1px solid #000" }}>{getInvoiceMonth(invoice.issueDate || invoice.createdAt)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Customer Phone */}
            <div style={{ marginTop: "10px", fontSize: "10px" }}>
              <strong>Customer's Phone Number:</strong>
              <span style={{ borderBottom: "1px solid #000", marginLeft: "10px", paddingRight: "100px" }}>
                {customer.phone || "N/A"}
              </span>
              <span style={{ float: "right", fontSize: "9px", color: "#666" }}>
                DATE, SIGNATURE and BANK STAMP
              </span>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            marginTop: "15px",
            paddingTop: "10px",
            borderTop: "1px solid #ccc",
            textAlign: "center",
            fontSize: "9px",
            color: "#666"
          }}>
            Powered by <strong>BuyPower Pay</strong> | Payment Processing Services
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          html, body {
            height: auto;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          [data-print-content],
          [data-print-content] * {
            visibility: visible !important;
          }
          [data-print-content] {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100% !important;
            box-shadow: none !important;
          }
          @page {
            margin: 0.5cm;
            size: A4 portrait;
          }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default InvoiceDetail;
