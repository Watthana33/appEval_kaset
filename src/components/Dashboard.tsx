import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import * as XLSX from 'xlsx';
import { 
  Download, 
  Filter, 
  Users, 
  Star, 
  MessageSquare, 
  RefreshCw, 
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  Building2,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  GraduationCap,
  Award,
  BookOpen,
  Heart,
  HelpCircle,
  Eye,
  SlidersHorizontal,
  Table as TableIcon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { 
  getEvaluationResponses, 
  getTeachers, 
  getSurveyQuestions,
  getAcademicPeriods,
  getDepartments,
  getSurveyCategories,
  getQuestionDimension,
  getMajors,
  DimensionKey
} from '../services/dataService';
import { SurveyResponse, Teacher, SurveyQuestion, AcademicPeriod, Department, SurveyCategory, Major } from '../types/index';

export const Dashboard: React.FC = () => {
  const { isDark } = useTheme();
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<SurveyCategory[]>([]);
  const [systemMajors, setSystemMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Filters State
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedTerm, setSelectedTerm] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('all');
  const [searchTable, setSearchTable] = useState<string>('');

  // View Controls
  // tableMode: 'feedback' (ตารางข้อคิดเห็น 3.3 และ 3.4 ตาม Looker Studio) หรือ 'full' (ตารางข้อมูลเต็ม)
  const [tableMode, setTableMode] = useState<'feedback' | 'full'>('feedback');

  // Pagination State (แบ่งหน้าแสดงผลตารางผลการประเมิน)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // รีเซ็ตหน้ากลับไปหน้าที่ 1 เมื่อตัวกรอง คำค้นหา หรือขนาดหน้าเปลี่ยน
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, selectedTerm, selectedDepartment, selectedTeacherId, searchTable, pageSize, tableMode]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resData, teachData, quesData, periodData, deptsData, catsData, majorsData] = await Promise.all([
        getEvaluationResponses(),
        getTeachers(),
        getSurveyQuestions(),
        getAcademicPeriods(),
        getDepartments(),
        getSurveyCategories(),
        getMajors(),
      ]);
      setResponses(resData);
      setTeachers(teachData);
      setQuestions(quesData);
      setPeriods(periodData);
      setDepartments(deptsData);
      setCategories(catsData);
      setSystemMajors(majorsData);
      setLastUpdated(new Date().toLocaleTimeString('th-TH'));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activePeriod = useMemo(() => {
    return periods.find((p) => p.is_active);
  }, [periods]);

  // ค้นหารอบการประเมินที่ตรงกับตัวกรองปีและเทอม เพื่อดึงยอดจำนวนผู้เรียนทั้งหมดตามทะเบียน (total_students)
  const currentPeriod = useMemo(() => {
    if (selectedYear !== 'all' && selectedTerm !== 'all') {
      const match = periods.find((p) => p.academic_year === selectedYear && p.term === selectedTerm);
      if (match) return match;
    }
    if (selectedYear !== 'all') {
      const match = periods.find((p) => p.academic_year === selectedYear);
      if (match) return match;
    }
    return activePeriod || periods[0] || null;
  }, [periods, selectedYear, selectedTerm, activePeriod]);

  // ยอดผู้เรียนตามทะเบียน (ดึงจากฐานข้อมูลรอบปีการศึกษา ถ้าไม่มีให้ใช้ค่าเริ่มต้น 1848)
  const targetEnrollment = useMemo(() => {
    return currentPeriod?.total_students || 1848;
  }, [currentPeriod]);

  // เชื่อมโยงฐานข้อมูลเชิงสัมพันธ์: รายชื่อแผนกวิชา
  const availableDepartments = useMemo(() => {
    const deptNamesFromDb = departments.map((d) => d.name);
    const deptNamesFromTeachers = teachers.map((t) => t.department).filter(Boolean) as string[];
    const deptNamesFromResponses = responses.map((r) => r.department).filter(Boolean) as string[];
    const allUnique = Array.from(new Set([...deptNamesFromDb, ...deptNamesFromTeachers, ...deptNamesFromResponses]));
    return allUnique.sort();
  }, [departments, teachers, responses]);

  const availableYears = useMemo(() => {
    const years = new Set([
      ...periods.map((p) => p.academic_year),
      ...responses.map((r) => r.academic_year)
    ]);
    if (years.size === 0) years.add('2568');
    return Array.from(years).sort().reverse();
  }, [periods, responses]);

  const availableTerms = useMemo(() => {
    const terms = new Set([
      ...periods.map((p) => p.term),
      ...responses.map((r) => r.term)
    ]);
    if (terms.size === 0) {
      terms.add('1');
      terms.add('2');
    }
    return Array.from(terms).sort();
  }, [periods, responses]);

  // กรองผลการประเมินตาม Filters
  const filteredResponses = useMemo(() => {
    return responses.filter((r) => {
      const matchYear = selectedYear === 'all' || r.academic_year === selectedYear;
      const matchTerm = selectedTerm === 'all' || r.term === selectedTerm;
      const matchDepartment = selectedDepartment === 'all' || r.department === selectedDepartment;
      const matchTeacher = selectedTeacherId === 'all' || r.teacher_id === selectedTeacherId;
      return matchYear && matchTerm && matchDepartment && matchTeacher;
    });
  }, [responses, selectedYear, selectedTerm, selectedDepartment, selectedTeacherId]);

  // แผนที่จับคู่คำถามกับ 3 มิติหลัก (ด้านผู้สอน, ด้านกิจกรรม, ด้านความพึงพอใจ)
  const questionDimensionMap = useMemo(() => {
    const map = new Map<string, DimensionKey>();
    questions.forEach((q) => {
      map.set(q.id, getQuestionDimension(q.category));
    });
    return map;
  }, [questions]);

  // คำนวณสถิติภาพรวม และ คะแนนเฉลี่ย 3 มิติหลัก
  const stats = useMemo(() => {
    const totalCount = filteredResponses.length;
    const maleCount = filteredResponses.filter((r) => r.gender === 'ชาย' || r.gender === 'male').length;
    const femaleCount = filteredResponses.filter((r) => r.gender === 'หญิง' || r.gender === 'female').length;
    const otherCount = filteredResponses.filter(
      (r) => r.gender === 'ไม่ระบุเพศ' || (!['ชาย', 'male', 'หญิง', 'female'].includes(r.gender || ''))
    ).length;

    if (totalCount === 0) {
      return {
        totalCount: 0,
        maleCount: 0,
        femaleCount: 0,
        otherCount: 0,
        overallAvg: 0,
        dimTeacherAvg: 0,
        dimActivityAvg: 0,
        dimSatisfactionAvg: 0,
        feedbackCount: 0,
        excellentRate: 0,
        participationRate: 0,
      };
    }

    let sumTeacher = 0;
    let countTeacher = 0;
    let sumActivity = 0;
    let countActivity = 0;
    let sumSatisfaction = 0;
    let countSatisfaction = 0;

    filteredResponses.forEach((res) => {
      if (res.scores) {
        Object.entries(res.scores).forEach(([qid, score]) => {
          const dim = questionDimensionMap.get(qid) || 'ด้านผู้สอน';
          if (dim === 'ด้านผู้สอน') {
            sumTeacher += score;
            countTeacher += 1;
          } else if (dim === 'ด้านกิจกรรม') {
            sumActivity += score;
            countActivity += 1;
          } else if (dim === 'ด้านความพึงพอใจ') {
            sumSatisfaction += score;
            countSatisfaction += 1;
          }
        });
      }
    });

    const dimTeacherAvg = countTeacher > 0 ? sumTeacher / countTeacher : 0;
    const dimActivityAvg = countActivity > 0 ? sumActivity / countActivity : 0;
    const dimSatisfactionAvg = countSatisfaction > 0 ? sumSatisfaction / countSatisfaction : 0;

    const totalAvg = filteredResponses.reduce((sum, r) => sum + (r.average_score || 0), 0) / totalCount;
    const feedbackCount = filteredResponses.filter(
      (r) => (r.suggestion && r.suggestion.trim() !== '') || (r.impression && r.impression.trim() !== '') || (r.feedback && r.feedback.trim() !== '')
    ).length;
    const excellentCount = filteredResponses.filter((r) => (r.average_score || 0) >= 4.5).length;
    const excellentRate = Math.round((excellentCount / totalCount) * 100);
    const participationRate = parseFloat(((totalCount / targetEnrollment) * 100).toFixed(1));

    return {
      totalCount,
      maleCount,
      femaleCount,
      otherCount,
      overallAvg: parseFloat(totalAvg.toFixed(2)),
      dimTeacherAvg: parseFloat(dimTeacherAvg.toFixed(2)),
      dimActivityAvg: parseFloat(dimActivityAvg.toFixed(2)),
      dimSatisfactionAvg: parseFloat(dimSatisfactionAvg.toFixed(2)),
      feedbackCount,
      excellentRate,
      participationRate,
    };
  }, [filteredResponses, questionDimensionMap, targetEnrollment]);

  // ดึงรายการด้านการประเมินแบบ Dynamic (เรียงตาม order_no ในฐานข้อมูล หรือลำดับในคำถาม)
  const dynamicCategories = useMemo(() => {
    // รวบรวมหมวดหมู่ทั้งหมดที่ถูกใช้ในข้อคำถาม
    const usedCategoryNames = Array.from(new Set(questions.map((q) => q.category).filter(Boolean)));

    // สีประจำแต่ละด้าน (โทนสีสวยงาม คอนทราสต์ชัด)
    const colorPalette = [
      { color: '#3b82f6', bg: 'bg-blue-50/70 dark:bg-blue-950/30', border: 'border-blue-300 dark:border-blue-800/80', badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300', dot: 'bg-blue-500' },
      { color: '#f97316', bg: 'bg-orange-50/70 dark:bg-orange-950/30', border: 'border-orange-300 dark:border-orange-800/80', badge: 'bg-orange-100 dark:bg-orange-900/60 text-orange-600 dark:text-orange-300', dot: 'bg-orange-500' },
      { color: '#a855f7', bg: 'bg-purple-50/70 dark:bg-purple-950/30', border: 'border-purple-300 dark:border-purple-800/80', badge: 'bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300', dot: 'bg-purple-500' },
      { color: '#10b981', bg: 'bg-emerald-50/70 dark:bg-emerald-950/30', border: 'border-emerald-300 dark:border-emerald-800/80', badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300', dot: 'bg-emerald-500' },
      { color: '#ec4899', bg: 'bg-pink-50/70 dark:bg-pink-950/30', border: 'border-pink-300 dark:border-pink-800/80', badge: 'bg-pink-100 dark:bg-pink-900/60 text-pink-600 dark:text-pink-300', dot: 'bg-pink-500' },
      { color: '#06b6d4', bg: 'bg-cyan-50/70 dark:bg-cyan-950/30', border: 'border-cyan-300 dark:border-cyan-800/80', badge: 'bg-cyan-100 dark:bg-cyan-900/60 text-cyan-600 dark:text-cyan-300', dot: 'bg-cyan-500' },
    ];

    const icons = [GraduationCap, BookOpen, Star, Award, Heart, CheckCircle2];

    const orderedNames: string[] = [];
    categories.forEach((c) => {
      if (usedCategoryNames.includes(c.name) && !orderedNames.includes(c.name)) {
        orderedNames.push(c.name);
      }
    });
    usedCategoryNames.forEach((name) => {
      if (!orderedNames.includes(name)) {
        orderedNames.push(name);
      }
    });

    return orderedNames.map((fullName, idx) => {
      const palette = colorPalette[idx % colorPalette.length];
      const IconComponent = icons[idx % icons.length];

      let shortName = fullName;
      if (fullName.includes('กิจกรรม') && (fullName.includes('ประเมิน') || fullName.includes('การสอน'))) {
        shortName = 'ด้านการจัดกิจกรรมและประเมินผล';
      } else if (fullName.includes('พึงพอใจ')) {
        shortName = 'ด้านความพึงพอใจในภาพรวม';
      } else if (fullName.length > 28) {
        shortName = fullName.substring(0, 26) + '...';
      }

      return {
        fullName,
        shortName,
        index: idx,
        color: palette.color,
        bg: palette.bg,
        border: palette.border,
        badge: palette.badge,
        dot: palette.dot,
        IconComponent,
      };
    });
  }, [categories, questions]);

  // คำนวณคะแนนเฉลี่ยรายด้านแบบ Dynamic จากฐานข้อมูล
  const categoryStats = useMemo(() => {
    const catRatingQIds = new Map<string, string[]>();
    dynamicCategories.forEach((cat) => {
      const qIds = questions
        .filter((q) => q.category === cat.fullName && q.question_type !== 'text')
        .map((q) => q.id);
      catRatingQIds.set(cat.fullName, qIds);
    });

    const result: Record<string, { avg: number; count: number; sum: number }> = {};
    dynamicCategories.forEach((cat) => {
      result[cat.fullName] = { avg: 0, count: 0, sum: 0 };
    });

    filteredResponses.forEach((res) => {
      if (res.scores) {
        dynamicCategories.forEach((cat) => {
          const qIds = catRatingQIds.get(cat.fullName) || [];
          qIds.forEach((qid) => {
            const score = res.scores[qid];
            if (typeof score === 'number') {
              result[cat.fullName].sum += score;
              result[cat.fullName].count += 1;
            }
          });
        });
      }
    });

    dynamicCategories.forEach((cat) => {
      const item = result[cat.fullName];
      item.avg = item.count > 0 ? parseFloat((item.sum / item.count).toFixed(2)) : 0;
    });

    return result;
  }, [dynamicCategories, questions, filteredResponses]);

  // =========================================================================
  // 1. กราฟที่ 1: แผนภูมิโดนัท สัดส่วนผู้ประเมินตามสาขาวิชา/แผนกวิชา (Looker Studio Donut)
  // =========================================================================
  const majorDonutColors = [
    '#2563eb', // น้ำเงินสด (Blue)
    '#ea580c', // ส้ม (Orange)
    '#9333ea', // ม่วงเข้ม (Purple)
    '#059669', // เขียวมรกต (Emerald)
    '#0891b2', // ฟ้าเข้ม (Cyan)
    '#d97706', // อำพัน/ทอง (Amber)
    '#db2777', // ชมพูบานเย็น (Pink)
    '#4f46e5', // น้ำเงินคราม (Indigo)
    '#0d9488', // เขียวอมฟ้า (Teal)
    '#e11d48', // กุหลาบแดง (Rose)
    '#65a30d', // เขียวตอง (Lime)
    '#0284c7', // ฟ้าคราม (Sky)
    '#c026d3', // ม่วงฟิวเชีย (Fuchsia)
    '#475569', // เทาเข้ม (Slate)
    '#b45309', // น้ำตาลส้ม (Bronze)
  ];

  const majorChartData = useMemo(() => {
    const groupMap: Record<string, number> = {};

    // 1. นำรายชื่อสาขาวิชาทั้งหมดที่ตั้งค่าไว้ในระบบมาตั้งเป็นฐาน เพื่อให้ดึงข้อมูลสาขาครบถ้วน
    systemMajors.forEach((m) => {
      const cleanName = m.name.replace('สาขาวิชา', '').replace('แผนกวิชา', '').trim();
      if (cleanName) {
        groupMap[cleanName] = 0;
      }
    });

    // 2. นับจำนวนผู้ตอบแบบประเมินจริงในแต่ละสาขา
    filteredResponses.forEach((r) => {
      let key = r.major || r.department || 'ไม่ระบุสาขา';
      key = key.replace('สาขาวิชา', '').replace('แผนกวิชา', '').trim();
      groupMap[key] = (groupMap[key] || 0) + 1;
    });

    const total = filteredResponses.length || 1;
    const list = Object.entries(groupMap).map(([name, value]) => ({
      name,
      value,
      percentage: filteredResponses.length > 0 ? Math.round((value / total) * 1000) / 10 : 0,
    }));

    // สาขาที่มีผลประเมินจริง เรียงลำดับจากมากไปหาน้อยตามสัดส่วน
    const evaluated = list
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .map((item, index) => ({
        ...item,
        color: majorDonutColors[index % majorDonutColors.length],
        hasResponses: true,
      }));

    // สาขาในระบบที่ยังไม่มีผู้เรียนทำแบบประเมิน (ยอดเป็น 0 คน)
    const pending = list
      .filter((item) => item.value === 0)
      .map((item) => ({
        ...item,
        color: '#94a3b8',
        hasResponses: false,
      }));

    return [...evaluated, ...pending];
  }, [filteredResponses, systemMajors]);

  // =========================================================================
  // 2. กราฟที่ 2: แผนภูมิโดนัท สัดส่วนระดับความพึงพอใจ (Satisfaction Donut)
  // =========================================================================
  const satisfactionChartData = useMemo(() => {
    if (filteredResponses.length === 0) return [];

    let excellent = 0; // 4.50 - 5.00
    let good = 0;      // 3.50 - 4.49
    let moderate = 0;  // 2.50 - 3.49
    let improve = 0;   // < 2.50

    filteredResponses.forEach((r) => {
      const s = r.average_score || 0;
      if (s >= 4.5) excellent++;
      else if (s >= 3.5) good++;
      else if (s >= 2.5) moderate++;
      else improve++;
    });

    const total = filteredResponses.length;
    return [
      { name: 'ดีเยี่ยม (4.5 - 5.0)', value: excellent, percentage: Math.round((excellent / total) * 100), color: '#10b981' },
      { name: 'ดี (3.5 - 4.49)', value: good, percentage: Math.round((good / total) * 100), color: '#0284c7' },
      { name: 'ปานกลาง (2.5 - 3.49)', value: moderate, percentage: Math.round((moderate / total) * 100), color: '#f59e0b' },
      { name: 'ควรปรับปรุง (< 2.5)', value: improve, percentage: Math.round((improve / total) * 100), color: '#f43f5e' },
    ].filter((item) => item.value > 0);
  }, [filteredResponses]);

  // ฟังก์ชันจัดวางตัวเลขเปอร์เซ็นต์บนกราฟโดนัทสาขาวิชา ให้มีขนาดกะทัดรัดและอยู่กึ่งกลางเนื้อวงแหวน
  // หากสัดส่วนน้อยกว่า 5% จะไม่แสดงตัวเลขบนชิ้นพาย เพื่อป้องกันตัวเลขกระจุกตัวทับซ้อนกัน โดยดูค่าได้จาก Legend ด้านขวา
  const renderMajorPieLabel = useCallback(
    ({ cx, cy, midAngle, innerRadius, outerRadius, payload, percent }: any) => {
      const percentage = payload?.percentage ?? Math.round((percent || 0) * 100);
      if (percentage < 5) return null;
      const RADIAN = Math.PI / 180;
      const radius = innerRadius + (outerRadius - innerRadius) * 0.52;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);

      return (
        <text
          x={x}
          y={y}
          fill="#ffffff"
          textAnchor="middle"
          dominantBaseline="central"
          className="text-[10px] font-bold font-mono pointer-events-none"
          style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.75))' }}
        >
          {percentage}%
        </text>
      );
    },
    []
  );

  // รายการระดับความพึงพอใจ 4 ระดับ สำหรับจัดแสดงผลเป็นคู่ 2 แถว (2x2 Grid) ด้านล่างกราฟ
  const satisfactionLegendList = useMemo(() => {
    let excellent = 0; // 4.50 - 5.00
    let good = 0;      // 3.50 - 4.49
    let moderate = 0;  // 2.50 - 3.49
    let improve = 0;   // < 2.50

    filteredResponses.forEach((r) => {
      const s = r.average_score || 0;
      if (s >= 4.5) excellent++;
      else if (s >= 3.5) good++;
      else if (s >= 2.5) moderate++;
      else improve++;
    });

    const total = filteredResponses.length || 1;
    return [
      { label: 'ดีเยี่ยม', range: '4.50 - 5.00', value: excellent, percentage: Math.round((excellent / total) * 100), color: '#10b981' },
      { label: 'ดี', range: '3.50 - 4.49', value: good, percentage: Math.round((good / total) * 100), color: '#0284c7' },
      { label: 'ปานกลาง', range: '2.50 - 3.49', value: moderate, percentage: Math.round((moderate / total) * 100), color: '#f59e0b' },
      { label: 'ควรปรับปรุง', range: '< 2.50', value: improve, percentage: Math.round((improve / total) * 100), color: '#f43f5e' },
    ];
  }, [filteredResponses]);

  // =========================================================================
  // 3. กราฟที่ 3: กราฟแท่งเปรียบเทียบครูรายด้าน (Teacher Dynamic Grouped Bar Chart)
  // แกน X: รายชื่อครูผู้สอน
  // Bars: แสดงคะแนนเฉลี่ยตามด้านการประเมินแบบ Dynamic จากฐานข้อมูล
  // =========================================================================
  const teacher3DimChartData = useMemo(() => {
    if (filteredResponses.length === 0) return [];

    const teacherMap: Record<
      string,
      {
        teacherId: string;
        teacherName: string;
        shortName: string;
        department: string;
        totalEvals: number;
        catSums: Record<string, number>;
        catCounts: Record<string, number>;
      }
    > = {};

    const catRatingQIds = new Map<string, string[]>();
    dynamicCategories.forEach((cat) => {
      const qIds = questions
        .filter((q) => q.category === cat.fullName && q.question_type !== 'text')
        .map((q) => q.id);
      catRatingQIds.set(cat.fullName, qIds);
    });

    filteredResponses.forEach((res) => {
      const tid = res.teacher_id;
      if (!teacherMap[tid]) {
        teacherMap[tid] = {
          teacherId: tid,
          teacherName: res.teacher_name || 'อาจารย์',
          shortName: (res.teacher_name || 'อาจารย์').replace(/^(นาย|นางสาว|นาง|ว่าที่ ร\.ต\.|ว่าที่ร้อยตรี|อ\.)\s*/, ''),
          department: res.department || '',
          totalEvals: 0,
          catSums: {},
          catCounts: {},
        };
        dynamicCategories.forEach((cat) => {
          teacherMap[tid].catSums[cat.fullName] = 0;
          teacherMap[tid].catCounts[cat.fullName] = 0;
        });
      }
      teacherMap[tid].totalEvals += 1;

      if (res.scores) {
        dynamicCategories.forEach((cat) => {
          const qIds = catRatingQIds.get(cat.fullName) || [];
          qIds.forEach((qid) => {
            const score = res.scores[qid];
            if (typeof score === 'number') {
              teacherMap[tid].catSums[cat.fullName] += score;
              teacherMap[tid].catCounts[cat.fullName] += 1;
            }
          });
        });
      }
    });

    return Object.values(teacherMap)
      .map((t) => {
        const row: Record<string, any> = {
          teacherId: t.teacherId,
          teacherName: t.teacherName,
          shortName: t.shortName,
          department: t.department,
          totalEvals: t.totalEvals,
        };

        dynamicCategories.forEach((cat) => {
          const cnt = t.catCounts[cat.fullName] || 0;
          const sum = t.catSums[cat.fullName] || 0;
          row[cat.shortName] = cnt > 0 ? parseFloat((sum / cnt).toFixed(2)) : 0;
        });

        return row;
      })
      .sort((a, b) => {
        const firstKey = dynamicCategories[0]?.shortName || '';
        return (b[firstKey] || 0) - (a[firstKey] || 0);
      });
  }, [filteredResponses, dynamicCategories, questions]);

  // =========================================================================
  // 4. ตารางข้อมูลและการแบ่งหน้า (Pagination)
  // =========================================================================
  const tableDisplayData = useMemo(() => {
    if (!searchTable.trim()) return filteredResponses;
    const q = searchTable.toLowerCase();
    return filteredResponses.filter(
      (r) =>
        (r.teacher_name && r.teacher_name.toLowerCase().includes(q)) ||
        (r.department && r.department.toLowerCase().includes(q)) ||
        (r.education_level && r.education_level.toLowerCase().includes(q)) ||
        (r.major && r.major.toLowerCase().includes(q)) ||
        (r.gender && r.gender.toLowerCase().includes(q)) ||
        (r.suggestion && r.suggestion.toLowerCase().includes(q)) ||
        (r.impression && r.impression.toLowerCase().includes(q)) ||
        (r.feedback && r.feedback.toLowerCase().includes(q))
    );
  }, [filteredResponses, searchTable]);

  const totalItems = tableDisplayData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedTableData = useMemo(() => {
    return tableDisplayData.slice(startIndex, endIndex);
  }, [tableDisplayData, startIndex, endIndex]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  // ส่งออก Excel (.xlsx) ครบทุกมิติและแยกข้อ 3.3 และ 3.4
  const handleExportExcel = () => {
    if (filteredResponses.length === 0) {
      alert('ไม่มีข้อมูลสำหรับการส่งออก Excel ในช่วงการค้นหานี้');
      return;
    }

    const exportData = filteredResponses.map((item, index) => {
      // คำนวณคะแนนเฉลี่ยรายด้านแบบ Dynamic
      const catScores: Record<string, any> = {};
      dynamicCategories.forEach((cat) => {
        const qIds = questions
          .filter((q) => q.category === cat.fullName && q.question_type !== 'text')
          .map((q) => q.id);
        let cScore = 0, cCnt = 0;
        if (item.scores) {
          qIds.forEach((qid) => {
            const val = item.scores[qid];
            if (typeof val === 'number') {
              cScore += val;
              cCnt++;
            }
          });
        }
        catScores[`คะแนนเฉลี่ย: ${cat.shortName}`] = cCnt > 0 ? parseFloat((cScore / cCnt).toFixed(2)) : '-';
      });

      const row: Record<string, any> = {
        ลำดับ: index + 1,
        รหัสอาจารย์: item.teacher_id,
        ชื่ออาจารย์: item.teacher_name,
        แผนกวิชา: item.department || '-',
        เพศผู้ประเมิน: item.gender || '-',
        ระดับชั้น: item.education_level || '-',
        สาขาวิชา: item.major || '-',
        ปีการศึกษา: item.academic_year,
        ภาคเรียน: item.term,
        คะแนนเฉลี่ยรวม: item.average_score,
        ...catScores,
        ระดับความพึงพอใจ: (item.average_score || 0) >= 4.5 ? 'ดีเยี่ยม' : (item.average_score || 0) >= 3.5 ? 'ดี' : 'ปานกลาง',
        '3.3 ข้อเสนอแนะเพื่อการปรับปรุง/พัฒนา': item.suggestion || '-',
        '3.4 ความประทับใจที่มีต่อครูผู้สอน': item.impression || '-',
        ข้อคิดเห็นรวม: item.feedback || '-',
        วันเวลาที่ส่งประเมิน: item.created_at ? new Date(item.created_at).toLocaleString('th-TH') : '-',
      };

      questions.forEach((q, qIdx) => {
        let val: any = item.scores?.[q.id];
        if (val === undefined && q.question_type === 'text') {
          val = item.text_answers?.[q.id] || (q.order_no === 15 || q.question_text.includes('3.3') ? item.suggestion : item.impression) || item.suggestion || item.feedback || '-';
        }
        row[`ข้อที่ ${qIdx + 1} (${q.question_text.substring(0, 30)}...)`] = val ?? '-';
      });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ผลการประเมินการสอน');

    const fileName = `รายงานผลการประเมินการสอน_LookerStudio_วษท_มหาสารคาม_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const displayYear = selectedYear !== 'all' ? selectedYear : (activePeriod?.academic_year || '2568');
  const displayTerm = selectedTerm !== 'all' ? selectedTerm : (activePeriod?.term || '2');

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn transition-colors">
      
      {/* 1. Header Banner สไตล์ทางการ วิทยาลัยเกษตรและเทคโนโลยีมหาสารคาม (Looker Studio Title Style) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-md hover:shadow-xl hover:-translate-y-0.5 border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-all duration-300">
        
        <div className="flex items-start sm:items-center gap-4">
          {/* Statistical Analytics Vector Graphic Emblem */}
          <div 
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-700 to-emerald-600 p-0.5 shadow-lg hover:shadow-blue-500/20 hover:scale-105 transition-all duration-300 shrink-0 flex items-center justify-center group cursor-pointer"
            title="ระบบวิเคราะห์สถิติและประเมินผลการจัดการเรียนการสอน"
          >
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center p-2 sm:p-2.5 shadow-inner">
              <svg 
                viewBox="0 0 48 48" 
                fill="none" 
                className="w-full h-full drop-shadow-sm group-hover:scale-110 transition-transform duration-300"
              >
                <defs>
                  {/* Bar Column Gradients */}
                  <linearGradient id="headerBarGrad1" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#60a5fa" />
                  </linearGradient>
                  <linearGradient id="headerBarGrad2" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#4f46e5" />
                    <stop offset="100%" stopColor="#818cf8" />
                  </linearGradient>
                  <linearGradient id="headerBarGrad3" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>

                  {/* Trend Line Gradient */}
                  <linearGradient id="headerTrendGrad" x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#fbbf24" />
                  </linearGradient>

                  {/* Glow Shadow Filter */}
                  <filter id="headerGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#f59e0b" floodOpacity="0.4" />
                  </filter>
                </defs>

                {/* Subtle Background Data Guide Lines */}
                <line x1="6" y1="16" x2="42" y2="16" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" className="text-slate-200 dark:text-slate-700/60" />
                <line x1="6" y1="26" x2="42" y2="26" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" className="text-slate-200 dark:text-slate-700/60" />

                {/* Base Axis Line */}
                <line x1="5" y1="40" x2="43" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-slate-300 dark:text-slate-600" />

                {/* 3 Statistical Bar Columns (Representing the 3 Core Evaluation Dimensions) */}
                <rect x="9" y="24" width="7" height="15" rx="3" fill="url(#headerBarGrad1)" />
                <rect x="20" y="17" width="7" height="22" rx="3" fill="url(#headerBarGrad2)" />
                <rect x="31" y="10" width="7" height="29" rx="3" fill="url(#headerBarGrad3)" />

                {/* Upward Quality Trend Curve */}
                <path
                  d="M 6 32 C 13 30, 16 20, 23.5 17.5 C 29 15.5, 32 10, 39 6"
                  fill="none"
                  stroke="url(#headerTrendGrad)"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#headerGlow)"
                />

                {/* Data Points / Nodes on Trendline */}
                <circle cx="12.5" cy="27" r="2" fill="#ffffff" stroke="#f59e0b" strokeWidth="1.5" />
                <circle cx="23.5" cy="17.5" r="2" fill="#ffffff" stroke="#f59e0b" strokeWidth="1.5" />
                
                {/* Peak Node with 5-Star Quality Sparkle */}
                <circle cx="39" cy="6" r="3" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" />
                <path d="M 43 2 L 43.8 3.8 L 45.5 4.5 L 43.8 5.2 L 43 7 L 42.2 5.2 L 40.5 4.5 L 42.2 3.8 Z" fill="#fbbf24" />
              </svg>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
              </span>
              <span className="text-[11px] font-bold text-blue-900 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/80 px-2.5 py-0.5 rounded-md border border-blue-300 dark:border-blue-800">
                ภาคเรียนที่ {displayTerm} ปีการศึกษา {displayYear}
              </span>
              {lastUpdated && (
                <span className="text-[11px] text-slate-400">
                  • อัปเดตล่าสุด: {lastUpdated} น.
                </span>
              )}
            </div>
            
            <h1 className="text-lg sm:text-2xl font-black text-blue-900 dark:text-blue-400 tracking-tight leading-snug">
              รายงาน ผลการประเมินความพึงพอใจของผู้เรียนที่มีต่อการจัดการเรียนการสอนของครูผู้สอน
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
              วิทยาลัยเกษตรและเทคโนโลยีมหาสารคาม • สำนักงานคณะกรรมการการอาชีวศึกษา
            </p>
          </div>
        </div>

        {/* Top-Right Area: Vector Statistic Icon + "จำนวนผู้เรียนทั้งหมด" Card & Action Buttons */}
        <div className="flex flex-wrap items-center gap-3.5 self-start lg:self-center shrink-0">
          
          {/* การ์ดยอดผู้เรียนทั้งหมด (Vector Statistics & Donut Graph Icon สไตล์ Executive) */}
          <div className="bg-amber-50/90 dark:bg-amber-950/60 border-2 border-amber-300 dark:border-amber-700/70 rounded-2xl p-3 sm:px-4 sm:py-3 flex items-center gap-3.5 shadow-sm hover:shadow-md transition-all">
            {/* Custom SVG Vector Graphics: สัญลักษณ์สถิติและชาร์ตวงกลมแบ่งแยกพร้อมนักศึกษา */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-100 dark:bg-amber-900/60 p-1.5 flex items-center justify-center shrink-0 shadow-inner">
              <svg viewBox="0 0 48 48" fill="none" className="w-full h-full text-amber-600 dark:text-amber-300">
                {/* Segmented Circular Stat Arcs (ชาร์ตวงกลมที่แบ่งแยก) */}
                <circle cx="24" cy="24" r="19" stroke="#fde68a" strokeWidth="4.5" strokeDasharray="32 80" strokeLinecap="round" />
                <circle cx="24" cy="24" r="19" stroke="#f59e0b" strokeWidth="4.5" strokeDasharray="48 60" strokeDashoffset="-38" strokeLinecap="round" />
                <circle cx="24" cy="24" r="19" stroke="#3b82f6" strokeWidth="4.5" strokeDasharray="22 90" strokeDashoffset="-92" strokeLinecap="round" />
                {/* Center Student Silhouette */}
                <circle cx="24" cy="18" r="4.5" fill="currentColor" />
                <path d="M15 33c0-4 4-7.5 9-7.5s9 3.5 9 7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 block">
                  จำนวนผู้เรียนทั้งหมดตามทะเบียน
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-blue-900 dark:text-blue-300 font-mono tracking-tight leading-none">
                  {targetEnrollment.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">คน</span>
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800 ml-1 font-mono">
                  {stats.participationRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: รีเฟรช และ Export Excel */}
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors shadow-sm"
              title="รีเฟรชดึงข้อมูลล่าสุด"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
              <span className="hidden sm:inline">รีเฟรช</span>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={filteredResponses.length === 0}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white shadow-sm transition-all ${
                filteredResponses.length === 0
                  ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed text-slate-500'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-emerald-700/20'
              }`}
              title="ส่งออกรายงาน Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

      </div>

      {/* 2. Looker Studio Filter Bar (เลือกชื่อครู, สาขาวิชา/แผนก, พร้อมเลือกปีและเทอมได้อิสระ) */}
      <div className="bg-slate-900 dark:bg-slate-900 text-white rounded-2xl p-4 shadow-md hover:shadow-xl hover:-translate-y-0.5 flex flex-wrap items-center justify-between gap-4 border border-slate-800 transition-all duration-300">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider shrink-0 pr-2 border-r border-slate-700">
            <Filter className="w-3.5 h-3.5" />
            <span>ตัวกรอง Looker Studio:</span>
          </div>

          {/* เลือกชื่อครู (เหมือน Looker Studio ช่องแรก) */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-400">เลือกชื่อครู:</label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-400 font-medium max-w-[210px]"
            >
              <option value="all">- เลือกชื่อครู (ทั้งหมด) -</option>
              {teachers.map((teach) => (
                <option key={teach.id} value={teach.id}>{teach.name}</option>
              ))}
            </select>
          </div>

          {/* สาขาวิชา/แผนก (เหมือน Looker Studio ช่องที่สอง) */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-400">สาขาวิชา/แผนก:</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-400 font-medium max-w-[200px]"
            >
              <option value="all">- สาขาวิชา/แผนก (ทั้งหมด) -</option>
              {availableDepartments.map((dep) => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>
          </div>

          {/* ปีการศึกษา (จุดแข็งของระบบเรา: ดูย้อนหลังได้หลายปี) */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-400">ปีการศึกษา:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="all">ทุกปี</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>ปี {yr}</option>
              ))}
            </select>
          </div>

          {/* ภาคเรียน */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-400">ภาคเรียน:</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="all">ทุกเทอม</option>
              {availableTerms.map((t) => (
                <option key={t} value={t}>เทอม {t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">
            แสดง {filteredResponses.length} จาก {responses.length} รายการ
          </span>
          {(selectedYear !== 'all' || selectedTerm !== 'all' || selectedDepartment !== 'all' || selectedTeacherId !== 'all') && (
            <button
              onClick={() => {
                setSelectedYear('all');
                setSelectedTerm('all');
                setSelectedDepartment('all');
                setSelectedTeacherId('all');
              }}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

      {/* 3. การ์ดสรุปคะแนน 4 มิติหลัก (Looker Studio 4 KPI Scorecards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: 🟥 จำนวนนักเรียนที่ประเมินรวม */}
        <div className="bg-rose-50/70 dark:bg-rose-950/30 p-5 rounded-2xl border-2 border-rose-300 dark:border-rose-800/80 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-800 dark:text-rose-300 mb-2">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wide">
              จำนวนนักเรียนที่ประเมินรวม
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl sm:text-5xl font-black text-rose-950 dark:text-white tracking-tight leading-none font-mono">
                {stats.totalCount.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-rose-700 dark:text-rose-400">คน</span>
            </div>

            <div className="grid grid-cols-3 gap-1 pt-2 border-t border-rose-200 dark:border-rose-900/60 text-center">
              <div className="bg-white/80 dark:bg-slate-900/60 rounded-lg p-1">
                <span className="text-[10px] text-slate-500 block">ชาย</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">{stats.maleCount}</span>
              </div>
              <div className="bg-white/80 dark:bg-slate-900/60 rounded-lg p-1">
                <span className="text-[10px] text-slate-500 block">หญิง</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">{stats.femaleCount}</span>
              </div>
              <div className="bg-white/80 dark:bg-slate-900/60 rounded-lg p-1">
                <span className="text-[10px] text-slate-500 block">ไม่ระบุ</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">{stats.otherCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Category Cards (แสดงคะแนนเฉลี่ยแยกตามแต่ละด้านที่ตั้งค่าไว้จริงในระบบ) */}
        {dynamicCategories.map((cat) => {
          const catStat = categoryStats[cat.fullName] || { avg: 0, count: 0 };
          const IconComp = cat.IconComponent;
          return (
            <div
              key={cat.fullName}
              className={`${cat.bg} p-5 rounded-2xl border-2 ${cat.border} shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between text-slate-800 dark:text-slate-200 mb-2">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wide truncate max-w-[80%]" title={cat.fullName}>
                  คะแนนเฉลี่ย{cat.shortName}
                </span>
                <div className={`w-8 h-8 rounded-lg ${cat.badge} flex items-center justify-center font-bold shrink-0`}>
                  <IconComp className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
                    {catStat.avg.toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">/ 5.00</span>
                </div>
                <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 pt-1 border-t border-slate-200/80 dark:border-slate-800">
                  <span className={`w-2 h-2 rounded-full ${cat.dot} inline-block shrink-0`} />
                  <span className="truncate" title={cat.fullName}>{cat.fullName}</span>
                </div>
              </div>
            </div>
          );
        })}

      </div>

      {/* 4. แถบแสดงทั้ง 3 กราฟแยกออกมาอย่างชัดเจน เฉลี่ยพื้นที่เท่ากัน (3-Column Layout: Donut 1 + Donut 2 + Bar Chart 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Graph 1: แผนภูมิโดนัท สัดส่วนผู้ประเมินแยกตามสาขาวิชา/แผนก (Looker Studio Donut) */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  สัดส่วนตามสาขาวิชา/แผนก
                </h2>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {majorChartData.filter((m) => m.hasResponses).length} / {majorChartData.length} สาขา
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              จำนวนผู้เรียนที่ตอบแบบประเมินจำแนกตามสาขาวิชาในระบบ
            </p>
          </div>

          <div className="my-2">
            {majorChartData.filter((m) => m.hasResponses).length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {/* แผนภูมิโดนัท (ฝั่งซ้าย) */}
                <div className="relative w-full sm:w-[46%] h-52 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={majorChartData.filter((m) => m.hasResponses)}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={72}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={renderMajorPieLabel}
                        labelLine={false}
                      >
                        {majorChartData.filter((m) => m.hasResponses).map((entry, index) => (
                          <Cell key={`major-cell-${index}`} fill={entry.color} stroke={isDark ? '#0f172a' : '#ffffff'} strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(v: any, name: any, item: any) => [`${v} คน (${item.payload.percentage}%)`, name]}
                        contentStyle={{
                          backgroundColor: isDark ? '#1e293b' : '#ffffff',
                          borderColor: isDark ? '#334155' : '#e2e8f0',
                          color: isDark ? '#ffffff' : '#0f172a',
                          borderRadius: '12px',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* รายการ Legend แบบ HTML เรียงลำดับจากร้อยละมากไปน้อยตรงกับชิ้นพาย 100% */}
                <div className="w-full sm:w-[54%] max-h-52 overflow-y-auto pr-1 space-y-1">
                  {majorChartData.map((item) => (
                    <div 
                      key={item.name} 
                      className={`flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg text-[11px] transition-colors ${
                        item.hasResponses 
                          ? 'hover:bg-slate-50 dark:hover:bg-slate-800/60' 
                          : 'opacity-60 bg-slate-50/50 dark:bg-slate-800/30'
                      }`}
                      title={`${item.name} (${item.value.toLocaleString()} คน, ${item.percentage}%)`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" 
                          style={{ backgroundColor: item.color }} 
                        />
                        <span className="text-slate-700 dark:text-slate-300 truncate font-medium">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-1.5">
                        {item.hasResponses ? (
                          <>
                            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                              {item.percentage}%
                            </span>
                            <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500">
                              ({item.value} คน)
                            </span>
                          </>
                        ) : (
                          <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            รอประเมิน
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-52 flex items-center justify-center text-slate-400 text-xs">
                ไม่พบข้อมูลสาขาวิชา
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>ผู้ประเมินรวม: <strong className="text-slate-800 dark:text-white font-bold">{stats.totalCount.toLocaleString()}</strong> คน</span>
            <span className="text-slate-400 dark:text-slate-500 text-[10px]">รวมทุกสาขา</span>
          </div>
        </div>

        {/* Graph 2: แผนภูมิโดนัท สัดส่วนระดับความพึงพอใจ (Satisfaction Donut) */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-500/20" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  สัดส่วนระดับความพึงพอใจ
                </h2>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                ดีเยี่ยม {stats.excellentRate}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              การกระจายตัวของระดับคะแนนความพึงพอใจ 4 ระดับ
            </p>
          </div>

          <div className="my-2">
            {satisfactionChartData.length > 0 ? (
              <div>
                <div className="relative w-full h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={satisfactionChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={74}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {satisfactionChartData.map((entry, index) => (
                          <Cell key={`sat-cell-${index}`} fill={entry.color} stroke={isDark ? '#0f172a' : '#ffffff'} strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(v: any, name: any, item: any) => [`${v} ครั้ง (${item.payload.percentage}%)`, name]}
                        contentStyle={{
                          backgroundColor: isDark ? '#1e293b' : '#ffffff',
                          borderColor: isDark ? '#334155' : '#e2e8f0',
                          color: isDark ? '#ffffff' : '#0f172a',
                          borderRadius: '12px',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* ค่าเฉลี่ยรวมตรงกลางรูกลวงของโดนัท (ตรงกึ่งกลางพอดี) */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                      {stats.overallAvg.toFixed(2)}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      เฉลี่ยรวม
                    </span>
                  </div>
                </div>

                {/* รายละเอียดระดับความพึงพอใจ วางเป็นคู่ 2 แถว (2x2 Grid) สมดุลและอ่านง่าย */}
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  {satisfactionLegendList.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: item.color }} />
                        <div className="flex flex-col min-w-0">
                          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate leading-tight">
                            {item.label}
                          </span>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono leading-tight">
                            {item.range}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-1.5">
                        <span className="text-xs font-bold font-mono text-slate-900 dark:text-white block leading-tight">
                          {item.percentage}%
                        </span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono block leading-tight">
                          {item.value} คน
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400 text-xs">ไม่พบข้อมูลความพึงพอใจ</div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>คะแนนเฉลี่ยรวม: <strong className="text-slate-800 dark:text-white font-bold">{stats.overallAvg.toFixed(2)}</strong> / 5.00</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">ระดับดีเยี่ยม</span>
          </div>
        </div>

        {/* Graph 3: กราฟแท่งเปรียบเทียบครูรายด้าน (Teacher Dynamic Grouped Bar Chart) */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  เปรียบเทียบครูผู้สอน ({dynamicCategories.length} ด้านหลัก)
                </h2>
              </div>
              <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                เต็ม 5.00
              </span>
            </div>

            {/* Custom Legend แบบ Dynamic ตามด้านที่ตั้งค่าไว้จริง */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-[10px] font-semibold">
              {dynamicCategories.map((cat) => (
                <div key={cat.fullName} className="flex items-center gap-1" title={cat.fullName}>
                  <span className="w-2.5 h-2.5 rounded-sm inline-block shadow-sm" style={{ backgroundColor: cat.color }}></span>
                  <span className="text-slate-700 dark:text-slate-200">{cat.shortName}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full h-64 my-2 overflow-x-auto">
            {teacher3DimChartData.length > 0 ? (
              <div style={{ minWidth: teacher3DimChartData.length > 4 ? `${teacher3DimChartData.length * 80}px` : '100%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teacher3DimChartData} margin={{ top: 10, right: 10, left: -25, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                    <XAxis 
                      dataKey="shortName" 
                      tick={{ fill: isDark ? '#94a3b8' : '#475569', fontSize: 10, fontWeight: 600 }} 
                      angle={-20} 
                      textAnchor="end" 
                      interval={0} 
                    />
                    <YAxis 
                      domain={[0, 5]} 
                      ticks={[0, 1, 2, 3, 4, 5]} 
                      tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }} 
                    />
                    <Tooltip 
                      formatter={(v: any, name: any) => [`${Number(v).toFixed(2)} คะแนน`, name]}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.teacherName || label}
                      contentStyle={{
                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                        borderColor: isDark ? '#334155' : '#e2e8f0',
                        color: isDark ? '#ffffff' : '#0f172a',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    {dynamicCategories.map((cat) => (
                      <Bar
                        key={cat.fullName}
                        dataKey={cat.shortName}
                        fill={cat.color}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={16}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">ไม่พบข้อมูลการประเมินอาจารย์</div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 text-center">
            วิเคราะห์เปรียบเทียบรายบุคคลตามเกณฑ์ สอศ.
          </div>
        </div>

      </div>

      {/* 5. ตารางข้อคิดเห็นเชิงคุณภาพ 3.3 & 3.4 และรายงานผลประเมินรายบุคคล (Looker Studio Table) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
        
        {/* Table Header: สลับโหมดตาราง, ค้นหา, และเลือกจำนวนต่อหน้า */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {tableMode === 'feedback' ? 'ตารางข้อคิดเห็นเชิงคุณภาพของผู้เรียน (ข้อ 3.3 & 3.4)' : 'ตารางรายงานผลการประเมินรายบุคคลทั้งหมด'}
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                ทั้งหมด {totalItems.toLocaleString()} รายการ
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {tableMode === 'feedback' 
                ? 'สรุปความคิดเห็น ข้อเสนอแนะเพื่อการปรับปรุง และความประทับใจที่มีต่อครูผู้สอนตามแบบ Looker Studio'
                : 'รายละเอียดคะแนนประเมินรายบุคคลครบทุกข้อ พร้อมข้อมูลเพศ ระดับชั้น และสาขาวิชา'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* สลับมุมมองตาราง (Looker Studio Feedback vs Full Demographics) */}
            <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setTableMode('feedback')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                  tableMode === 'feedback'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>ข้อคิดเห็น 3.3 & 3.4</span>
              </button>
              <button
                type="button"
                onClick={() => setTableMode('full')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                  tableMode === 'full'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>รายงานข้อมูลเต็ม</span>
              </button>
            </div>

            {/* ตัวควบคุมการกดดูแบบลำดับ (Sequential Stepper สไตล์ Looker Studio เช่น 1-10 / 2,000) */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 pl-2 pr-1 hidden sm:inline">
                ลำดับ:
              </span>

              {/* ปุ่มย้อนกลับ (<) */}
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all active:scale-95"
                title="ย้อนกลับ (ลำดับก่อนหน้า เช่น 1-10)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* ป้ายแสดงผลลำดับ เช่น 1-10 / 2,000 หรือ 10/2000 */}
              <div 
                className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-mono flex items-center gap-1 shadow-inner text-xs cursor-default select-none"
                title={`กำลังแสดงลำดับที่ ${totalItems === 0 ? 0 : startIndex + 1} ถึง ${endIndex} จากทั้งหมด ${totalItems.toLocaleString()} คน`}
              >
                <span className="font-black text-blue-600 dark:text-blue-400">
                  {totalItems === 0 ? '0' : `${startIndex + 1}-${endIndex}`}
                </span>
                <span className="text-slate-400 font-bold">/</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {totalItems.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 ml-0.5">คน</span>
              </div>

              {/* ปุ่มถัดไป (>) */}
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all active:scale-95"
                title="กดดู 10 ลำดับถัดไป (เช่น 11-20)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* ตัวเลือกปรับขนาดการดู (ทีละ 10, 20, 50, 100 คน) */}
              <div className="pl-1 border-l border-slate-200 dark:border-slate-700">
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-transparent border-0 text-slate-600 dark:text-slate-300 text-xs font-semibold py-1 pr-1 outline-none cursor-pointer"
                  title="ปรับจำนวนรายการต่อครั้ง"
                >
                  <option value={10}>ทีละ 10</option>
                  <option value={20}>ทีละ 20</option>
                  <option value={50}>ทีละ 50</option>
                  <option value={100}>ทีละ 100</option>
                </select>
              </div>
            </div>

            {/* ค้นหาในตาราง */}
            <div className="relative w-full sm:w-56">
              <input
                type="text"
                value={searchTable}
                onChange={(e) => setSearchTable(e.target.value)}
                placeholder="ค้นหาชื่อครู, สาขา, ข้อคิดเห็น..."
                className="w-full text-xs px-3.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Table Content: โหมด 1 ตารางข้อคิดเห็น 3.3 และ 3.4 (แบบ Looker Studio เป๊ะๆ) */}
        {tableMode === 'feedback' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4 min-w-[180px]">ชื่อครูผู้สอน</th>
                  <th className="py-3 px-4 min-w-[280px]">3.3 นักศึกษาต้องการให้ครูผู้สอน... (สิ่งที่อยากให้ปรับปรุง/ทำเพิ่ม)</th>
                  <th className="py-3 px-4 min-w-[280px]">3.4 ความประทับใจที่มีต่อครูผู้สอน</th>
                  <th className="py-3 px-4 text-center w-24">คะแนน</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">วันที่ส่ง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedTableData.length > 0 ? (
                  paginatedTableData.map((res, index) => {
                    const rowNumber = startIndex + index + 1;
                    const suggestionText = res.suggestion || (res.feedback && !res.impression ? res.feedback : '');
                    const impressionText = res.impression || '';
                    
                    return (
                      <tr key={res.id || `${currentPage}-${index}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3.5 px-4 text-center text-slate-400 font-mono font-semibold">{rowNumber}.</td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {res.teacher_name}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                            {res.department || '-'} • {res.major || '-'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 leading-relaxed">
                          {suggestionText ? (
                            <span className="bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 p-1.5 rounded-lg block border border-amber-200/60 dark:border-amber-900/40">
                              {suggestionText}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 italic">null</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 leading-relaxed">
                          {impressionText ? (
                            <span className="bg-purple-50/50 dark:bg-purple-950/20 text-purple-900 dark:text-purple-200 p-1.5 rounded-lg block border border-purple-200/60 dark:border-purple-900/40">
                              {impressionText}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 italic">null</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                            {(res.average_score || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-400 whitespace-nowrap">
                          {res.created_at ? new Date(res.created_at).toLocaleDateString('th-TH') : '-'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      ไม่พบข้อมูลการประเมินตรงตามเงื่อนไข
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Table Content: โหมด 2 ตารางข้อมูลเต็ม (Full Evaluation Details) */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">อาจารย์ผู้รับการประเมิน</th>
                  <th className="py-3 px-4">แผนกวิชา</th>
                  <th className="py-3 px-4">เพศ</th>
                  <th className="py-3 px-4">ระดับชั้น</th>
                  <th className="py-3 px-4">สาขาวิชา</th>
                  <th className="py-3 px-4">ปี / เทอม</th>
                  <th className="py-3 px-4">คะแนนเฉลี่ย</th>
                  <th className="py-3 px-4">ระดับ</th>
                  <th className="py-3 px-4">ข้อคิดเห็น/เสนอแนะ</th>
                  <th className="py-3 px-4 whitespace-nowrap">วันที่</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedTableData.length > 0 ? (
                  paginatedTableData.map((res, index) => {
                    const score = res.average_score || 0;
                    const rowNumber = startIndex + index + 1;
                    return (
                      <tr key={res.id || `${currentPage}-${index}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4 text-center text-slate-400 font-mono font-semibold">{rowNumber}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{res.teacher_name}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">{res.department || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center justify-center font-bold px-2 py-0.5 rounded-lg text-[10px] ${
                            res.gender === 'หญิง'
                              ? 'bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border border-pink-200 dark:border-pink-900/50'
                              : res.gender === 'ชาย'
                              ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-900/50'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}>
                            {res.gender === 'หญิง' ? 'หญิง' : res.gender === 'ชาย' ? 'ชาย' : 'ไม่ระบุ'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                          {res.education_level || '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-[130px] truncate">
                          {res.major || '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {res.academic_year} / {res.term}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {score.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                            score >= 4.5
                              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : score >= 3.5
                              ? 'bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                              : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          }`}>
                            <Star className="w-2.5 h-2.5 fill-current" />
                            {score >= 4.5 ? 'ดีเยี่ยม' : score >= 3.5 ? 'ดี' : 'ปานกลาง'}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-600 dark:text-slate-400">
                          {res.suggestion ? `(3.3) ${res.suggestion}` : res.impression ? `(3.4) ${res.impression}` : res.feedback || '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {res.created_at ? new Date(res.created_at).toLocaleDateString('th-TH') : '-'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400">
                      ไม่พบข้อมูลการประเมินตรงตามเงื่อนไข
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* แถบควบคุมการแบ่งหน้า (Pagination Footer สไตล์ Looker Studio: 1 - 10 / 2,000 < >) */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          
          {/* ข้อมูลจำนวนที่กำลังแสดง */}
          <div className="text-slate-600 dark:text-slate-400 font-medium">
            {totalItems > 0 ? (
              <span>
                แสดงลำดับที่ <strong className="text-slate-900 dark:text-white font-bold font-mono">{startIndex + 1}</strong> -{' '}
                <strong className="text-slate-900 dark:text-white font-bold font-mono">{endIndex}</strong> จากทั้งหมด{' '}
                <strong className="text-blue-600 dark:text-blue-400 font-bold font-mono">{totalItems.toLocaleString()}</strong> คน{' '}
                <span className="text-slate-400">
                  (หน้า {currentPage} / {totalPages})
                </span>
              </span>
            ) : (
              <span>ไม่พบรายการที่ตรงกับเงื่อนไข</span>
            )}
          </div>

          {/* ปุ่มนำทางหน้า (Pagination Controls) */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="หน้าแรกสุด (ลำดับ 1-10)"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
                title="ย้อนกลับ (ลำดับก่อนหน้า)"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ก่อนหน้า</span>
              </button>

              <div className="flex items-center gap-1">
                {totalPages <= 7 ? (
                  getPageNumbers().map((p, pIdx) => {
                    if (p === '...') {
                      return (
                        <span key={`ellipsis-${pIdx}`} className="px-1.5 text-slate-400">
                          ...
                        </span>
                      );
                    }
                    const pageNum = p as number;
                    const isActive = currentPage === pageNum;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`min-w-[32px] h-8 rounded-lg text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300 dark:ring-blue-800'
                            : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })
                ) : (
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                    <span>ลำดับ {startIndex + 1}-{endIndex}</span>
                    <span className="text-slate-400 font-normal">/ {totalItems.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
                title="ถัดไป (10 ลำดับถัดไป)"
              >
                <span className="hidden sm:inline">ถัดไป</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="หน้าสุดท้าย"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};
