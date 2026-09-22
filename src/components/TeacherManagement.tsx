import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Copy, 
  Check, 
  QrCode, 
  Download, 
  Trash2, 
  X, 
  ExternalLink,
  Sprout,
  Edit3,
  Upload,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  getTeachers, 
  addTeacher, 
  updateTeacher, 
  deleteTeacher, 
  getDepartments,
  formatGoogleDriveUrl 
} from '../services/dataService';
import { Teacher, Department } from '../types/index';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80';

export const TeacherManagement: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // New Teacher Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newSubject, setNewSubject] = useState<string>('');
  const [newDepartment, setNewDepartment] = useState<string>('แผนกวิชาพืชศาสตร์');
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Edit Teacher Modal
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editSubject, setEditSubject] = useState<string>('');
  const [editDepartment, setEditDepartment] = useState<string>('แผนกวิชาพืชศาสตร์');
  const [editImageUrl, setEditImageUrl] = useState<string>('');

  // File Input Refs
  const addFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // QR Code Modal
  const [activeQrTeacher, setActiveQrTeacher] = useState<Teacher | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // เชื่อมโยงฐานข้อมูลเชิงสัมพันธ์: ดึงรายชื่อแผนกวิชาจริงจากฐานข้อมูล
  const departmentsList = useMemo(() => {
    if (departments.length > 0) {
      return departments.map((d) => d.name);
    }
    return [
      'แผนกวิชาพืชศาสตร์',
      'แผนกวิชาสัตวศาสตร์',
      'แผนกวิชาช่างกลเกษตร',
      'แผนกวิชาอุตสาหกรรมเกษตร',
      'แผนกวิชาประมง',
      'แผนกวิชาเทคโนโลยีสารสนเทศ',
      'แผนกวิชาการบัญชีและการจัดการ',
      'แผนกวิชาสามัญสัมพันธ์',
    ];
  }, [departments]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [teachersData, deptsData] = await Promise.all([
        getTeachers(),
        getDepartments(),
      ]);
      setTeachers(teachersData);
      setDepartments(deptsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ฟังก์ชันช่วยบีบอัดรูปภาพจากเครื่องผู้ใช้ เพื่อให้โหลดเร็วและไม่เปลืองพื้นที่
  const handlePhotoUpload = (file: File, callback: (url: string) => void) => {
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, WebP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        callback(base64);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // ค้นหาอาจารย์ตามชื่อ แผนก หรือรหัส
  const filteredTeachers = useMemo(() => {
    if (!searchQuery.trim()) return teachers;
    const q = searchQuery.toLowerCase();
    return teachers.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.subject && t.subject.toLowerCase().includes(q)) ||
        (t.department && t.department.toLowerCase().includes(q)) ||
        t.id.toLowerCase().includes(q)
    );
  }, [teachers, searchQuery]);

  // เพิ่มอาจารย์ใหม่
  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert('กรุณากรอกชื่อ-นามสกุลอาจารย์');
      return;
    }

    setSubmitting(true);
    try {
      const finalImg = formatGoogleDriveUrl(newImageUrl.trim()) || DEFAULT_AVATAR;

      const added = await addTeacher({
        name: newName.trim(),
        subject: newSubject.trim() || '',
        department: newDepartment.trim() || 'แผนกวิชาพืชศาสตร์',
        image_url: finalImg,
      });

      setTeachers((prev) => [...prev, added]);
      setIsAddModalOpen(false);
      setNewName('');
      setNewSubject('');
      setNewDepartment('แผนกวิชาพืชศาสตร์');
      setNewImageUrl('');
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถเพิ่มครูได้');
    } finally {
      setSubmitting(false);
    }
  };

  // เปิด Modal แก้ไขข้อมูลอาจารย์
  const handleOpenEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setEditName(teacher.name);
    setEditSubject(teacher.subject || '');
    setEditDepartment(teacher.department || 'แผนกวิชาพืชศาสตร์');
    setEditImageUrl(teacher.image_url || '');
  };

  // บันทึกการแก้ไขข้อมูลอาจารย์
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    if (!editName.trim()) {
      alert('กรุณากรอกชื่อ-นามสกุลอาจารย์');
      return;
    }

    setSubmitting(true);
    try {
      const finalImg = formatGoogleDriveUrl(editImageUrl.trim()) || DEFAULT_AVATAR;

      const updated = await updateTeacher(editingTeacher.id, {
        name: editName.trim(),
        subject: editSubject.trim() || '',
        department: editDepartment.trim() || 'แผนกวิชาพืชศาสตร์',
        image_url: finalImg,
      });

      if (updated) {
        setTeachers((prev) => prev.map((t) => (t.id === editingTeacher.id ? updated : t)));
        setEditingTeacher(null);
      }
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถอัปเดตข้อมูลครูได้');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeacher = async (id: string, name: string) => {
    if (!window.confirm(`ยืนยันการลบข้อมูลของ: "${name}" ?`)) return;

    try {
      await deleteTeacher(id);
      setTeachers((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถลบข้อมูลครูได้');
    }
  };

  const getDirectLink = (teacherId: string) => {
    const origin = window.location.origin;
    return `${origin}/evaluate?teacher_id=${teacherId}`;
  };

  const handleCopyLink = (teacherId: string) => {
    const link = getDirectLink(teacherId);
    navigator.clipboard.writeText(link);
    setCopiedId(teacherId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ส่งออกรายชื่อครูและลิงก์ประเมินเป็นไฟล์ Excel (.xlsx)
  const handleExportExcel = () => {
    if (teachers.length === 0) {
      alert('ไม่มีข้อมูลอาจารย์สำหรับการส่งออก');
      return;
    }

    const data = teachers.map((t, index) => ({
      ลำดับ: index + 1,
      รหัสอาจารย์: t.id,
      ชื่ออาจารย์: t.name,
      แผนกวิชา: t.department || '-',
      วิชาที่สอน: t.subject || '-',
      ลิงก์ประเมิน: getDirectLink(t.id),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'รายชื่อครูและลิงก์');

    worksheet['!cols'] = [
      { wch: 8 },
      { wch: 12 },
      { wch: 30 },
      { wch: 25 },
      { wch: 30 },
      { wch: 50 },
    ];

    const fileName = `รายชื่อและลิงก์ประเมินครู_วษท_มหาสารคาม_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn transition-colors">
      
      {/* 1. Header Section */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <Sprout className="w-4 h-4" />
            <span>Maha Sarakham College of Agriculture and Technology</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            จัดการข้อมูลอาจารย์ผู้สอน
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            จัดการรายชื่ออาจารย์ (150+ ท่าน) สร้างลิงก์ตรงและ QR Code สำหรับแจกให้นักศึกษาประเมิน
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all active:scale-95 shadow-emerald-700/20"
            title="ดาวน์โหลดรายชื่อและลิงก์ของครูทุกคนเป็นไฟล์ Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all active:scale-95 shadow-blue-700/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ เพิ่มอาจารย์</span>
          </button>
        </div>
      </section>

      {/* 2. Search & Overview */}
      <section className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่ออาจารย์, แผนกวิชา หรือ ID..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>แสดงอาจารย์ทั้งหมด: <strong className="text-slate-900 dark:text-white font-bold">{filteredTeachers.length}</strong> ท่าน</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
            >
              ล้างการค้นหา
            </button>
          )}
        </div>
      </section>

      {/* 3. Teachers Table */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                <th className="py-3 px-4 w-12">#</th>
                <th className="py-3 px-4">อาจารย์ผู้สอน</th>
                <th className="py-3 px-4">แผนกวิชา</th>
                <th className="py-3 px-4">วิชาที่สอน</th>
                <th className="py-3 px-4 min-w-[280px]">ลิงก์ประเมินตรง (ส่งให้นักเรียน)</th>
                <th className="py-3 px-4 text-center w-36">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                    กำลังโหลดข้อมูลอาจารย์...
                  </td>
                </tr>
              ) : filteredTeachers.length > 0 ? (
                filteredTeachers.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={t.image_url}
                          alt={t.name}
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_AVATAR;
                          }}
                          className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{t.name}</p>
                          <p className="text-[10px] font-mono text-slate-400">ID: {t.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium">
                        {t.department || 'แผนกวิชาทั่วไป'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {t.subject ? (
                        <span>{t.subject}</span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">- (ไม่ระบุวิชา)</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 max-w-sm">
                        <input
                          type="text"
                          readOnly
                          value={getDirectLink(t.id)}
                          className="w-full px-2.5 py-1 text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 truncate font-mono select-all"
                        />
                        <button
                          onClick={() => handleCopyLink(t.id)}
                          className="shrink-0 p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 transition-colors"
                          title="คัดลอกลิงก์ส่ง LINE"
                        >
                          {copiedId === t.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* ปุ่มแก้ไขข้อมูล & เปลี่ยนรูป */}
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                          title="แก้ไขข้อมูล / เปลี่ยนรูปภาพ"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* ปุ่มเปิด QR Code */}
                        <button
                          onClick={() => setActiveQrTeacher(t)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                          title="เปิด QR Code"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>

                        {/* ปุ่มเปิดดูหน้าประเมิน */}
                        <a
                          href={getDirectLink(t.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 transition-colors"
                          title="ทดสอบเปิดหน้าประเมิน"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        {/* ปุ่มลบ */}
                        <button
                          onClick={() => handleDeleteTeacher(t.id, t.name)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="ลบข้อมูลอาจารย์"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    ไม่พบข้อมูลอาจารย์ที่ตรงกับคำค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. Modal เพิ่มอาจารย์ใหม่ */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-scaleUp max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors"
              title="ปิด"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
              <Sprout className="w-4 h-4" />
              <span>วิทยาลัยเกษตรและเทคโนโลยีมหาสารคาม</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">เพิ่มข้อมูลอาจารย์ผู้สอน</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              ระบุข้อมูลเพื่อสร้างลิงก์ตรงและ QR Code สำหรับให้นักศึกษาประเมิน
            </p>

            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">ชื่อ-นามสกุลอาจารย์ *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="เช่น อ.ดาริณี ปัณกันสกุล"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">แผนกวิชา *</label>
                <select
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-slate-900 dark:text-white font-medium"
                >
                  {departmentsList.map((dep) => (
                    <option key={dep} value={dep}>{dep}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    วิชาที่สอน
                  </label>
                  <span className="text-[10px] text-slate-400 font-normal">
                    (ไม่บังคับ / เว้นว่างได้)
                  </span>
                </div>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="เว้นว่างได้ หรือระบุ เช่น การผลิตพืชผักปลอดภัย"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                />
              </div>

              {/* รูปถ่ายอาจารย์: อัปโหลดจากเครื่อง หรือ วางลิงก์ Google Drive */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  รูปถ่ายอาจารย์ (Photo)
                </label>

                {/* ตัวอย่างรูปภาพ (Live Preview) */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <img
                    src={formatGoogleDriveUrl(newImageUrl) || DEFAULT_AVATAR}
                    alt="ตัวอย่างรูปภาพ"
                    onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shrink-0 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {newImageUrl ? 'รูปภาพที่เลือก' : 'รูปเริ่มต้น (Default)'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {newImageUrl.startsWith('data:') 
                        ? 'อัปโหลดจากอุปกรณ์โดยตรง (ขนาดกะทัดรัด)' 
                        : newImageUrl.includes('google.com') 
                        ? 'แปลงจาก Google Drive อัตโนมัติ' 
                        : 'สามารถอัปโหลดไฟล์ตรง หรือวางลิงก์ได้'}
                    </p>
                    {newImageUrl && (
                      <button
                        type="button"
                        onClick={() => setNewImageUrl('')}
                        className="text-[10px] text-rose-500 hover:underline font-semibold mt-0.5"
                      >
                        ล้างรูป ใช้รูปเริ่มต้น
                      </button>
                    )}
                  </div>
                </div>

                {/* ปุ่มอัปโหลดไฟล์ตรงจากเครื่อง */}
                <div>
                  <input
                    type="file"
                    ref={addFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(file, (url) => setNewImageUrl(url));
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => addFileInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-xl border border-dashed border-emerald-500/60 hover:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>เลือกไฟล์รูปภาพจากคอมพิวเตอร์ / มือถือ (แนะนำ)</span>
                  </button>
                </div>

                {/* หรือวางลิงก์ Google Drive */}
                <div>
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="หรือวางลิงก์รูปภาพ (รองรับ Google Drive ลิงก์ตรง)"
                    className="w-full px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    💡 <strong>Google Drive:</strong> ตั้งค่าสิทธิ์ไฟล์เป็น <em>"ทุกคนที่มีลิงก์มีสิทธิ์ดู"</em> แล้ววางลิงก์ได้เลย ระบบจะแปลงให้ทันที
                  </p>
                </div>
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลครู'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. Modal แก้ไขข้อมูลอาจารย์ & เปลี่ยนรูปภาพ */}
      {/* ======================================================== */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-scaleUp max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingTeacher(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors"
              title="ปิด"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
              <Edit3 className="w-4 h-4" />
              <span>แก้ไขข้อมูล & รูปถ่ายอาจารย์</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              แก้ไข: {editingTeacher.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              แก้ไขชื่อ แผนกวิชา หรืออัปโหลดรูปถ่ายใหม่ได้ทันที
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">ชื่อ-นามสกุลอาจารย์ *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">แผนกวิชา *</label>
                <select
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 dark:text-white font-medium"
                >
                  {departmentsList.map((dep) => (
                    <option key={dep} value={dep}>{dep}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    วิชาที่สอน
                  </label>
                  <span className="text-[10px] text-slate-400 font-normal">
                    (ไม่บังคับ / เว้นว่างได้)
                  </span>
                </div>
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  placeholder="เว้นว่างได้ หรือระบุ เช่น การผลิตพืชผักปลอดภัย"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                />
              </div>

              {/* รูปถ่ายอาจารย์: อัปโหลดจากเครื่อง หรือ วางลิงก์ Google Drive */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  รูปถ่ายอาจารย์ (Photo)
                </label>

                {/* ตัวอย่างรูปภาพ (Live Preview) */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <img
                    src={formatGoogleDriveUrl(editImageUrl) || DEFAULT_AVATAR}
                    alt="ตัวอย่างรูปภาพ"
                    onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shrink-0 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {editImageUrl ? 'รูปภาพปัจจุบัน' : 'รูปเริ่มต้น (Default)'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {editImageUrl.startsWith('data:') 
                        ? 'อัปโหลดจากอุปกรณ์โดยตรง' 
                        : editImageUrl.includes('google.com') 
                        ? 'แปลงจาก Google Drive อัตโนมัติ' 
                        : 'สามารถอัปโหลดไฟล์ตรง หรือวางลิงก์ได้'}
                    </p>
                    {editImageUrl && (
                      <button
                        type="button"
                        onClick={() => setEditImageUrl('')}
                        className="text-[10px] text-rose-500 hover:underline font-semibold mt-0.5"
                      >
                        ล้างรูป ใช้รูปเริ่มต้น
                      </button>
                    )}
                  </div>
                </div>

                {/* ปุ่มอัปโหลดไฟล์ตรงจากเครื่อง */}
                <div>
                  <input
                    type="file"
                    ref={editFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(file, (url) => setEditImageUrl(url));
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-xl border border-dashed border-blue-500/60 hover:border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>เลือกไฟล์รูปภาพจากคอมพิวเตอร์ / มือถือ (แนะนำ)</span>
                  </button>
                </div>

                {/* หรือวางลิงก์ Google Drive */}
                <div>
                  <input
                    type="text"
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    placeholder="หรือวางลิงก์รูปภาพ (รองรับ Google Drive ลิงก์ตรง)"
                    className="w-full px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    💡 <strong>Google Drive:</strong> ตั้งค่าสิทธิ์ไฟล์เป็น <em>"ทุกคนที่มีลิงก์มีสิทธิ์ดู"</em> แล้ววางลิงก์ได้เลย ระบบจะแปลงให้ทันที
                  </p>
                </div>
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all shadow-blue-700/20"
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. Modal QR Code */}
      {/* ======================================================== */}
      {activeQrTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-6 text-center shadow-2xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveQrTeacher(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <img
              src={activeQrTeacher.image_url}
              alt={activeQrTeacher.name}
              onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
              className="w-16 h-16 rounded-xl object-cover mx-auto mb-2 border border-slate-200 dark:border-slate-700 shadow-sm bg-slate-100"
            />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{activeQrTeacher.name}</h3>
            {activeQrTeacher.subject && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-0.5">{activeQrTeacher.subject}</p>
            )}
            <p className="text-[11px] text-slate-400 mb-3">{activeQrTeacher.department}</p>

            <div className="bg-slate-50 dark:bg-white p-3 rounded-xl inline-block border border-slate-200 mb-3">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  getDirectLink(activeQrTeacher.id)
                )}`}
                alt="QR Code"
                className="w-44 h-44 mx-auto"
              />
            </div>

            <div className="flex gap-2 justify-center">
              <button
                onClick={() => handleCopyLink(activeQrTeacher.id)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
              >
                {copiedId === activeQrTeacher.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === activeQrTeacher.id ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}</span>
              </button>

              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
                  getDirectLink(activeQrTeacher.id)
                )}`}
                download={`QR_${activeQrTeacher.name}.png`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดาวน์โหลด QR</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};
