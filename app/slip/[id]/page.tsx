"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Printer, CheckCircle, AlertCircle, Download, Image as ImageIcon } from "lucide-react";
import { getSlipById, updateSlipStatus, getAgents } from "@/lib/storage";
import { Slip, mockSlips } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { getDrawById, Draw } from "@/lib/draw";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SlipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const slipId = params.id as string;
  const [slip, setSlip] = useState<Slip | null>(null);
  const [draw, setDraw] = useState<Draw | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    } else {
      setIsAuthChecked(true);
    }
  }, [router]);

  useEffect(() => {
    if (!slipId) return;

    // Try to get from localStorage first
    let foundSlip = getSlipById(slipId);

    // If not found, check mock data
    if (!foundSlip) {
      foundSlip = mockSlips.find((s) => s.id === slipId) || null;
    }

    setSlip(foundSlip);
    
    // Load draw information if drawId exists
    if (foundSlip?.drawId) {
      const foundDraw = getDrawById(foundSlip.drawId);
      setDraw(foundDraw);
    }
    
    setLoading(false);
  }, [slipId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Check if a number matches lottery result
  const checkItemWin = (item: any, result: any): boolean => {
    if (!result || !item) return false;
    
    const number = item.number;
    let isWin = false;
    
    switch (item.type) {
      case "2 ตัวบน":
        // Match last 2 digits of 3 ตัวตรง
        if (result.result3Straight && result.result3Straight.length >= 2) {
          const last2 = result.result3Straight.slice(-2);
          if (number.padStart(2, "0") === last2) {
            isWin = true;
          }
        }
        break;
      case "2 ตัวล่าง":
        // Match last 2 digits of 3 ตัวตรง
        if (result.result3Straight && result.result3Straight.length >= 2) {
          const last2 = result.result3Straight.slice(-2);
          if (number.padStart(2, "0") === last2) {
            isWin = true;
          }
        }
        break;
      case "3 ตัวตรง":
      case "3 ตัวบน":
      case "3 กลับ":
        if (result.result3Straight && number.padStart(3, "0") === result.result3Straight) {
          isWin = true;
        }
        break;
      case "3 ตัวโต๊ด":
      case "ชุด":
        if (result.result3Tod && Array.isArray(result.result3Tod)) {
          const digits = number.split("");
          const resultDigits = result.result3Tod;
          if (digits.length === 3 && resultDigits.length === 3) {
            const allDigitsMatch = digits.every((d: string) => resultDigits.includes(d));
            const countsMatch = digits.every((d: string) => {
              const countInNumber = digits.filter((x: string) => x === d).length;
              const countInResult = resultDigits.filter((x: string) => x === d).length;
              return countInNumber <= countInResult;
            });
            if (allDigitsMatch && countsMatch) {
              isWin = true;
            }
          }
        }
        break;
      case "วิ่ง":
      case "วิ่งบน":
      case "วิ่งล่าง":
        // Check if number appears in result
        if (result.result3Straight && number.length === 1) {
          if (result.result3Straight.includes(number)) {
            isWin = true;
          }
        }
        break;
      default:
        isWin = false;
    }
    
    return isWin;
  };

  // Calculate payout amount if winning - only for winning items
  const calculatePayout = () => {
    if (!slip || !slip.items) return 0;
    
    // Get draw result if available
    const result = draw?.result || null;
    if (!result) return 0; // No result yet, can't calculate
    
    // Get agent if exists to use custom payout rates
    let agent = null;
    if (slip.agentId) {
      const agents = getAgents();
      agent = agents.find(a => a.id === slip.agentId);
    }

    let totalPayout = 0;
    slip.items.forEach((item) => {
      // Only calculate for winning items
      if (!checkItemWin(item, result)) return;
      
      let payoutRate = 0;
      
      // Priority: 1. Draw payout rates, 2. Agent payout rates, 3. Default
      // Check draw payout rates first
      if (draw?.payoutRates) {
        switch (item.type) {
          case "2 ตัวบน":
            payoutRate = draw.payoutRates["2 ตัวบน"] || agent?.payout2Digit || 70;
            break;
          case "2 ตัวล่าง":
            payoutRate = draw.payoutRates["2 ตัวล่าง"] || agent?.payout2Digit || 70;
            break;
          case "2 ตัวกลับ":
          case "2 กลับ (3 ตัว)":
            payoutRate = draw.payoutRates["2 ตัวกลับ"] || agent?.payout2Digit || 70;
            break;
          case "3 ตัวตรง":
          case "3 ตัวบน":
            payoutRate = draw.payoutRates["3 ตัวตรง"] || agent?.payout3Straight || 800;
            break;
          case "3 กลับ":
            payoutRate = draw.payoutRates["3 กลับ"] || agent?.payout3Straight || 800;
            break;
          case "3 ตัวโต๊ด":
            payoutRate = draw.payoutRates["3 ตัวโต๊ด"] || agent?.payout3Tod || 130;
            break;
          case "ชุด":
            payoutRate = draw.payoutRates["ชุด"] || agent?.payout3Tod || 130;
            break;
          case "วิ่ง":
          case "วิ่งบน":
          case "วิ่งล่าง":
            payoutRate = draw.payoutRates["วิ่ง"] || 3;
            break;
          default:
            payoutRate = 0;
        }
      } else {
        // Fallback to agent or default rates
        switch (item.type) {
          case "2 ตัวบน":
          case "2 ตัวล่าง":
          case "2 ตัวกลับ":
          case "2 กลับ (3 ตัว)":
            payoutRate = agent?.payout2Digit || 70;
            break;
          case "3 ตัวตรง":
          case "3 ตัวบน":
          case "3 กลับ":
            payoutRate = agent?.payout3Straight || 800;
            break;
          case "3 ตัวโต๊ด":
          case "ชุด":
            payoutRate = agent?.payout3Tod || 130;
            break;
          case "วิ่ง":
          case "วิ่งบน":
          case "วิ่งล่าง":
            payoutRate = 3;
            break;
          default:
            payoutRate = 0;
        }
      }
      
      totalPayout += item.amount * payoutRate;
    });
    
    return totalPayout;
  };

  const payoutAmount = calculatePayout();
  const lossAmount = slip ? slip.totalAmount : 0; // ถ้าไม่ถูกรางวัลจะเสียเท่ากับยอดรวม

  const handlePrint = () => {
    // Set document title for print dialog (helps with Save as PDF filename suggestion)
    if (slip) {
      const originalTitle = document.title;
      // Sanitize filename - keep Thai characters and common chars, remove problematic ones
      const sanitizeFilename = (str: string) => {
        if (!str || str.trim() === "") return "ลูกค้า";
        // Remove characters that cause issues in filenames but keep Thai, English, numbers, spaces
        return str
          .replace(/[<>:"/\\|?*]/g, "") // Remove problematic filename characters
          .replace(/\s+/g, " ") // Normalize whitespace
          .trim();
      };
      const customerName = sanitizeFilename(slip.customerName);
      document.title = `โพย_${slip.slipNumber}_${customerName}`;
      
      // Also set a meta tag for better PDF filename support
      let metaTitle = document.querySelector('meta[name="pdf-title"]');
      if (!metaTitle) {
        metaTitle = document.createElement("meta");
        metaTitle.setAttribute("name", "pdf-title");
        document.head.appendChild(metaTitle);
      }
      metaTitle.setAttribute("content", document.title);
      
      window.print();
      
      // Restore original title after print
      setTimeout(() => {
        document.title = originalTitle;
        if (metaTitle) {
          metaTitle.remove();
        }
      }, 1000);
    } else {
      window.print();
    }
  };

  const handleDownloadPDF = async () => {
    if (!slip) return;
    
    // Ensure we're in the browser
    if (typeof window === "undefined") {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "ฟีเจอร์นี้ใช้ได้เฉพาะในเบราว์เซอร์เท่านั้น",
      });
      return;
    }

    try {
      // Dynamic import to avoid SSR issues - only import in browser
      const html2pdfModule = await import("html2pdf.js");
      const html2pdf = html2pdfModule.default || html2pdfModule;
      
      const element = document.getElementById("slip-content");
      if (!element) {
        toast({
          variant: "destructive",
          title: "ข้อผิดพลาด",
          description: "ไม่พบข้อมูลโพย",
        });
        return;
      }

      // Sanitize filename - keep Thai characters and common chars, remove problematic ones
      const sanitizeFilename = (str: string) => {
        if (!str || str.trim() === "") return "ลูกค้า";
        // Remove characters that cause issues in filenames but keep Thai, English, numbers, spaces
        return str
          .replace(/[<>:"/\\|?*]/g, "") // Remove problematic filename characters
          .replace(/\s+/g, " ") // Normalize whitespace
          .trim();
      };

      const customerName = sanitizeFilename(slip.customerName);
      const filename = `โพย_${slip.slipNumber}_${customerName}.pdf`;
      
      const opt = {
        margin: [10, 10, 10, 10],
        filename: filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff"
        },
        jsPDF: { 
          unit: "mm", 
          format: "a4", 
          orientation: "portrait" 
        },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };

      // Show loading message
      const loadingMsg = document.createElement("div");
      loadingMsg.textContent = "กำลังสร้าง PDF...";
      loadingMsg.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:white;padding:20px;border-radius:8px;z-index:9999;";
      document.body.appendChild(loadingMsg);

      await html2pdf().set(opt).from(element).save();
      
      // Remove loading message
      document.body.removeChild(loadingMsg);
      
      toast({
        variant: "success",
        title: "สำเร็จ",
        description: "บันทึก PDF เรียบร้อยแล้ว",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      // Fallback to print if PDF generation fails
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถสร้าง PDF ได้ กรุณาใช้ปุ่มพิมพ์และเลือก \"Save as PDF\" แทน",
      });
    }
  };

  const handleDownloadImage = async () => {
    if (!slip) return;
    
    if (typeof window === "undefined") {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "ฟีเจอร์นี้ใช้ได้เฉพาะในเบราว์เซอร์เท่านั้น",
      });
      return;
    }

    try {
      const html2canvas = (await import("html2canvas")).default;
      
      const element = document.getElementById("slip-content");
      if (!element) {
        toast({
          variant: "destructive",
          title: "ข้อผิดพลาด",
          description: "ไม่พบข้อมูลโพย",
        });
        return;
      }

      // Show loading message
      const loadingMsg = document.createElement("div");
      loadingMsg.textContent = "กำลังสร้างรูปภาพ...";
      loadingMsg.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:white;padding:20px;border-radius:8px;z-index:9999;";
      document.body.appendChild(loadingMsg);

      // Scroll element into view to ensure it's fully rendered
      element.scrollIntoView({ behavior: "instant", block: "start" });
      
      // Wait for fonts to load before capturing
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      
      // Wait a bit for rendering to complete
      await new Promise(resolve => setTimeout(resolve, 200));

      // Temporarily hide no-print elements for better image capture
      const noPrintElements = document.querySelectorAll(".no-print");
      noPrintElements.forEach((el) => {
        (el as HTMLElement).style.display = "none";
      });

      // Store original styles
      const originalStyles = {
        position: element.style.position,
        left: element.style.left,
        top: element.style.top,
        transform: element.style.transform,
      };

      // Ensure element is in a stable position for capture
      const rect = element.getBoundingClientRect();
      element.style.position = "relative";
      element.style.left = "0";
      element.style.top = "0";
      element.style.transform = "none";

      // Capture element as canvas with high quality
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: false,
        removeContainer: false,
        imageTimeout: 15000,
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
        fontEmbedCSS: true, // Enable font embedding for better text rendering
        ignoreElements: (el) => {
          // Ignore no-print elements
          return el.classList.contains("no-print");
        },
        onclone: (clonedDoc, element) => {
          // Ensure all styles are preserved in clone
          const clonedElement = clonedDoc.getElementById("slip-content");
          if (clonedElement) {
            // Reset any transforms
            (clonedElement as HTMLElement).style.transform = "none";
            (clonedElement as HTMLElement).style.position = "relative";
            (clonedElement as HTMLElement).style.left = "0";
            (clonedElement as HTMLElement).style.top = "0";
            
            // Ensure font family is preserved
            const allElements = clonedElement.querySelectorAll("*");
            allElements.forEach((el) => {
              const htmlEl = el as HTMLElement;
              const computedStyle = window.getComputedStyle(el);
              htmlEl.style.fontFamily = computedStyle.fontFamily;
              htmlEl.style.fontSize = computedStyle.fontSize;
              htmlEl.style.fontWeight = computedStyle.fontWeight;
              htmlEl.style.fontStyle = computedStyle.fontStyle;
              
              // Preserve flex and justify-center for status badge alignment
              const display = computedStyle.display;
              const justifyContent = computedStyle.justifyContent;
              if (display === "flex" || justifyContent === "center") {
                htmlEl.style.display = display;
                htmlEl.style.justifyContent = justifyContent;
              }
            });
            
            // Ensure status badge container is centered
            const statusContainers = clonedElement.querySelectorAll(".border-b.border-gray-300");
            statusContainers.forEach((container) => {
              const htmlEl = container as HTMLElement;
              const parent = htmlEl.parentElement;
              if (parent && parent.textContent?.includes("สถานะ")) {
                htmlEl.style.display = "flex";
                htmlEl.style.justifyContent = "center";
                htmlEl.style.alignItems = "center";
              }
            });
            
            // Hide no-print elements in clone
            const clonedNoPrint = clonedElement.querySelectorAll(".no-print");
            clonedNoPrint.forEach((el) => {
              (el as HTMLElement).style.display = "none";
            });
            
            // Ensure body background is white
            const clonedBody = clonedDoc.body;
            if (clonedBody) {
              clonedBody.style.backgroundColor = "#ffffff";
              clonedBody.style.margin = "0";
              clonedBody.style.padding = "0";
              clonedBody.style.fontFamily = window.getComputedStyle(document.body).fontFamily;
            }
            
            // Ensure head has font links for Thai fonts
            const clonedHead = clonedDoc.head;
            if (clonedHead) {
              // Copy all style and link tags from original document
              const originalHead = document.head;
              originalHead.querySelectorAll("link[rel='stylesheet'], style").forEach((link) => {
                try {
                  clonedHead.appendChild(link.cloneNode(true));
                } catch (e) {
                  // Ignore cloning errors
                }
              });
            }
          }
        },
      });

      // Restore original styles
      element.style.position = originalStyles.position;
      element.style.left = originalStyles.left;
      element.style.top = originalStyles.top;
      element.style.transform = originalStyles.transform;

      // Restore no-print elements
      noPrintElements.forEach((el) => {
        (el as HTMLElement).style.display = "";
      });

      // Convert canvas to image
      const imageData = canvas.toDataURL("image/png", 1.0);
      
      // Create download link
      // Sanitize filename - keep Thai characters and common chars, remove problematic ones
      const sanitizeFilename = (str: string) => {
        if (!str || str.trim() === "") return "ลูกค้า";
        // Remove characters that cause issues in filenames but keep Thai, English, numbers, spaces
        return str
          .replace(/[<>:"/\\|?*]/g, "") // Remove problematic filename characters
          .replace(/\s+/g, " ") // Normalize whitespace
          .trim();
      };
      
      const customerName = sanitizeFilename(slip.customerName);
      const filename = `โพย_${slip.slipNumber}_${customerName}.png`;
      const link = document.createElement("a");
      link.download = filename;
      link.href = imageData;
      link.click();
      
      // Remove loading message
      document.body.removeChild(loadingMsg);
      
      toast({
        variant: "success",
        title: "สำเร็จ",
        description: "บันทึกรูปภาพเรียบร้อยแล้ว",
      });
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถสร้างรูปภาพได้",
      });
    }
  };

  const handleMarkPaid = () => {
    if (!slip) return;
    setShowMarkPaidDialog(true);
  };

  const confirmMarkPaid = () => {
    if (!slip) return;
    updateSlipStatus(slip.id, "จ่ายแล้ว");
    // Update local state
    setSlip({ ...slip, status: "จ่ายแล้ว" });
    setShowMarkPaidDialog(false);
    
    toast({
      variant: "success",
      title: "สำเร็จ",
      description: "ทำเครื่องหมายจ่ายแล้วเรียบร้อย",
    });
    
    // Navigate back after a short delay
    setTimeout(() => {
      router.push("/dashboard");
    }, 1000);
  };

  const handleGoBack = () => {
    router.push("/dashboard");
  };

  // Show loading while checking auth or loading slip
  if (!isAuthChecked || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">
            {!isAuthChecked ? "กำลังตรวจสอบสิทธิ์การเข้าถึง..." : "กำลังโหลด..."}
          </p>
        </div>
      </div>
    );
  }

  if (!slip) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <div>
                  <h2 className="text-2xl font-bold">ไม่พบโพย</h2>
                  <p className="text-muted-foreground mt-2">
                    ไม่พบข้อมูลโพยที่ต้องการ
                  </p>
                </div>
                <Button asChild>
                  <Link href="/dashboard">กลับไปแดชบอร์ด</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #slip-content,
          #slip-content * {
            visibility: visible;
          }
          #slip-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <div className="min-h-screen bg-background p-2 sm:p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6">
        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-2 mb-4 no-print">
          <Button variant="outline" onClick={handleDownloadImage} className="flex-1 sm:flex-initial min-w-[120px] h-10 sm:h-9 text-sm">
            <ImageIcon className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">บันทึกรูป</span>
            <span className="sm:hidden">รูป</span>
          </Button>
          <Button variant="outline" onClick={handlePrint} className="flex-1 sm:flex-initial min-w-[120px] h-10 sm:h-9 text-sm">
            <Printer className="mr-2 h-4 w-4" />
            พิมพ์
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF} className="flex-1 sm:flex-initial min-w-[120px] h-10 sm:h-9 text-sm">
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">บันทึก PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>
          <Button variant="outline" onClick={handleGoBack} className="flex-1 sm:flex-initial min-w-[120px] h-10 sm:h-9 text-sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">ย้อนกลับ</span>
            <span className="sm:hidden">กลับ</span>
          </Button>
          {slip.status === "ค้างจ่าย" && (
            <Button onClick={handleMarkPaid} className="flex-1 sm:flex-initial min-w-[120px] h-10 sm:h-9 text-sm">
              <CheckCircle className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">ทำเครื่องหมายจ่ายแล้ว</span>
              <span className="sm:hidden">จ่ายแล้ว</span>
            </Button>
          )}
        </div>

        {/* Main Content - Receipt Style */}
        <div id="slip-content" className="bg-white rounded-none shadow-lg p-4 sm:p-6 md:p-8 lg:p-10 max-w-2xl mx-auto border-2 border-gray-300" style={{ fontFamily: "'Noto Sans Thai', 'Sarabun', Arial, sans-serif" }}>
          {/* Receipt Header */}
          <div className="text-center mb-4 sm:mb-6 md:mb-8 pb-4 sm:pb-5 md:pb-6 border-b-2 border-dashed border-gray-400">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 tracking-tight">
              ใบเสร็จรับเงิน
            </h2>
            <p className="text-sm sm:text-base text-gray-600 uppercase tracking-wider">RECEIPT</p>
            <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-500">
              เลขที่โพย: <span className="font-bold text-gray-900">{slip.slipNumber}</span>
            </div>
          </div>

          {/* Receipt Info Section */}
          <div className="space-y-4 sm:space-y-6">
            {/* Customer & Receipt Info */}
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                <div>
                  <div className="text-gray-500 mb-1 text-xs sm:text-sm">ชื่อลูกค้า</div>
                  <div className="font-bold text-gray-900 text-sm sm:text-base border-b border-gray-300 pb-1 break-words">
                    {slip.customerName}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1 text-xs sm:text-sm">วันที่</div>
                  <div className="font-semibold text-gray-900 text-sm sm:text-base border-b border-gray-300 pb-1 break-words">
                    {formatDate(slip.createdAtISO)}
                  </div>
                </div>
                {draw && (
                  <div>
                    <div className="text-gray-500 mb-1 text-xs sm:text-sm">งวด</div>
                    <div className="font-semibold text-gray-900 text-sm sm:text-base border-b border-gray-300 pb-1 break-words">
                      {draw.label}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-gray-500 mb-1 text-xs sm:text-sm">สถานะ</div>
                  <div className="font-semibold text-gray-900 text-sm sm:text-base border-b border-gray-300 pb-1 break-words">
                    {slip.status}
                  </div>
                </div>
              </div>
            </div>

            {/* Receipt Items Table */}
            <div className="mt-4 sm:mt-6">
              <div className="border-t-2 border-b-2 border-gray-400 py-2 mb-2">
                <h3 className="font-bold text-base sm:text-lg text-center text-gray-900">รายการเลขหวย</h3>
              </div>
              
              {slip.items && slip.items.length > 0 ? (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full border-collapse min-w-[400px]">
                    <thead>
                      <tr className="border-b-2 border-gray-400">
                        <th className="text-left py-2 sm:py-3 px-2 text-xs sm:text-sm font-bold text-gray-700 w-10 sm:w-12">#</th>
                        <th className="text-left py-2 sm:py-3 px-2 text-xs sm:text-sm font-bold text-gray-700">ประเภท</th>
                        <th className="text-center py-2 sm:py-3 px-2 text-xs sm:text-sm font-bold text-gray-700">เลขที่</th>
                        <th className="text-right py-2 sm:py-3 px-2 text-xs sm:text-sm font-bold text-gray-700">จำนวนเงิน</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slip.items.map((item, index) => (
                        <tr key={item.id} className="border-b border-dashed border-gray-300">
                          <td className="py-2 sm:py-3 px-2 text-xs sm:text-sm text-gray-600">{index + 1}</td>
                          <td className="py-2 sm:py-3 px-2 text-xs sm:text-sm text-gray-700 break-words">{item.type}</td>
                          <td className="py-2 sm:py-3 px-2 text-center">
                            <span className="font-mono font-bold text-base sm:text-lg text-gray-900">{item.number}</span>
                          </td>
                          <td className="py-2 sm:py-3 px-2 text-right font-semibold text-xs sm:text-sm text-gray-900">
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 text-gray-500 border-b border-dashed border-gray-300">
                  <p className="text-xs sm:text-sm">ไม่มีรายละเอียดเลขหวย</p>
                </div>
              )}
            </div>

            {/* Receipt Summary */}
            <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
              <div className="flex justify-between items-center border-t-2 border-dashed border-gray-400 pt-2 sm:pt-3">
                <span className="text-xs sm:text-sm text-gray-600">จำนวนรายการ:</span>
                <span className="font-semibold text-xs sm:text-sm text-gray-900">
                  {slip.items ? slip.items.length : 0} รายการ
                </span>
              </div>
              
              <div className="flex justify-between items-center border-t-2 border-b-2 border-gray-400 py-3 sm:py-4 bg-gray-50 -mx-4 sm:-mx-4 px-4">
                <span className="text-base sm:text-lg font-bold text-gray-900">ยอดรวมทั้งสิ้น</span>
                <span className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatCurrency(slip.totalAmount)}
                </span>
              </div>

              {/* Payout/Loss Calculation */}
              {(slip.status === "ถูกรางวัล" || slip.status === "ไม่ถูกรางวัล" || slip.status === "จ่ายแล้ว") && (
                <div className="border-t-2 border-dashed border-gray-400 pt-3 sm:pt-4 space-y-2 sm:space-y-3">
                  {slip.status === "ถูกรางวัล" || slip.status === "จ่ายแล้ว" ? (
                    <div className="flex justify-between items-center bg-green-50 py-2 sm:py-3 px-3 sm:px-4 rounded-lg">
                      <span className="text-sm sm:text-base font-semibold text-green-700">ถูกรางวัลได้รับ:</span>
                      <span className="text-lg sm:text-xl font-bold text-green-700">
                        {formatCurrency(payoutAmount)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center bg-red-50 py-2 sm:py-3 px-3 sm:px-4 rounded-lg">
                      <span className="text-sm sm:text-base font-semibold text-red-700">ไม่ถูกรางวัลเสีย:</span>
                      <span className="text-lg sm:text-xl font-bold text-red-700">
                        {formatCurrency(lossAmount)}
                      </span>
                    </div>
                  )}
                  {slip.status === "ถูกรางวัล" || slip.status === "จ่ายแล้ว" ? (
                    <div className="flex justify-between items-center text-xs sm:text-sm text-gray-600">
                      <span>กำไรสุทธิ:</span>
                      <span className={`font-semibold ${payoutAmount - lossAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(payoutAmount - lossAmount)}
                      </span>
                    </div>
                  ) : null}
                </div>
              )}
              
              <div className="text-center text-xs text-gray-500 mt-3 sm:mt-4">
                <div className="mb-1 sm:mb-2">ยอดรวมเป็นตัวอักษร:</div>
                <div className="font-semibold text-gray-700 text-xs sm:text-sm">
                  {formatCurrency(slip.totalAmount)} เท่านั้น
                </div>
              </div>
            </div>

            {/* Receipt Footer */}
            <div className="mt-4 sm:mt-6 md:mt-8 pt-4 sm:pt-5 md:pt-6 border-t-2 border-dashed border-gray-400 text-center">
              <div className="text-xs text-gray-500 space-y-1">
                <p>ขอบคุณที่ใช้บริการ</p>
                <p className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-dashed border-gray-300">
                  ใบเสร็จรับเงินฉบับนี้เป็นหลักฐานการชำระเงิน
                </p>
                <p className="mt-1 sm:mt-2">
                  หากมีข้อสงสัยกรุณาติดต่อเจ้าหน้าที่
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mark Paid Confirmation Dialog */}
      <Dialog open={showMarkPaidDialog} onOpenChange={setShowMarkPaidDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการทำเครื่องหมาย</DialogTitle>
            <DialogDescription>
              ทำเครื่องหมายจ่ายแล้วเรียบร้อย ต้องการกลับไปแดชบอร์ดหรือไม่?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              if (!slip) return;
              updateSlipStatus(slip.id, "จ่ายแล้ว");
              setSlip({ ...slip, status: "จ่ายแล้ว" });
              setShowMarkPaidDialog(false);
              toast({
                variant: "success",
                title: "สำเร็จ",
                description: "ทำเครื่องหมายจ่ายแล้วเรียบร้อย",
              });
            }}>
              ไม่ออก
            </Button>
            <Button variant="default" onClick={confirmMarkPaid}>
              กลับไปแดชบอร์ด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
}
