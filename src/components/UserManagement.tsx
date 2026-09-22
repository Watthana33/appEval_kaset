import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Shield, 
  User, 
  Lock, 
  X, 
  Sprout, 
  Eye, 
  EyeOff, 
  Crown, 
  Edit3, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ShieldCheck,
  Check
} from 'lucide-react';
import { 
  getAdminUsers, 
  addAdminUser, 
  updateAdminUser, 
  deleteAdminUser, 
  isPasswordHashed,
  upgradeLegacyPasswordsToHash 
} from '../services/dataService';
import { AdminUser, UserRole } from '../types/index';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [upgrading, setUpgrading] = useState<boolean>(false);

  // Toast Notification
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };
  
  // ==========================================
  // Add User Form State
  // ==========================================
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<UserRole>('director');
  const [showAddPassword, setShowAddPassword] = useState<boolean>(false);

  // ==========================================
  // Edit User / Change Password State
  // ==========================================
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editRole, setEditRole] = useState<UserRole>('director');
  const [editNewPassword, setEditNewPassword] = useState<string>('');
  const [editConfirmPassword, setEditConfirmPassword] = useState<string>('');
  const [showEditPassword, setShowEditPassword] = useState<boolean>(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      showNotification('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้งาน', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // เปิด Modal แก้ไขข้อมูล
  const handleOpenEdit = (user: AdminUser) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditNewPassword('');
    setEditConfirmPassword('');
    setShowEditPassword(false);
  };

  // บันทึกการเพิ่มผู้ใช้ใหม่
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !name.trim()) {
      showNotification('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showNotification('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน', 'error');
      return;
    }

    // ตรวจสอบ username ซ้ำ
    const duplicate = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (duplicate) {
      showNotification(`ชื่อผู้ใช้ (Username) "${username.trim()}" มีอยู่ในระบบแล้ว`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const added = await addAdminUser({
        username: username.trim(),
        password: password.trim(),
        name: name.trim(),
        role: role,
      });

      setUsers((prev) => [...prev, added]);
      setIsAddModalOpen(false);
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setName('');
      setRole('director');
      showNotification(`สร้างบัญชี "${added.username}" พร้อมเข้ารหัสผ่าน SHA-256 สำเร็จแล้ว`);
    } catch (err) {
      console.error(err);
      showNotification('ไม่สามารถเพิ่มผู้ใช้งานได้', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // บันทึกการแก้ไขข้อมูลและเปลี่ยนรหัสผ่าน
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editName.trim()) {
      showNotification('กรุณาระบุชื่อ-นามสกุล / ตำแหน่ง', 'error');
      return;
    }

    if (editNewPassword.trim() && editNewPassword !== editConfirmPassword) {
      showNotification('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const updates: Partial<AdminUser> = {
        name: editName.trim(),
        role: editingUser.username === 'admin' ? 'superadmin' : editRole,
      };

      if (editNewPassword.trim()) {
        updates.password = editNewPassword.trim();
      }

      const updated = await updateAdminUser(editingUser.id, updates);
      if (updated) {
        setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? updated : u)));

        // หากผู้ใช้แก้ไขบัญชีตัวเองที่กำลังล็อกอินอยู่ ให้อัปเดต Session ในเครื่องด้วย
        const storedAdmin = localStorage.getItem('eval_current_admin') || sessionStorage.getItem('eval_current_admin');
        if (storedAdmin) {
          try {
            const parsed = JSON.parse(storedAdmin);
            if (parsed.id === editingUser.id || parsed.username === editingUser.username) {
              const newSession = { ...parsed, name: updated.name, role: updated.role };
              if (localStorage.getItem('eval_current_admin')) {
                localStorage.setItem('eval_current_admin', JSON.stringify(newSession));
              }
              if (sessionStorage.getItem('eval_current_admin')) {
                sessionStorage.setItem('eval_current_admin', JSON.stringify(newSession));
              }
            }
          } catch (e) {
            console.error('Session sync error:', e);
          }
        }

        setEditingUser(null);
        showNotification(
          editNewPassword.trim() 
            ? `อัปเดตข้อมูลและเปลี่ยนรหัสผ่านใหม่ (SHA-256) ของ "${editingUser.username}" เรียบร้อยแล้ว` 
            : `อัปเดตข้อมูลบัญชี "${editingUser.username}" เรียบร้อยแล้ว`
        );
      }
    } catch (err) {
      console.error(err);
      showNotification('เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้งาน', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ลบผู้ใช้งาน
  const handleDeleteUser = async (id: string, uname: string) => {
    if (uname === 'admin') {
      showNotification('ไม่สามารถลบบัญชีผู้ดูแลระบบหลัก (admin) ได้', 'error');
      return;
    }

    if (!window.confirm(`ยืนยันการลบบัญชีผู้ใช้: "${uname}" หรือไม่?`)) return;

    try {
      await deleteAdminUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      showNotification(`ลบบัญชี "${uname}" ออกจากระบบแล้ว`);
    } catch (err) {
      console.error(err);
      showNotification('ไม่สามารถลบผู้ใช้งานได้', 'error');
    }
  };

  // อัปเกรดรหัสผ่านเก่าที่เป็น Plain Text ให้กลายเป็น SHA-256 ทั้งหมด
  const handleUpgradeAllPasswords = async () => {
    if (!window.confirm('ต้องการยกระดับความปลอดภัยรหัสผ่านบัญชีเดิมทั้งหมดให้เข้ารหัส SHA-256 หรือไม่?')) return;
    
    setUpgrading(true);
    try {
      const count = await upgradeLegacyPasswordsToHash();
      await loadUsers();
      if (count > 0) {
        showNotification(`ยกระดับความปลอดภัยและเข้ารหัส SHA-256 สำเร็จ ${count} บัญชี`, 'success');
      } else {
        showNotification('ทุกบัญชีในระบบได้รับการเข้ารหัสความปลอดภัย SHA-256 ครบถ้วนแล้ว', 'info');
      }
    } catch (err) {
      console.error(err);
      showNotification('เกิดข้อผิดพลาดในการยกระดับรหัสผ่าน', 'error');
    } finally {
      setUpgrading(false);
    }
  };

  // นับจำนวนบัญชีที่ยังไม่ได้เข้ารหัส
  const unhashedCount = users.filter((u) => u.password && !isPasswordHashed(u.password)).length;

  return (
    <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn transition-colors">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-5 z-50 animate-slideDown">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold backdrop-blur-md ${
            notification.type === 'error'
              ? 'bg-rose-50/95 dark:bg-rose-950/90 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
              : notification.type === 'info'
              ? 'bg-blue-50/95 dark:bg-blue-950/90 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
              : 'bg-emerald-50/95 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
          }`}>
            {notification.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            ) : notification.type === 'info' ? (
              <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <Sprout className="w-4 h-4" />
            <span>Access Control & Security Management</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            จัดการบัญชีผู้ใช้งานระบบและสิทธิ์การเข้าถึง
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            กำหนดสิทธิ์การใช้งาน แก้ไขข้อมูล และเปลี่ยนรหัสผ่านด้วยระบบความปลอดภัยมาตรฐานสากล (SHA-256 Cryptographic Hash)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {unhashedCount > 0 && (
            <button
              onClick={handleUpgradeAllPasswords}
              disabled={upgrading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-sm transition-all active:scale-95 disabled:opacity-50"
              title="เข้ารหัสรหัสผ่านเก่าทั้งหมดด้วย SHA-256 ทันที"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${upgrading ? 'animate-spin' : ''}`} />
              <span>ยกระดับรหัสผ่านเดิม ({unhashedCount})</span>
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all active:scale-95 shadow-emerald-700/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ เพิ่มผู้ใช้งานใหม่</span>
          </button>
        </div>
      </section>

      {/* สรุปสิทธิ์และความปลอดภัย (Role & Security Info Box) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* กล่องสิทธิ์ผู้บริหาร */}
        <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-4 rounded-xl flex items-start gap-3">
          <Eye className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-900 dark:text-amber-300">สิทธิ์ผู้บริหาร (Director)</p>
            <p className="text-[11px] text-amber-800 dark:text-amber-400 mt-0.5 leading-relaxed">
              เข้าดูเฉพาะ <strong>Dashboard สรุปสถิติ กราฟ และส่งออก Excel</strong> โดยระบบจะซ่อนเมนูจัดการครู, แบบประเมิน และผู้ใช้งานโดยอัตโนมัติ
            </p>
          </div>
        </div>

        {/* กล่องสิทธิ์แอดมิน */}
        <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 p-4 rounded-xl flex items-start gap-3">
          <Crown className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-emerald-950 dark:text-emerald-300">สิทธิ์ผู้ดูแลระบบ (Admin สูงสุด)</p>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-400 mt-0.5 leading-relaxed">
              เข้าถึงได้ทุกส่วน: <strong>จัดการครู 150 ท่าน, ปีการศึกษา, แบบประเมิน, จัดการบัญชีผู้ใช้, และผลประเมินทั้งหมด</strong>
            </p>
          </div>
        </div>

        {/* กล่องมาตรฐานความปลอดภัยรหัสผ่าน */}
        <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 p-4 rounded-xl flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-blue-950 dark:text-blue-300">ความปลอดภัยรหัสผ่าน (SHA-256)</p>
            <p className="text-[11px] text-blue-800 dark:text-blue-400 mt-0.5 leading-relaxed">
              รหัสผ่านใหม่และการเปลี่ยนรหัสผ่านจะถูก <strong>เข้ารหัสลับแบบทางเดียว (One-way Hash)</strong> ผ่าน Web Crypto API มาตรฐานสากล
            </p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            รายชื่อบัญชีผู้ใช้งานในระบบ ({users.length} บัญชี)
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {unhashedCount === 0 ? '🔒 เข้ารหัสครบทุกบัญชี' : `⚠️ ยังมี ${unhashedCount} บัญชีรหัสเดิม`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                <th className="py-3 px-4">ชื่อ-นามสกุล / ตำแหน่ง</th>
                <th className="py-3 px-4">ชื่อผู้ใช้ (Username)</th>
                <th className="py-3 px-4">บทบาท (Role)</th>
                <th className="py-3 px-4">ความปลอดภัยรหัสผ่าน</th>
                <th className="py-3 px-4">ระดับการเข้าถึง</th>
                <th className="py-3 px-4 text-center w-28">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                    กำลังโหลดข้อมูลผู้ใช้งาน...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    ไม่พบบัญชีผู้ใช้งานในระบบ
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isDir = u.role === 'director';
                  const isHashed = isPasswordHashed(u.password);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 dark:text-white block">{u.name}</span>
                        {u.username === 'admin' && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            ★ บัญชีผู้ดูแลระบบหลัก
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-600 dark:text-slate-300">
                        {u.username}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          isDir
                            ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        }`}>
                          {isDir ? <Eye className="w-3 h-3" /> : <Crown className="w-3 h-3" />}
                          <span>{isDir ? 'ผู้บริหาร (Director)' : 'แอดมิน (Admin)'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {isHashed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <ShieldCheck className="w-3 h-3" />
                            <span>เข้ารหัส SHA-256</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <AlertTriangle className="w-3 h-3" />
                            <span>ข้อความเดิม (แนะนำเปลี่ยน)</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">
                        {isDir ? 'ดู Dashboard อย่างเดียว' : 'จัดการระบบได้ทั้งหมด'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* ปุ่มแก้ไข / เปลี่ยนรหัสผ่าน */}
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                            title="แก้ไขข้อมูล / เปลี่ยนรหัสผ่าน"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* ปุ่มลบ */}
                          {u.username !== 'admin' ? (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="ลบผู้ใช้"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic px-1">บัญชีหลัก</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ======================================================== */}
      {/* Modal 1: แก้ไขข้อมูลและเปลี่ยนรหัสผ่าน (Edit & Change Password) */}
      {/* ======================================================== */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-scaleUp">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors"
              title="ปิด"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
              <KeyRound className="w-4 h-4" />
              <span>แก้ไขข้อมูล & เปลี่ยนรหัสผ่าน</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              แก้ไขบัญชี: <span className="font-mono text-blue-600 dark:text-blue-400">{editingUser.username}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              ปรับปรุงชื่อ ตำแหน่ง สิทธิ์การเข้าถึง หรือกำหนดรหัสผ่านใหม่ (ระบบจะเข้ารหัส SHA-256 อัตโนมัติ)
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* ชื่อ-นามสกุล / ตำแหน่ง */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อ-นามสกุล / ตำแหน่ง *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="เช่น ผอ.สมเกียรติ หรือ รองฝ่ายวิชาการ"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                />
              </div>

              {/* บทบาทและสิทธิ์ */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  บทบาทและสิทธิ์การใช้งาน (Role) *
                </label>
                <select
                  value={editingUser.username === 'admin' ? 'superadmin' : editRole}
                  disabled={editingUser.username === 'admin'}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 dark:text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="director">ผู้บริหาร (ดูเฉพาะแดชบอร์ดสรุปผลอย่างเดียว)</option>
                  <option value="superadmin">ผู้ดูแลระบบ (Admin สิทธิสูงสุด จัดการได้ทั้งหมด)</option>
                </select>
                {editingUser.username === 'admin' && (
                  <p className="text-[10px] text-slate-400 mt-1 italic">
                    * บัญชีผู้ดูแลระบบหลัก (admin) ต้องเป็นสิทธิ์ Superadmin เสมอเพื่อความปลอดภัย
                  </p>
                )}
              </div>

              {/* หมวดเปลี่ยนรหัสผ่าน (Password Section) */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>เปลี่ยนรหัสผ่านใหม่</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    (หากไม่ต้องการเปลี่ยน ให้เว้นว่างไว้)
                  </span>
                </div>

                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editNewPassword}
                    onChange={(e) => setEditNewPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 4 ตัวอักษร)"
                    className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    title={showEditPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {editNewPassword.trim() && (
                  <div className="space-y-1">
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      value={editConfirmPassword}
                      onChange={(e) => setEditConfirmPassword(e.target.value)}
                      placeholder="ยืนยันรหัสผ่านใหม่อีกครั้ง *"
                      className={`w-full px-3.5 py-2 rounded-xl border text-xs outline-none text-slate-900 dark:text-white dark:bg-slate-800 ${
                        editConfirmPassword && editNewPassword !== editConfirmPassword
                          ? 'border-rose-400 focus:ring-2 focus:ring-rose-500'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500'
                      }`}
                    />
                    {editConfirmPassword && editNewPassword !== editConfirmPassword && (
                      <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                        ⚠️ รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน
                      </p>
                    )}
                    {editConfirmPassword && editNewPassword === editConfirmPassword && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> รหัสผ่านตรงกันแล้ว พร้อมบันทึกด้วย SHA-256
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting || (!!editNewPassword.trim() && editNewPassword !== editConfirmPassword)}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-blue-700/20"
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Modal 2: เพิ่มบัญชีผู้ใช้งานใหม่ (Add User Modal) */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-scaleUp">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors"
              title="ปิด"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
              <Sprout className="w-4 h-4" />
              <span>วิทยาลัยเกษตรและเทคโนโลยีมหาสารคาม</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">เพิ่มบัญชีผู้ใช้งานใหม่</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              สร้าง Username และ Password สำหรับเข้าสู่ระบบ (รหัสผ่านจะถูกเข้ารหัส SHA-256 อัตโนมัติ)
            </p>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อ-นามสกุล / ตำแหน่ง *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น ผอ.สมเกียรติ หรือ รองผอ.ฝ่ายวิชาการ"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อผู้ใช้งาน (Username) *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="เช่น director_mcat หรือ staff_it"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  รหัสผ่าน (Password) *
                </label>
                <div className="relative">
                  <input
                    type={showAddPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="กำหนดรหัสผ่าน"
                    className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    title={showAddPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ยืนยันรหัสผ่าน (Confirm Password) *
                </label>
                <input
                  type={showAddPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านซ้ำอีกครั้ง"
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs outline-none text-slate-900 dark:text-white dark:bg-slate-800 ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-500'
                      : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500'
                  }`}
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
                    ⚠️ รหัสผ่านไม่ตรงกัน
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  บทบาทและสิทธิ์การใช้งาน (Role) *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-slate-900 dark:text-white font-medium"
                >
                  <option value="director">ผู้บริหาร (ดูเฉพาะแดชบอร์ดสรุปผลอย่างเดียว)</option>
                  <option value="superadmin">ผู้ดูแลระบบ (Admin สิทธิสูงสุด จัดการได้ทั้งหมด)</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting || password !== confirmPassword}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-emerald-700/20"
                >
                  {submitting ? 'กำลังบันทึก...' : 'สร้างบัญชีผู้ใช้'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
};
