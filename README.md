# ระบบประเมินอาจารย์ (Teacher Evaluation System)
ระบบประเมินการสอนอาจารย์ พัฒนาด้วย **React + TypeScript + Tailwind CSS** เชื่อมต่อกับ **Supabase Database** พร้อมการออกแบบที่เอื้อต่อผู้สูงอายุ (Senior-Friendly UI) และศูนย์แชร์ลิงก์ตรง/QR Code ประจำตัวครู

---

## ฟีเจอร์หลัก (Features)

### 1. ลิงก์ตรงประจำตัวครู (Direct Dedicated Link for Seniors)
- ส่งลิงก์เฉพาะอาจารย์ เช่น `http://localhost:5173/?teacher_id=t1`
- เมื่อนักเรียนผู้สูงอายุเปิดจาก LINE หรือสแกน QR Code หน้าจอจะ**ล็อกรูปถ่ายและชื่ออาจารย์ท่านนั้นทันที** โดยไม่ต้องเลื่อนหา
- มี **Dropdown Switcher** ด้านล่างสำหรับนักเรียนที่คล่องมือถือ หรือต้องการประเมินอาจารย์ท่านอื่นต่อ
- ปุ่มคะแนน 1 - 5 ขนาดใหญ่พิเศษ แตะง่าย คอนทราสต์ชัด พร้อมคำอธิบายระดับภาษาไทย

### 2. ศูนย์แอดมินและแดชบอร์ด (Admin Dashboard)
- ระบบ **Admin Auth** ก่อนเข้าถึง (รหัสผ่านเริ่มต้น: `admin1234`)
- กราฟสรุปผลคะแนนเฉลี่ยรายด้าน (Category Breakdown) ด้วย **Recharts**
- ตารางแสดงรายการผลการประเมินจากผู้เรียนทั้งหมด
- ตัวกรอง Dropdown: กรองตามปีการศึกษา, ภาคเรียน, และอาจารย์รายท่าน
- ปุ่ม **Export to Excel (.xlsx)** ส่งออกข้อมูลทุกมิติเป็นไฟล์ Excel สมบูรณ์แบบด้วยไลบรารี `xlsx`
- **ระบบสร้างลิงก์ & QR Code ของครูแต่ละท่าน**: กดคัดลอกลิงก์ส่งเข้า LINE หรือฉาย QR Code ขึ้นจอโปรเจกเตอร์

### 3. ระบบจัดการคำถามแบบประเมิน (Admin Survey Config)
- ฟอร์มสำหรับเพิ่มข้อคำถามใหม่ ระบุหมวดหมู่/ด้านการประเมิน และลำดับข้อ
- ตารางรายการคำถามแบบ **Editable Table** (กดแก้ไขข้อความหรือหมวดหมู่ และกดบันทึกหรือลบได้ทันที)
- อัปเดตข้อมูลขึ้น Supabase ทันที

---

## โครงสร้างไฟล์สำคัญ

```
e:/my-appEval/
├── supabase_schema.sql         # สคริปต์ SQL สำหรับสร้างตาราง teachers, survey_config, responses
├── src/
│   ├── config.js               # ตั้งค่า Supabase URL และ Anon Key
│   ├── supabaseClient.js       # ตัวแปร supabase client
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   ├── services/
│   │   └── dataService.ts      # ฟังก์ชันเชื่อมต่อฐานข้อมูล พร้อมโหมด Fallback ออฟไลน์
│   ├── components/
│   │   ├── Navbar.tsx                   # Responsive Navbar สีแดงอาชีวะ (#932D16)
│   │   ├── Evaluator.tsx                # หน้าแบบประเมินสำหรับผู้เรียน (รองรับคะแนน 1-5 และแบบเขียนตอบ)
│   │   ├── Dashboard.tsx                # แดชบอร์ดสรุปผลสถิติ กราฟ 3 มิติ และส่งออก Excel
│   │   ├── AdminConfig.tsx              # หน้าจัดการคำถามประเมินและด้านการประเมิน
│   │   ├── AdminLogin.tsx               # หน้าต่างล็อกอินผู้ดูแลระบบ (SHA-256 Auth)
│   │   ├── TeacherManagement.tsx        # หน้าจัดการข้อมูลอาจารย์ผู้สอน 150+ ท่าน
│   │   ├── UserManagement.tsx           # หน้าจัดการสิทธิ์ผู้ใช้งานและเปลี่ยนรหัสผ่าน
│   │   └── AcademicPeriodManagement.tsx # หน้าจัดการปีการศึกษาและภาคเรียน
│   ├── App.tsx                          # Protected Routing & Role Guards
│   └── main.tsx
├── .env.example                         # ตัวอย่างการตั้งค่า Environment Variables
├── DEPLOYMENT_GUIDE.html                # คู่มือการติดตั้งฐานข้อมูล Supabase และการ Deploy ขึ้น Vercel
├── SECURITY_AND_GIT_GUIDE.html          # คู่มือตรวจสอบความปลอดภัย และขั้นตอนนำโค้ดขึ้น Git/GitHub
└── GIT_MASTER_GUIDE.html                # คู่มือการใช้งาน Git & GitHub ฉบับสมบูรณ์ (4 กรณี + Step-by-Step)
```

---

## ขั้นตอนการติดตั้งและเริ่มใช้งาน

### 1. รันเซิร์ฟเวอร์สำหรับพัฒนา (Development Server)
```bash
npm install
npm run dev
```
เปิดบราวเซอร์ไปที่ `http://localhost:5173`

### 2. การเชื่อมต่อกับ Supabase จริง
1. เข้าไปที่ [Supabase](https://supabase.com) แล้วสร้างโปรเจกต์ใหม่
2. ไปที่เมนู **SQL Editor** แล้วคัดลอกคำสั่งทั้งหมดในไฟล์ `supabase_schema.sql` ไปวางและกด **Run**
3. ไปที่ **Project Settings > API** คัดลอก `Project URL` และ `anon public key`
4. สร้างไฟล์ `.env` ในโฟลเดอร์หลักของโปรเจกต์:
   ```env
   VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5c...
   ```

*(หมายเหตุ: หากยังไม่ได้ใส่ Supabase Key ระบบจะทำงานใน **โหมดจำลอง (Demo Mode / LocalStorage)** ให้อัตโนมัติ เพื่อให้สามารถทดลองใช้งานและทดสอบหน้าตาได้ทันที 100%)*

### 3. เอกสารคู่มือในระบบ
- **คู่มือใช้งาน Git & GitHub ครบทุกกรณี:** เปิดไฟล์ `GIT_MASTER_GUIDE.html` บนเว็บเบราว์เซอร์
- **คู่มือตรวจสอบความปลอดภัยระบบ:** เปิดไฟล์ `SECURITY_AND_GIT_GUIDE.html` บนเว็บเบราว์เซอร์
- **คู่มือติดตั้ง Supabase และ Deploy บน Vercel:** เปิดไฟล์ `DEPLOYMENT_GUIDE.html` บนเว็บเบราว์เซอร์
