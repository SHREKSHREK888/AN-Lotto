"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, User, Mail, Search, Copy, Check, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/app-layout";
import { logActivity } from "@/lib/activity-log";
import { Switch } from "@/components/ui/switch";

export interface Member {
  id: string;
  username: string;
  name: string;
  email?: string;
  password: string; // Hashed password
  role: "admin" | "user";
  status: "active" | "inactive";
  permissions?: {
    canViewSlips?: boolean;
    canCreateSlips?: boolean;
    canEditSlips?: boolean;
    canDeleteSlips?: boolean;
    canManageAgents?: boolean;
    canManageMembers?: boolean;
    canViewReports?: boolean;
    canManageSettings?: boolean;
  };
  createdAt: string;
}

const MEMBERS_KEY = "lotto_members";

function getMembers(): Member[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(MEMBERS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveMember(member: Member): void {
  const existingMembers = getMembers();
  const index = existingMembers.findIndex((m) => m.id === member.id);
  if (index >= 0) {
    existingMembers[index] = member;
  } else {
    existingMembers.push(member);
  }
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(existingMembers));
}

function deleteMember(memberId: string): void {
  const existingMembers = getMembers();
  const filtered = existingMembers.filter((m) => m.id !== memberId);
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(filtered));
}

export default function MembersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [newCredentials, setNewCredentials] = useState<{ username: string; password: string } | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedMemberForPassword, setSelectedMemberForPassword] = useState<Member | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  // Form states
  const [formData, setFormData] = useState<Omit<Member, "id" | "createdAt" | "password">>({
    username: "",
    name: "",
    email: "",
    role: "user",
    status: "active",
    permissions: {
      canViewSlips: true,
      canCreateSlips: false,
      canEditSlips: false,
      canDeleteSlips: false,
      canManageAgents: false,
      canManageMembers: false,
      canViewReports: false,
      canManageSettings: false,
    },
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    } else {
      setIsAuthChecked(true);
      loadMembers();
    }
  }, [router]);

  const loadMembers = () => {
    const stored = getMembers();
    setMembers(stored);
  };

  // Generate random password
  const generatePassword = (length: number = 8): string => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const handleAdd = () => {
    setFormData({
      username: "",
      name: "",
      email: "",
      role: "user",
      status: "active",
      permissions: {
        canViewSlips: true,
        canCreateSlips: false,
        canEditSlips: false,
        canDeleteSlips: false,
        canManageAgents: false,
        canManageMembers: false,
        canViewReports: false,
        canManageSettings: false,
      },
    });
    setSelectedMember(null);
    setShowAddDialog(true);
  };

  const handleEdit = (member: Member) => {
    setFormData({
      username: member.username,
      name: member.name,
      email: member.email || "",
      role: member.role,
      status: member.status,
      permissions: member.permissions || {
        canViewSlips: true,
        canCreateSlips: false,
        canEditSlips: false,
        canDeleteSlips: false,
        canManageAgents: false,
        canManageMembers: false,
        canViewReports: false,
        canManageSettings: false,
      },
    });
    setSelectedMember(member);
    setShowEditDialog(true);
  };

  const handleDelete = (member: Member) => {
    setSelectedMember(member);
    setShowDeleteDialog(true);
  };

  const handleSave = () => {
    if (!formData.username.trim()) {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "กรุณากรอก Username",
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "กรุณากรอกชื่อ",
      });
      return;
    }

    // Check if username already exists (for new members)
    if (!selectedMember) {
      const existingMembers = getMembers();
      if (existingMembers.some(m => m.username === formData.username.trim())) {
        toast({
          variant: "destructive",
          title: "ข้อผิดพลาด",
          description: "Username นี้ถูกใช้งานแล้ว",
        });
        return;
      }
    } else {
      // Check if username already exists (for edit, but not the same member)
      const existingMembers = getMembers();
      if (existingMembers.some(m => m.username === formData.username.trim() && m.id !== selectedMember.id)) {
        toast({
          variant: "destructive",
          title: "ข้อผิดพลาด",
          description: "Username นี้ถูกใช้งานแล้ว",
        });
        return;
      }
    }

    if (selectedMember) {
      // Edit existing
      const updatedMember: Member = {
        ...selectedMember,
        ...formData,
      };
      saveMember(updatedMember);
      logActivity(
        "EDIT_MEMBER",
        `แก้ไขสมาชิก: ${updatedMember.name} (${updatedMember.username})`,
        { memberId: updatedMember.id, changes: formData }
      );
      toast({
        variant: "success",
        title: "สำเร็จ",
        description: "แก้ไขสมาชิกเรียบร้อยแล้ว",
      });
      setShowEditDialog(false);
    } else {
      // Add new - generate password
      const generatedPassword = generatePassword(10);
      const newMember: Member = {
        id: `m${Date.now()}`,
        ...formData,
        password: generatedPassword, // In production, this should be hashed
        createdAt: new Date().toISOString(),
      };
      saveMember(newMember);

      // Show credentials dialog
      setNewCredentials({
        username: newMember.username,
        password: generatedPassword,
      });
      setShowAddDialog(false);
      setShowCredentialsDialog(true);

      logActivity(
        "ADD_MEMBER",
        `เพิ่มสมาชิกใหม่: ${newMember.name} (${newMember.username})`,
        { memberId: newMember.id }
      );
    }

    loadMembers();
    setFormData({
      username: "",
      name: "",
      email: "",
      role: "user",
      status: "active",
      permissions: {
        canViewSlips: true,
        canCreateSlips: false,
        canEditSlips: false,
        canDeleteSlips: false,
        canManageAgents: false,
        canManageMembers: false,
        canViewReports: false,
        canManageSettings: false,
      },
    });
    setSelectedMember(null);
  };

  const handleCopyCredentials = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      variant: "success",
      title: "คัดลอกแล้ว",
      description: "คัดลอกไปยังคลิปบอร์ดแล้ว",
    });
  };

  const handleConfirmDelete = () => {
    if (selectedMember) {
      deleteMember(selectedMember.id);
      logActivity(
        "DELETE_MEMBER",
        `ลบสมาชิก: ${selectedMember.name} (${selectedMember.username})`,
        { memberId: selectedMember.id }
      );
      toast({
        variant: "success",
        title: "สำเร็จ",
        description: "ลบสมาชิกเรียบร้อยแล้ว",
      });
      setShowDeleteDialog(false);
      setSelectedMember(null);
      loadMembers();
    }
  };

  const handleToggleStatus = (member: Member) => {
    const newStatus = member.status === "active" ? "inactive" : "active";
    const updatedMember: Member = {
      ...member,
      status: newStatus,
    };
    saveMember(updatedMember);
    logActivity(
      "CHANGE_MEMBER_STATUS",
      `เปลี่ยนสถานะสมาชิก: ${member.name} (${member.username}) เป็น ${newStatus === "active" ? "ใช้งาน" : "ไม่ใช้งาน"}`,
      { memberId: member.id, status: newStatus }
    );
    toast({
      variant: "success",
      title: "สำเร็จ",
      description: `เปลี่ยนสถานะเป็น "${newStatus === "active" ? "ใช้งาน" : "ไม่ใช้งาน"}" เรียบร้อยแล้ว`,
    });
    loadMembers();
  };

  const handleChangePassword = (member: Member) => {
    setSelectedMemberForPassword(member);
    setNewPassword("");
    setConfirmPassword("");
    setShowChangePasswordDialog(true);
  };

  const handleSavePassword = () => {
    if (!selectedMemberForPassword) return;

    if (!newPassword.trim()) {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "กรุณากรอกรหัสผ่านใหม่",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "ข้อผิดพลาด",
        description: "รหัสผ่านไม่ตรงกัน",
      });
      return;
    }

    const updatedMember: Member = {
      ...selectedMemberForPassword,
      password: newPassword, // In production, this should be hashed
    };
    saveMember(updatedMember);
    logActivity(
      "CHANGE_MEMBER_PASSWORD",
      `เปลี่ยนรหัสผ่านสมาชิก: ${selectedMemberForPassword.name} (${selectedMemberForPassword.username})`,
      { memberId: selectedMemberForPassword.id }
    );
    toast({
      variant: "success",
      title: "สำเร็จ",
      description: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว",
    });
    setShowChangePasswordDialog(false);
    setSelectedMemberForPassword(null);
    setNewPassword("");
    setConfirmPassword("");
    loadMembers();
  };

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.email && member.email.toLowerCase().includes(searchQuery.toLowerCase()))
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
            <h1 className="text-3xl font-bold tracking-tight text-primary">จัดการสมาชิก</h1>
            <p className="text-muted-foreground mt-1">เพิ่ม แก้ไข และลบสมาชิกในระบบ</p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มสมาชิก
          </Button>
        </div>

        {/* Search */}
        <Card className="glass-card border-none">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="ค้นหาด้วย Username, ชื่อ หรืออีเมล..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Members Table */}
        <Card className="glass-card border-none">
          <CardHeader>
            <CardTitle className="text-foreground">รายการสมาชิก</CardTitle>
            <CardDescription className="text-muted-foreground">
              ทั้งหมด {members.length} คน ({filteredMembers.length} คนที่แสดง)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredMembers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <User className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>ไม่พบสมาชิก</p>
                <p className="text-sm mt-1">
                  {searchQuery ? "ลองค้นหาด้วยคำอื่น" : "เริ่มต้นโดยการเพิ่มสมาชิก"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>ชื่อ</TableHead>
                      <TableHead>อีเมล</TableHead>
                      <TableHead>บทบาท</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead className="text-right">การดำเนินการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-mono text-sm">{member.username}</TableCell>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>
                          {member.email ? (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-slate-400" />
                              {member.email}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                            {member.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้ใช้ทั่วไป"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={member.status === "active"}
                              onCheckedChange={() => handleToggleStatus(member)}
                            />
                            <Badge variant={member.status === "active" ? "success" : "outline"}>
                              {member.status === "active" ? "ใช้งาน" : "ไม่ใช้งาน"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleChangePassword(member)}
                              title="เปลี่ยนรหัสผ่าน"
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(member)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(member)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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

      {/* Add Member Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เพิ่มสมาชิก</DialogTitle>
            <DialogDescription>กรอกข้อมูลสมาชิกใหม่</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="กรอก Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">ชื่อ</Label>
              <Input
                id="name"
                placeholder="กรอกชื่อ"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">อีเมล (ไม่บังคับ)</Label>
              <Input
                id="email"
                type="email"
                placeholder="กรอกอีเมล"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">บทบาท</Label>
              <select
                id="role"
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value as "admin" | "user" })
                }
              >
                <option value="user">ผู้ใช้ทั่วไป</option>
                <option value="admin">ผู้ดูแลระบบ</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">สถานะ</Label>
              <select
                id="status"
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as "active" | "inactive" })
                }
              >
                <option value="active">ใช้งาน</option>
                <option value="inactive">ไม่ใช้งาน</option>
              </select>
            </div>

            {/* Permissions Section - Only for user role */}
            {formData.role === "user" && (
              <div className="space-y-3 pt-4 border-t">
                <Label className="text-base font-semibold">สิทธิ์การใช้งาน</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="add-perm-view-slips"
                      checked={formData.permissions?.canViewSlips || false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            canViewSlips: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-slate-300"
                    />
                    <Label htmlFor="add-perm-view-slips" className="text-sm font-normal cursor-pointer">
                      ดูโพย
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="add-perm-create-slips"
                      checked={formData.permissions?.canCreateSlips || false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            canCreateSlips: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-slate-300"
                    />
                    <Label htmlFor="add-perm-create-slips" className="text-sm font-normal cursor-pointer">
                      สร้างโพย
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="add-perm-edit-slips"
                      checked={formData.permissions?.canEditSlips || false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            canEditSlips: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-slate-300"
                    />
                    <Label htmlFor="add-perm-edit-slips" className="text-sm font-normal cursor-pointer">
                      แก้ไขโพย
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="add-perm-delete-slips"
                      checked={formData.permissions?.canDeleteSlips || false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            canDeleteSlips: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-slate-300"
                    />
                    <Label htmlFor="add-perm-delete-slips" className="text-sm font-normal cursor-pointer">
                      ลบโพย
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="add-perm-manage-agents"
                      checked={formData.permissions?.canManageAgents || false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            canManageAgents: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-slate-300"
                    />
                    <Label htmlFor="add-perm-manage-agents" className="text-sm font-normal cursor-pointer">
                      จัดการเจ้ามือ
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="add-perm-view-reports"
                      checked={formData.permissions?.canViewReports || false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            canViewReports: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-slate-300"
                    />
                    <Label htmlFor="add-perm-view-reports" className="text-sm font-normal cursor-pointer">
                      ดูรายงาน
                    </Label>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave}>เพิ่มสมาชิก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขสมาชิก</DialogTitle>
            <DialogDescription>แก้ไขข้อมูลสมาชิก</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                placeholder="กรอก Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={selectedMember?.role === "admin"} // Cannot change admin username
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">ชื่อ</Label>
              <Input
                id="edit-name"
                placeholder="กรอกชื่อ"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">อีเมล (ไม่บังคับ)</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="กรอกอีเมล"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">บทบาท</Label>
              <select
                id="edit-role"
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value as "admin" | "user" })
                }
              >
                <option value="user">ผู้ใช้ทั่วไป</option>
                <option value="admin">ผู้ดูแลระบบ</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">สถานะ</Label>
              <select
                id="edit-status"
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as "active" | "inactive" })
                }
              >
                <option value="active">ใช้งาน</option>
                <option value="inactive">ไม่ใช้งาน</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ</DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบสมาชิก &ldquo;{selectedMember?.name}&rdquo;?
              <br />
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              ลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog */}
      <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ข้อมูลเข้าสู่ระบบ</DialogTitle>
            <DialogDescription>
              กรุณาบันทึกข้อมูลนี้ไว้ ระบบจะไม่แสดงอีกครั้ง
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={newCredentials?.username || ""}
                  readOnly
                  className="font-mono bg-slate-50"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopyCredentials(newCredentials?.username || "")}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>รหัสผ่าน</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={newCredentials?.password || ""}
                  readOnly
                  className="font-mono bg-slate-50"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopyCredentials(newCredentials?.password || "")}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              ⚠️ กรุณาบันทึกข้อมูลนี้ไว้ ระบบจะไม่แสดงอีกครั้ง
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowCredentialsDialog(false)}>ปิด</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>เปลี่ยนรหัสผ่าน</DialogTitle>
            <DialogDescription>
              เปลี่ยนรหัสผ่านสำหรับ: {selectedMemberForPassword?.name} ({selectedMemberForPassword?.username})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>รหัสผ่านใหม่</Label>
              <Input
                type="password"
                placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>ยืนยันรหัสผ่านใหม่</Label>
              <Input
                type="password"
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSavePassword();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowChangePasswordDialog(false);
              setSelectedMemberForPassword(null);
              setNewPassword("");
              setConfirmPassword("");
            }}>
              ยกเลิก
            </Button>
            <Button onClick={handleSavePassword}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
