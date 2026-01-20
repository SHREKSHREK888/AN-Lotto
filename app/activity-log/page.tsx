"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Trash2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/app-layout";
import { getActivityLogs, clearActivityLogs, ActivityLog } from "@/lib/activity-log";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ActivityLogPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showClearDialog, setShowClearDialog] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    } else {
      setIsAuthChecked(true);
      loadLogs();
    }
  }, [router]);

  const loadLogs = () => {
    const stored = getActivityLogs();
    setLogs(stored);
  };

  const handleClearLogs = () => {
    clearActivityLogs();
    loadLogs();
    setShowClearDialog(false);
    toast({
      variant: "success",
      title: "สำเร็จ",
      description: "ล้างประวัติการใช้งานเรียบร้อยแล้ว",
    });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes("ADD") || action.includes("CREATE")) return "success";
    if (action.includes("EDIT") || action.includes("UPDATE")) return "default";
    if (action.includes("DELETE") || action.includes("REMOVE")) return "destructive";
    if (action.includes("LOGIN")) return "default";
    return "outline";
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAuthChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">กำลังตรวจสอบสิทธิ์การเข้าถึง...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-red-700">ประวัติการใช้งาน</h1>
            <p className="text-slate-600 mt-1">บันทึกการกระทำทั้งหมดในระบบ</p>
          </div>
          <Button variant="destructive" onClick={() => setShowClearDialog(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            ล้างประวัติ
          </Button>
        </div>

        {/* Search */}
        <Card className="border border-slate-200 shadow-md bg-white/95">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="ค้นหาด้วย Username, Action หรือ Description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Activity Logs Table */}
        <Card className="border border-slate-200 shadow-md bg-white/95">
          <CardHeader>
            <CardTitle className="text-red-700">รายการประวัติการใช้งาน</CardTitle>
            <CardDescription>
              ทั้งหมด {logs.length} รายการ ({filteredLogs.length} รายการที่แสดง)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>ไม่พบประวัติการใช้งาน</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>เวลา</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>การกระทำ</TableHead>
                      <TableHead>รายละเอียด</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm text-slate-600">
                          {formatDate(log.timestamp)}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{log.username || "Unknown"}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <div className="text-sm">{log.description}</div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Clear Logs Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการล้างประวัติ</DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการล้างประวัติการใช้งานทั้งหมด?
              <br />
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={handleClearLogs}>
              ล้างประวัติ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
