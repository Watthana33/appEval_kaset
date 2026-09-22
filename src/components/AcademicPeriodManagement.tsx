import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  Check, 
  Radio, 
  Sparkles,
  ShieldCheck,
  Clock,
  Users,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { 
  getAcademicPeriods, 
  addAcademicPeriod, 
  updateAcademicPeriod,
  deleteAcademicPeriod, 
  setActiveAcademicPeriod 
} from '../services/dataService';
import { AcademicPeriod } from '../types/index';

export const AcademicPeriodManagement: React.FC = () => {
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Form State for Adding New Period
  const [newYear, setNewYear] = useState<string>('2568');
  const [newTerm, setNewTerm] = useState<string>('2');
  const [newTotalStudents, setNewTotalStudents] = useState<number>(1848);
  const [setAsActive, setSetAsActive] = useState<boolean>(false);

  // Inline Editing State for Student Count
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
  const [editCountVal, setEditCountVal] = useState<number>(1848);

  // Notification Toast
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const loadPeriods = async () => {
    setLoading(true);
    try {
      const data = await getAcademicPeriods();
      setPeriods(data);
    } catch (err) {
      console.error('Failed to load academic periods:', err);
      showNotification('เกิดข้อผิดพลาดในการโหลดข้อมูลปีการศึกษา', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeriods();
  }, []);

  const activePeriod = periods.find((p) => p.is_active);

  const handleAddPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYear.trim() || !newTerm.trim()) {
      showNotification('กรุณาระบุปีการศึกษาและภาคเรียนให้ครบถ้วน', 'error');
      return;
    }

    // ตรวจสอบว่ามีปีการศึกษาและภาคเรียนนี้อยู่แล้วหรือไม่
    const duplicate = periods.find(
      (p) => p.academic_year === newYear.trim() && p.term === newTerm.trim()
    );
    if (duplicate) {
      showNotification(`ปีการศึกษา ${newYear.trim()} ภาคเรียนที่ ${newTerm.trim()} มีอยู่ในระบบแล้ว`, 'error');
      return;
    }

    setActionLoading(true);
    try {
      await addAcademicPeriod({
        academic_year: newYear.trim(),
        term: newTerm.trim(),
        is_active: setAsActive,
        total_students: Number(newTotalStudents) || 1848,
      });

      await loadPeriods();
      showNotification(`เพิ่มปีการศึกษา ${newYear.trim()} ภาคเรียนที่ ${newTerm.trim()} เรียบร้อยแล้ว`);
      setSetAsActive(false);
    } catch (err) {
      console.error('Failed to add period:', err);
      showNotification('ไม่สามารถเพิ่มปีการศึกษาได้ กรุณาลองใหม่', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStudentCount = async (id: string, count: number) => {
    if (count <= 0) {
      showNotification('จำนวนนักเรียนต้องมากกว่า 0 คน', 'error');
      return;
    }

    setActionLoading(true);
    try {
      await updateAcademicPeriod(id, { total_students: count });
      await loadPeriods();
      setEditingPeriodId(null);
      showNotification('อัปเดตจำนวนผู้เรียนทั้งหมดเรียบร้อยแล้ว');
    } catch (err) {
      console.error('Failed to update student count:', err);
      showNotification('เกิดข้อผิดพลาดในการอัปเดตจำนวนผู้เรียน', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetActive = async (id: string, year: string, term: string) => {
    setActionLoading(true);
    try {
      await setActiveAcademicPeriod(id);
      await loadPeriods();
      showNotification(`เปลี่ยนรอบการประเมินเป็น ปีการศึกษา ${year} ภาคเรียนที่ ${term} เรียบร้อยแล้ว`);
    } catch (err) {
      console.error('Failed to set active period:', err);
      showNotification('เกิดข้อผิดพลาดในการตั้งค่ารอบการประเมิน', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePeriod = async (id: string, year: string, term: string, isActive: boolean) => {
    if (isActive) {
      alert('ไม่สามารถลบรอบการประเมินที่กำลังเปิดใช้งานอยู่ในปัจจุบันได้ กรุณาเปลี่ยนรอบการประเมินเป็นรอบอื่นก่อนลบ');
      return;
    }

    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ ปีการศึกษา ${year} ภาคเรียนที่ ${term}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      await deleteAcademicPeriod(id);
      await loadPeriods();
      showNotification(`ลบปีการศึกษา ${year} ภาคเรียนที่ ${term} เรียบร้อยแล้ว`);
    } catch (err) {
      console.error('Failed to delete period:', err);
      showNotification('เกิดข้อผิดพลาดในการลบข้อมูล', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn transition-colors">
      
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-bold animate-slideDown ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/90 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
              <Calendar className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Academic Period & Target Enrollment
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            จัดการปีการศึกษา ภาคเรียน และยอดผู้เรียนทั้งหมด
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            กำหนดรอบที่เปิดให้นักเรียนประเมิน ณ ปัจจุบัน และปรับยอดจำนวนนักเรียนตามฐานทะเบียนของแต่ละภาคเรียน
          </p>
        </div>

        <button
          onClick={loadPeriods}
          disabled={loading || actionLoading}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>

      {/* 2. การ์ดแสดงรอบที่กำลังเปิดใช้งานอยู่ในปัจจุบัน (Active Period Highlight) */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-emerald-700 text-white rounded-2xl p-6 sm:p-7 shadow-lg shadow-blue-700/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 transform translate-x-10 -translate-y-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold text-white border border-white/30">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>รอบการประเมินที่กำลังเปิดใช้งานในระบบ (ACTIVE)</span>
            </div>

            <div className="flex items-baseline gap-3 pt-1">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                ปีการศึกษา {activePeriod?.academic_year || '2568'}
              </h2>
              <span className="text-xl sm:text-2xl font-bold text-blue-100">
                ภาคเรียนที่ {activePeriod?.term || '2'}
              </span>
            </div>

            <div className="flex items-center gap-3 pt-1 text-sm font-semibold text-blue-100">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/20 border border-white/30">
                <Users className="w-4 h-4" />
                <span>ยอดผู้เรียนตามทะเบียน: <strong>{(activePeriod?.total_students || 1848).toLocaleString()}</strong> คน</span>
              </span>
            </div>

            <p className="text-xs text-blue-100/90 leading-relaxed max-w-2xl pt-1">
              ข้อมูลนี้จะถูกนำไปแสดงในส่วนหัวของแดชบอร์ด และใช้คำนวณอัตราการมีส่วนร่วมของนักเรียนในรอบนี้โดยอัตโนมัติ
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 text-center shrink-0 min-w-[220px]">
            <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block mb-1">
              สถานะรอบประเมิน
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 text-white font-black text-sm shadow-md">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>เปิดรับการประเมิน</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 3. ฟอร์มเพิ่มปีการศึกษาและภาคเรียนใหม่ (Form Add Period) */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors sticky top-24">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                เพิ่มรอบปีการศึกษาใหม่
              </h3>
            </div>

            <form onSubmit={handleAddPeriod} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  ปีการศึกษา (พ.ศ.) *
                </label>
                <input
                  type="text"
                  required
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  placeholder="เช่น 2568 หรือ 2569"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  ภาคเรียน (Semester) *
                </label>
                <select
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm"
                >
                  <option value="1">ภาคเรียนที่ 1</option>
                  <option value="2">ภาคเรียนที่ 2</option>
                  <option value="ฤดูร้อน">ภาคเรียนฤดูร้อน (Summer)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  จำนวนผู้เรียนทั้งหมดตามทะเบียน (คน) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newTotalStudents}
                  onChange={(e) => setNewTotalStudents(Number(e.target.value))}
                  placeholder="เช่น 1848"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  ใช้คำนวณอัตราการเข้าร่วมประเมินในแดชบอร์ด
                </p>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={setAsActive}
                    onChange={(e) => setSetAsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    ตั้งเป็นรอบที่เปิดให้ประเมินทันที (Set as Active)
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full mt-3 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-700/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{actionLoading ? 'กำลังบันทึก...' : 'เพิ่มรอบปีการศึกษา'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* 4. ตารางรายการปีการศึกษาทั้งหมด (All Periods Table) */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
            
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  รายการปีการศึกษาและภาคเรียนทั้งหมด ({periods.length} รอบ)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ท่านสามารถกดปุ่ม "เปิดใช้งานรอบนี้" หรือแก้ไขยอดจำนวนผู้เรียนทั้งหมดในแต่ละปี/เทอมได้ทันที
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">ปีการศึกษา</th>
                    <th className="py-3.5 px-4">ภาคเรียน</th>
                    <th className="py-3.5 px-4">ยอดผู้เรียนตามทะเบียน</th>
                    <th className="py-3.5 px-4 text-center">สถานะ</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium">
                  {periods.map((item) => {
                    const isActive = item.is_active;
                    const isEditing = editingPeriodId === item.id;
                    const studentCount = item.total_students || 1848;

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isActive
                            ? 'bg-blue-50/50 dark:bg-blue-950/20'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        {/* ปีการศึกษา */}
                        <td className="py-4 px-4 sm:px-6 font-extrabold text-slate-900 dark:text-white">
                          <span className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <span>พ.ศ. {item.academic_year}</span>
                          </span>
                        </td>

                        {/* ภาคเรียน */}
                        <td className="py-4 px-4 font-bold text-slate-700 dark:text-slate-200">
                          ภาคเรียนที่ {item.term}
                        </td>

                        {/* ยอดผู้เรียนทั้งหมด (สามารถกดแก้ไขได้) */}
                        <td className="py-4 px-4 font-bold">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="1"
                                value={editCountVal}
                                onChange={(e) => setEditCountVal(Number(e.target.value))}
                                className="w-24 px-2 py-1 text-xs border border-blue-400 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateStudentCount(item.id, editCountVal)}
                                disabled={actionLoading}
                                className="p-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                                title="บันทึกจำนวน"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingPeriodId(null)}
                                className="p-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300"
                                title="ยกเลิก"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-slate-900 dark:text-white font-bold">
                                {studentCount.toLocaleString()}
                              </span>
                              <span className="text-xs text-slate-400">คน</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPeriodId(item.id);
                                  setEditCountVal(studentCount);
                                }}
                                className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                                title="แก้ไขยอดผู้เรียนรอบนี้"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* สถานะ Active / Inactive */}
                        <td className="py-4 px-4 text-center">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800 shadow-sm">
                              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                              <span>เปิดรับการประเมิน</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              <span>ปิดรอบแล้ว</span>
                            </span>
                          )}
                        </td>

                        {/* ปุ่มการจัดการ */}
                        <td className="py-4 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isActive ? (
                              <span className="text-xs font-bold text-blue-700 dark:text-blue-400 px-3 py-1.5">
                                กำลังใช้งานอยู่
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSetActive(item.id, item.academic_year, item.term)}
                                disabled={actionLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-bold border border-slate-200 dark:border-slate-700 hover:border-blue-300 transition-all active:scale-95"
                                title="ตั้งรอบนี้เป็นรอบที่เปิดให้ประเมินผล"
                              >
                                <Radio className="w-3.5 h-3.5 text-blue-600" />
                                <span>เปิดใช้งานรอบนี้</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleDeletePeriod(item.id, item.academic_year, item.term, isActive)}
                              disabled={actionLoading || isActive}
                              className={`p-2 rounded-xl border transition-all ${
                                isActive
                                  ? 'opacity-30 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400'
                                  : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-slate-200 dark:border-slate-700 hover:border-rose-300'
                              }`}
                              title={isActive ? 'ไม่สามารถลบรอบที่กำลังเปิดใช้งานอยู่ได้' : 'ลบรอบนี้'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        </div>

      </div>

    </main>
  );
};
