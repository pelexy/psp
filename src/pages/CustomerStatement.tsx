import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Printer } from "lucide-react";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const CustomerStatement = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPendingInvoices = async () => {
      if (!customerId || !accessToken) return;

      setLoading(true);
      try {
        const response = await apiService.getCustomerPendingInvoices(accessToken, customerId);
        if (response?.data) {
          setData(response.data);
        } else if (response) {
          setData(response);
        }
      } catch (error: any) {
        console.error("Error fetching pending invoices:", error);
        toast.error(error.message || "Failed to load pending invoices");
      } finally {
        setLoading(false);
      }
    };

    fetchPendingInvoices();
  }, [customerId, accessToken]);

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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

  if (!data || !data.invoices || data.invoices.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900">No Pending Invoices</h2>
            <p className="text-gray-500 mt-2">This customer has no outstanding invoices.</p>
            <Button onClick={() => navigate(-1)} className="mt-4">
              Go Back
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { customer, psp, invoices, summary } = data;
  const customerAccountNumber = customer?.accountNumber || "N/A";

  return (
    <DashboardLayout>
      {/* Action Bar */}
      <div className="p-4 border-b bg-white print:hidden">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={handlePrint} className="bg-green-600 hover:bg-green-700">
            <Printer className="h-4 w-4 mr-2" />
            Print Statement
          </Button>
        </div>
      </div>

      {/* Statement Content - LAWMA Style */}
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
                    <td style={{ borderBottom: "1px solid #000", minWidth: "100px", textAlign: "right" }}>{customer?.wardCode || ""}</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: "right", paddingRight: "8px" }}>Local Govt. Code</td>
                    <td style={{ borderBottom: "1px solid #000", textAlign: "right" }}>{customer?.lgaCode || ""}</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: "right", paddingRight: "8px" }}>Ward:</td>
                    <td style={{ borderBottom: "1px solid #000", textAlign: "right" }}>{customer?.ward || ""}</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: "right", paddingRight: "8px" }}>Local Government:</td>
                    <td style={{ borderBottom: "1px solid #000", textAlign: "right" }}>{customer?.lga || ""}</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: "right", paddingRight: "8px" }}>Property Code</td>
                    <td style={{ borderBottom: "1px solid #000", textAlign: "right" }}>{customer?.propertyCode || ""}</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: "right", paddingRight: "8px" }}>Street:</td>
                    <td style={{ borderBottom: "1px solid #000", textAlign: "right" }}>{customer?.street || customer?.address || ""}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ROW 4 - PSP/Biller Company Section */}
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
            {psp?.logo ? (
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
                {(psp?.companyName || "P").charAt(0)}
              </div>
            )}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: "bold", fontSize: "20px", fontStyle: "italic", color: "#c94a2a" }}>
                {psp?.companyName || "Service Provider"}
              </div>
              <div style={{ fontSize: "12px", marginTop: "5px", color: "#555" }}>
                {psp?.address || "Lagos, Nigeria"}
              </div>
            </div>
          </div>

          {/* TAGLINE BANNER */}
          <div style={{
            backgroundColor: "#fff",
            border: "1px solid #000",
            padding: "8px",
            textAlign: "center",
            marginBottom: "15px",
            fontWeight: "bold",
            fontSize: "12px",
            color: "#c94a2a"
          }}>
            PLACING OUR CUSTOMER AND THE ENVIRONMENT FIRST
          </div>

          {/* STATEMENT OF ACCOUNT Header */}
          <div style={{
            backgroundColor: "#000",
            color: "#fff",
            padding: "10px 15px",
            fontWeight: "bold",
            fontSize: "16px",
            textAlign: "center",
            marginBottom: "15px"
          }}>
            STATEMENT OF ACCOUNT
          </div>

          {/* Customer Info */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "15px",
            padding: "15px",
            backgroundColor: "#fff",
            border: "1px solid #ddd"
          }}>
            <div>
              <strong>Customer Name:</strong> {customer?.fullName || "N/A"}<br />
              <strong>Account Number:</strong> {customerAccountNumber}<br />
              <strong>Phone:</strong> {customer?.phone || "N/A"}
            </div>
            <div style={{ textAlign: "right" }}>
              <strong>Statement Date:</strong> {new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}<br />
              <strong>Address:</strong> {customer?.address || "N/A"}
            </div>
          </div>

          {/* Summary Box */}
          <div style={{
            display: "flex",
            justifyContent: "space-around",
            marginBottom: "15px",
            padding: "15px",
            backgroundColor: "#fff",
            border: "2px solid #000"
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "12px", color: "#666" }}>Total Invoices</div>
              <div style={{ fontSize: "24px", fontWeight: "bold" }}>{summary?.totalInvoices || 0}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "12px", color: "#666" }}>Total Billed</div>
              <div style={{ fontSize: "18px", fontWeight: "bold" }}>₦{formatCurrency(summary?.totalAmount || 0)}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "12px", color: "#666" }}>Total Paid</div>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: "green" }}>₦{formatCurrency(summary?.totalPaid || 0)}</div>
            </div>
            <div style={{ textAlign: "center", backgroundColor: "#fff3cd", padding: "10px", borderRadius: "5px" }}>
              <div style={{ fontSize: "12px", color: "#856404" }}>Amount Due</div>
              <div style={{ fontSize: "20px", fontWeight: "bold", color: "#c00" }}>₦{formatCurrency(summary?.totalOutstanding || 0)}</div>
            </div>
          </div>

          {/* Invoice List */}
          <div style={{ marginBottom: "15px" }}>
            <div style={{ backgroundColor: "#000", color: "#fff", padding: "8px 15px", fontWeight: "bold" }}>
              OUTSTANDING INVOICES
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#fff" }}>
              <thead>
                <tr style={{ backgroundColor: "#f5f5f5" }}>
                  <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left" }}>Invoice #</th>
                  <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left" }}>Service</th>
                  <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "center" }}>Due Date</th>
                  <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "right" }}>Amount</th>
                  <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "right" }}>Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: any, index: number) => (
                  <tr key={index}>
                    <td style={{ border: "1px solid #ddd", padding: "10px", fontFamily: "monospace" }}>{inv.invoiceNumber}</td>
                    <td style={{ border: "1px solid #ddd", padding: "10px" }}>{inv.collection || inv.description || "Service"}</td>
                    <td style={{ border: "1px solid #ddd", padding: "10px", textAlign: "center" }}>{formatDate(inv.dueDate)}</td>
                    <td style={{ border: "1px solid #ddd", padding: "10px", textAlign: "right" }}>₦{formatCurrency(inv.totalAmount)}</td>
                    <td style={{ border: "1px solid #ddd", padding: "10px", textAlign: "right", fontWeight: "bold", color: "#c00" }}>
                      ₦{formatCurrency(inv.outstandingAmount || (inv.totalAmount - (inv.amountPaid || 0)))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
                  <td colSpan={3} style={{ border: "1px solid #ddd", padding: "10px", textAlign: "right" }}>TOTAL:</td>
                  <td style={{ border: "1px solid #ddd", padding: "10px", textAlign: "right" }}>₦{formatCurrency(summary?.totalAmount || 0)}</td>
                  <td style={{ border: "1px solid #ddd", padding: "10px", textAlign: "right", color: "#c00", fontSize: "14px" }}>
                    ₦{formatCurrency(summary?.totalOutstanding || 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment Info Box */}
          <div style={{
            border: "2px solid #000",
            padding: "15px",
            marginBottom: "15px"
          }}>
            <div style={{ textAlign: "center", fontWeight: "bold", marginBottom: "10px", borderBottom: "1px solid #000", paddingBottom: "10px" }}>
              APPROVED BANK ACCOUNT NUMBER
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: "bold", fontSize: "16px", color: "#0066b2" }}>BuyPower MFB</div>
              <div style={{ fontSize: "10px", color: "#666" }}>PLS PAY TO THIS ACCOUNT ONLY</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", fontFamily: "monospace", letterSpacing: "2px", marginTop: "5px" }}>
                {customerAccountNumber}
              </div>
            </div>
          </div>

          {/* Legal Text */}
          <div style={{ fontSize: "9px", lineHeight: "1.4", marginBottom: "15px" }}>
            This statement is issued by LAWMA on behalf of the Lagos State Government by virtue of Section 18 of the Lagos
            Waste Management Authority Law No. 27 Vol. 40, Laws of Lagos State 2007, any person who fails or
            neglects to pay the tariff, fees or charges prescribed by the Lagos Waste Management Authority commits
            an offence and is liable on conviction to a fine or imprisonment.
          </div>

          {/* Customer Contact Notice */}
          <div style={{ fontSize: "10px", marginBottom: "15px" }}>
            <strong>Dear Customer,</strong><br />
            Please call the LAWMA Response Centre (LRC) on the following<br />
            Numbers: 08099540522, 08055443939, 01-8538601, 01-8177878
          </div>

          {/* Footer */}
          <div style={{
            marginTop: "20px",
            paddingTop: "15px",
            borderTop: "2px solid #000",
            textAlign: "center",
            fontSize: "10px",
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

export default CustomerStatement;
