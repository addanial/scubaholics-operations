"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Box,
  CalendarRange,
  ClipboardList,
  FileDown,
  Gauge,
  Languages,
  LogOut,
  Menu,
  PackagePlus,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Users,
  Waves,
  Wrench,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";

type Lang = "bm" | "en";
type Tab =
  | "dashboard"
  | "jobs"
  | "equipment"
  | "inventory"
  | "rentals"
  | "users"
  | "profile";
type Profile = {
  id: string;
  full_name: string;
  role: string;
  status: string;
  language: string;
  avatar_path: string | null;
};
type Equipment = {
  id: string;
  code: string;
  name_bm: string;
  name_en: string;
  category: string;
  equipment_type: string | null;
  location: string | null;
  service_interval_days: number;
  serial_no: string | null;
  item_condition: string;
  last_service: string | null;
  active: boolean;
};
type Inventory = {
  id: string;
  sku: string;
  category: string;
  equipment_type: string | null;
  location: string | null;
  name_bm: string;
  name_en: string;
  variant: string | null;
  item_condition: string;
  quantity: number;
  unit: string;
  reorder_level: number;
  serial_no: string | null;
  service_interval_days: number;
};
type Schedule = {
  id: string;
  equipment_key: string;
  name_bm: string;
  name_en: string;
  routine_interval_days: number;
  overall_interval_days: number;
  last_routine_service: string;
  last_overall_service: string;
  active: boolean;
};
type Job = {
  id: string;
  job_no: string;
  equipment_id: string | null;
  equipment_category: string | null;
  inventory_item_id: string | null;
  job_type: string;
  service_date: string;
  work_time: string | null;
  work_done: string;
  fault: string | null;
  remarks: string | null;
  verification_method: string;
  created_at: string;
  equipment?: { name_bm: string; name_en: string } | null;
  inventory_items?: {
    name_bm: string;
    name_en: string;
    variant: string | null;
  } | null;
  profiles?: { full_name: string } | null;
};
type RentalItem = {
  id: string;
  inventory_item_id: string;
  quantity: number;
  condition_out: string;
  condition_in: string | null;
  inventory_items?: Inventory | null;
};
type Rental = {
  id: string;
  rental_no: string;
  customer_name: string;
  customer_phone: string | null;
  rental_date: string;
  expected_return_date: string;
  actual_return_date: string | null;
  status: string;
  total_amount: number;
  deposit_amount: number;
  payment_status: string;
  notes: string | null;
  created_at: string;
  profiles?: { full_name: string } | null;
  rental_items?: RentalItem[];
};

const copy = {
  bm: {
    dashboard: "Papan Pemuka",
    jobs: "Rekod Kerja",
    equipment: "Peralatan",
    inventory: "Inventori",
    rentals: "Penyewaan",
    users: "Pengguna",
    profile: "Profil & PIN",
    logout: "Log Keluar",
    newJob: "Kerja Baharu",
    totalEquipment: "Jenis Peralatan Utama",
    inventoryQty: "Jumlah Unit Keseluruhan",
    inventoryLines: "Variasi Inventori",
    dueSoon: "Hampir Tiba",
    overdue: "Tertunggak",
    recent: "Aktiviti Terkini",
    nextService: "Servis Seterusnya",
    search: "Cari...",
    all: "Semua",
    lowStock: "Stok Rendah",
    category: "Kategori",
    quantity: "Kuantiti",
    condition: "Keadaan",
    adjust: "Laras",
    login: "Log Masuk",
    register: "Daftar Akaun",
    email: "E-mel",
    password: "Kata Laluan",
    fullName: "Nama Penuh",
    firstAccount: "Akaun pertama yang didaftarkan akan menjadi Admin.",
    pending: "Akaun menunggu kelulusan Admin.",
    save: "Simpan",
    cancel: "Batal",
    workDone: "Kerja Dilakukan",
    fault: "Kerosakan / Masalah",
    remarks: "Catatan",
    jobType: "Jenis Kerja",
    date: "Tarikh",
    runningHours: "Masa Kerja Dilaksanakan",
    verification: "Pengesahan",
    signature: "Tandatangan",
    pin: "PIN",
    photos: "Gambar Kerja",
    submit: "Hantar Rekod",
    setPin: "Tetapkan PIN",
    pinHelp: "Gunakan 4 hingga 8 digit. PIN disimpan secara selamat.",
    staff: "Kakitangan",
    status: "Status",
    approve: "Luluskan",
    suspend: "Gantung",
    active: "Aktif",
    loading: "Memuatkan...",
    noData: "Tiada rekod",
    service: "Servis Berkala",
    inspection: "Pemeriksaan",
    repair: "Pembaikan",
    language: "Bahasa",
    welcome: "PENGURUSAN OPERASI PERALATAN & INVENTORI",
    days: "hari",
    clear: "Padam",
    registerNote: "Akaun kakitangan baharu perlu diluluskan oleh Admin.",
    addEquipment: "Tambah Peralatan",
    editEquipment: "Edit Peralatan",
    variant: "Saiz / Status",
    unit: "Unit",
  },
  en: {
    dashboard: "Dashboard",
    jobs: "Job Records",
    equipment: "Equipment",
    inventory: "Inventory",
    rentals: "Rentals",
    users: "Users",
    profile: "Profile & PIN",
    logout: "Log Out",
    newJob: "New Job",
    totalEquipment: "Main Equipment Types",
    inventoryQty: "Total Physical Units",
    inventoryLines: "Inventory Variants",
    dueSoon: "Due Soon",
    overdue: "Overdue",
    recent: "Recent Activity",
    nextService: "Next Service",
    search: "Search...",
    all: "All",
    lowStock: "Low Stock",
    category: "Category",
    quantity: "Quantity",
    condition: "Condition",
    adjust: "Adjust",
    login: "Log In",
    register: "Register Account",
    email: "Email",
    password: "Password",
    fullName: "Full Name",
    firstAccount: "The first registered account becomes Admin.",
    pending: "Account is awaiting Admin approval.",
    save: "Save",
    cancel: "Cancel",
    workDone: "Work Done",
    fault: "Fault / Problem",
    remarks: "Remarks",
    jobType: "Job Type",
    date: "Date",
    runningHours: "Work Performed Time",
    verification: "Verification",
    signature: "Signature",
    pin: "PIN",
    photos: "Work Photos",
    submit: "Submit Record",
    setPin: "Set PIN",
    pinHelp: "Use 4 to 8 digits. PIN is stored securely.",
    staff: "Staff",
    status: "Status",
    approve: "Approve",
    suspend: "Suspend",
    active: "Active",
    loading: "Loading...",
    noData: "No records",
    service: "Scheduled Service",
    inspection: "Inspection",
    repair: "Repair",
    language: "Language",
    welcome: "EQUIPMENT & INVENTORY OPERATIONS MANAGEMENT",
    days: "days",
    clear: "Clear",
    registerNote: "New staff accounts require Admin approval.",
    addEquipment: "Add Equipment",
    editEquipment: "Edit Equipment",
    variant: "Size / Status",
    unit: "Unit",
  },
};

function addDays(date: string | null, days: number) {
  const d = new Date(date || Date.now());
  d.setDate(d.getDate() + days);
  return d;
}
function dayDiff(d: Date) {
  return Math.ceil((d.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
}
function fmtDate(d: string | Date, lang: Lang) {
  return new Intl.DateTimeFormat(lang === "bm" ? "ms-MY" : "en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(d));
}

function profileImageUrl(path?: string | null) {
  if (!path) return "";
  return supabase.storage.from("profile-images").getPublicUrl(path).data
    .publicUrl;
}

function SignaturePad({
  onChange,
  label,
  clearLabel,
}: {
  onChange: (data: string) => void;
  label: string;
  clearLabel: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (e.currentTarget.width / r.width),
      y: (e.clientY - r.top) * (e.currentTarget.height / r.height),
    };
  };
  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    const p = point(e);
    const c = ref.current!.getContext("2d")!;
    c.beginPath();
    c.moveTo(p.x, p.y);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const p = point(e);
    const c = ref.current!.getContext("2d")!;
    c.lineWidth = 3;
    c.lineCap = "round";
    c.strokeStyle = "#081f3d";
    c.lineTo(p.x, p.y);
    c.stroke();
  };
  const end = () => {
    drawing.current = false;
    if (ref.current) onChange(ref.current.toDataURL("image/png"));
  };
  const clear = () => {
    const c = ref.current;
    if (c) {
      c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
      onChange("");
    }
  };
  return (
    <div>
      <label>{label}</label>
      <canvas
        ref={ref}
        width={700}
        height={210}
        className="signature"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      />
      <button type="button" className="text-btn" onClick={clear}>
        {clearLabel}
      </button>
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState<Lang>("bm");
  const t = copy[lang];
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [menu, setMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showJob, setShowJob] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async (userId: string) => {
    setLoading(true);
    const p = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (p.data) {
      setProfile(p.data as Profile);
      setLang((p.data.language || "bm") as Lang);
    }
    if (p.data?.status === "active") {
      const [e, i, j, m, r] = await Promise.all([
        supabase.from("equipment").select("*").order("code"),
        supabase
          .from("inventory_items")
          .select("*")
          .order("category")
          .order("sku"),
        supabase
          .from("service_jobs")
          .select(
            "*,equipment(name_bm,name_en),inventory_items(name_bm,name_en,variant),profiles(full_name)",
          )
          .order("service_date", { ascending: false })
          .limit(100),
        supabase.from("maintenance_schedules").select("*").eq("active", true),
        supabase
          .from("rentals")
          .select("*,profiles(full_name),rental_items(*,inventory_items(*))")
          .order("rental_date", { ascending: false }),
      ]);
      setEquipment((e.data || []) as Equipment[]);
      setInventory((i.data || []) as Inventory[]);
      setJobs((j.data || []) as Job[]);
      setSchedules((m.data || []) as Schedule[]);
      setRentals((r.data || []) as Rental[]);
      if (p.data.role === "admin") {
        const u = await supabase
          .from("profiles")
          .select("*")
          .order("created_at");
        setProfiles((u.data || []) as Profile[]);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) load(data.session.user.id);
      else setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) load(s.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [load]);

  const due = useMemo(
    () =>
      schedules.map((s) => ({
        ...s,
        routineDue: addDays(s.last_routine_service, s.routine_interval_days),
        overallDue: addDays(s.last_overall_service, s.overall_interval_days),
        routineDays: dayDiff(
          addDays(s.last_routine_service, s.routine_interval_days),
        ),
        overallDays: dayDiff(
          addDays(s.last_overall_service, s.overall_interval_days),
        ),
      })),
    [schedules],
  );
  const low = inventory.filter((i) => i.quantity <= i.reorder_level);
  const totalQty = inventory.reduce((a, b) => a + b.quantity, 0);
  const refresh = () => session && load(session.user.id);
  if (loading)
    return (
      <div className="splash">
        <Waves size={42} />
        <strong>SCUBAHOLICS</strong>
        <span>{t.loading}</span>
      </div>
    );
  if (!session) return <Auth lang={lang} setLang={setLang} />;
  if (profile?.status !== "active")
    return (
      <div className="auth-shell">
        <div className="auth-card center">
          <Brand />
          <ShieldCheck size={48} />
          <h2>{t.pending}</h2>
          <p>{t.registerNote}</p>
          <button onClick={() => supabase.auth.signOut()}>{t.logout}</button>
        </div>
      </div>
    );

  const nav: [Tab, React.ReactNode, string][] = [
    ["dashboard", <Gauge key="g" />, t.dashboard],
    ["jobs", <ClipboardList key="j" />, t.jobs],
    ["equipment", <Wrench key="e" />, t.equipment],
    ["inventory", <Box key="i" />, t.inventory],
    ["rentals", <CalendarRange key="r" />, t.rentals],
    ...(profile.role === "admin"
      ? [
          ["users" as Tab, <Users key="u" />, t.users] as [
            Tab,
            React.ReactNode,
            string,
          ],
        ]
      : []),
    ["profile", <Settings key="p" />, t.profile],
  ];
  return (
    <div className="app-shell">
      <aside className={menu ? "sidebar open" : "sidebar"}>
        <div className="mobile-close" onClick={() => setMenu(false)}>
          <X />
        </div>
        <Brand />
        <nav>
          {nav.map(([id, icon, label]) => (
            <button
              key={id}
              className={tab === id ? "nav active" : "nav"}
              onClick={() => {
                setTab(id);
                setMenu(false);
              }}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="avatar">
            {profile.avatar_path ? (
              <img
                src={profileImageUrl(profile.avatar_path)}
                alt={profile.full_name}
              />
            ) : (
              profile.full_name?.[0]?.toUpperCase() || "S"
            )}
          </div>
          <div>
            <strong>{profile.full_name}</strong>
            <small>{profile.role}</small>
          </div>
          <button
            className="icon-btn"
            title={t.logout}
            onClick={() => supabase.auth.signOut()}
          >
            <LogOut />
          </button>
        </div>
      </aside>
      {menu && <div className="scrim" onClick={() => setMenu(false)} />}
      <main>
        <header>
          <button className="menu-btn" onClick={() => setMenu(true)}>
            <Menu />
          </button>
          <div>
            <h1>{nav.find((n) => n[0] === tab)?.[2]}</h1>
            <p>SCUBAHOLICS SDN BHD</p>
          </div>
          <div className="header-actions">
            <button
              className="lang"
              onClick={() => setLang(lang === "bm" ? "en" : "bm")}
            >
              <Languages /> {lang === "bm" ? "EN" : "BM"}
            </button>
            {profile.role !== "auditor" && (
              <button className="primary" onClick={() => setShowJob(true)}>
                <Plus />
                {t.newJob}
              </button>
            )}
          </div>
        </header>
        {notice && (
          <div className="notice" onClick={() => setNotice("")}>
            {notice}
          </div>
        )}
        {tab === "dashboard" && (
          <Dashboard
            t={t}
            lang={lang}
            equipment={equipment}
            inventory={inventory}
            jobs={jobs}
            due={due}
            totalQty={totalQty}
          />
        )}
        {tab === "equipment" && (
          <EquipmentView
            t={t}
            lang={lang}
            equipment={equipment}
            inventory={inventory}
            profile={profile}
            refresh={refresh}
            setNotice={setNotice}
          />
        )}
        {tab === "inventory" && (
          <InventoryView
            t={t}
            lang={lang}
            items={inventory}
            low={low}
            profile={profile}
            refresh={refresh}
            setNotice={setNotice}
          />
        )}
        {tab === "jobs" && <JobsView t={t} lang={lang} jobs={jobs} />}
        {tab === "rentals" && (
          <RentalsView
            t={t}
            lang={lang}
            rentals={rentals}
            inventory={inventory}
            profile={profile}
            user={session.user}
            refresh={refresh}
            setNotice={setNotice}
          />
        )}
        {tab === "users" && profile.role === "admin" && (
          <UsersView
            t={t}
            lang={lang}
            users={profiles}
            currentUser={profile}
            refresh={refresh}
            setNotice={setNotice}
          />
        )}
        {tab === "profile" && (
          <ProfileView
            t={t}
            lang={lang}
            profile={profile}
            refresh={refresh}
            setNotice={setNotice}
          />
        )}
      </main>
      {showJob && (
        <JobModalAll
          t={t}
          lang={lang}
          schedules={schedules}
          equipment={equipment}
          inventory={inventory}
          user={session.user}
          close={() => setShowJob(false)}
          done={() => {
            setShowJob(false);
            refresh();
            setNotice(
              lang === "bm"
                ? "Rekod kerja berjaya disimpan."
                : "Job record saved.",
            );
          }}
        />
      )}
    </div>
  );
}

function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark">
        <Waves />
      </div>
      <div>
        <strong>SCUBAHOLICS</strong>
        <small>Operations</small>
      </div>
    </div>
  );
}

function Auth({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const t = copy[lang];
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const r =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: name } },
          });
    if (r.error) setMsg(r.error.message);
    else if (mode === "register" && !r.data.session)
      setMsg(
        lang === "bm"
          ? "Semak e-mel untuk pengesahan, kemudian log masuk."
          : "Check your email to confirm, then log in.",
      );
    setBusy(false);
  }
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-top">
          <Brand />
          <button
            className="lang"
            onClick={() => setLang(lang === "bm" ? "en" : "bm")}
          >
            <Languages /> {lang === "bm" ? "EN" : "BM"}
          </button>
        </div>
        <div className="auth-hero">
          <span>SCUBAHOLICS SDN BHD</span>
          <h1>{t.welcome}</h1>
        </div>
        <div className="segmented">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
          >
            {t.login}
          </button>
          <button
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
          >
            {t.register}
          </button>
        </div>
        <form onSubmit={submit}>
          {mode === "register" && (
            <label>
              {t.fullName}
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          )}
          <label>
            {t.email}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            {t.password}
            <input
              type="password"
              minLength={6}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {msg && <div className="form-msg">{msg}</div>}
          <button className="primary full" disabled={busy}>
            {busy ? t.loading : mode === "login" ? t.login : t.register}
          </button>
        </form>
        <p className="hint">
          {mode === "register" ? t.firstAccount : t.registerNote}
        </p>
      </div>
    </div>
  );
}

function Dashboard({
  t,
  lang,
  equipment,
  inventory,
  jobs,
  due,
  totalQty,
}: any) {
  const overdue = due.filter(
    (e: any) => Math.min(e.routineDays, e.overallDays) < 0,
  ).length;
  const soon = due.filter((e: any) => {
    const d = Math.min(e.routineDays, e.overallDays);
    return d >= 0 && d <= 7;
  }).length;
  const equipmentTypes = new Set([
    ...equipment.map((e: any) => e.category.toLowerCase()),
    ...inventory.map((i: any) => i.category.toLowerCase()),
  ]).size;
  const totalPhysicalUnits = equipment.length + totalQty;
  const cards = [
    [t.totalEquipment, equipmentTypes, <Wrench key="w" />],
    [t.inventoryQty, totalPhysicalUnits, <Box key="b" />],
    [t.inventoryLines, inventory.length, <PackagePlus key="p" />],
    [t.dueSoon, soon, <Activity key="a" />],
    [t.overdue, overdue, <ShieldCheck key="s" />],
  ];
  return (
    <section>
      <div className="welcome">
        <div>
          <span>SCUBAHOLICS OPERATIONS</span>
          <h2>{t.welcome}</h2>
        </div>
        <Waves />
      </div>
      <div className="stats">
        {cards.map((c: any, i: number) => (
          <div className="stat" key={i}>
            <div>
              <small>{c[0]}</small>
              <strong>{c[1]}</strong>
            </div>
            {c[2]}
          </div>
        ))}
      </div>
      <div className="two-col">
        <div className="panel">
          <div className="panel-title">
            <h3>
              {t.nextService} ·{" "}
              {lang === "bm" ? "11 Peralatan" : "11 Equipment Types"}
            </h3>
          </div>
          <div className="list maintenance-list">
            {due.map((e: any) => {
              const days = Math.min(e.routineDays, e.overallDays);
              return (
                <div className="list-row" key={e.id}>
                  <div>
                    <strong>{lang === "bm" ? e.name_bm : e.name_en}</strong>
                    <small>
                      {lang === "bm" ? "Rutin 14 hari" : "14-day routine"}:{" "}
                      {fmtDate(e.routineDue, lang)}
                    </small>
                    <small>
                      {lang === "bm" ? "Menyeluruh 30 hari" : "30-day overall"}:{" "}
                      {fmtDate(e.overallDue, lang)}
                    </small>
                  </div>
                  <span
                    className={
                      days < 0
                        ? "badge danger"
                        : days <= 7
                          ? "badge warn"
                          : "badge ok"
                    }
                  >
                    {days < 0 ? t.overdue : days <= 7 ? t.dueSoon : t.active}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">
            <h3>{t.recent}</h3>
          </div>
          <div className="list">
            {jobs.slice(0, 6).map((j: any) => (
              <div className="list-row" key={j.id}>
                <div>
                  <strong>
                    {j.job_no} ·{" "}
                    {j.equipment
                      ? lang === "bm"
                        ? j.equipment.name_bm
                        : j.equipment.name_en
                      : j.inventory_items
                        ? `${lang === "bm" ? j.inventory_items.name_bm : j.inventory_items.name_en}${j.inventory_items.variant ? ` · ${j.inventory_items.variant}` : ""}`
                        : j.equipment_category || j.job_type}
                  </strong>
                  <small>
                    {j.profiles?.full_name || "Staff"} ·{" "}
                    {fmtDate(j.service_date, lang)}
                  </small>
                </div>
                <span className="badge">{j.verification_method}</span>
              </div>
            ))}
            {!jobs.length && <div className="empty">{t.noData}</div>}
          </div>
        </div>
      </div>
    </section>
  );
}

function EquipmentView({
  t,
  lang,
  equipment,
  inventory,
  profile,
  refresh,
  setNotice,
}: any) {
  const [editor, setEditor] = useState<any>(null);
  const order = [
    "compressor",
    "genset",
    "tank",
    "fins",
    "wetsuit",
    "regulator",
    "bcd",
    "belt",
    "weight",
    "mask",
    "snorkel",
  ];
  const groups: any[] = [];
  for (const cat of ["compressor", "genset"]) {
    const rows = equipment.filter((e: any) => e.category === cat);
    groups.push({
      key: cat,
      name: cat === "compressor" ? "Compressor" : "Genset",
      total: rows.length,
      unit: "unit",
      kind: "service",
      rows,
    });
  }
  for (const cat of order.slice(2)) {
    const rows = inventory.filter((i: any) => i.category.toLowerCase() === cat);
    if (rows.length)
      groups.push({
        key: cat,
        name: rows[0].category,
        total: rows.reduce((a: number, b: any) => a + b.quantity, 0),
        unit: rows[0].unit,
        kind: "inventory",
        rows,
      });
  }
  groups.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  return (
    <section>
      <div className="toolbar">
        <div>
          <strong>
            {lang === "bm"
              ? "11 JENIS PERALATAN UTAMA"
              : "11 MAIN EQUIPMENT TYPES"}
          </strong>
          <small className="block-muted">
            {lang === "bm"
              ? "Saiz dan status dipaparkan sebagai variasi."
              : "Sizes and statuses are shown as variants."}
          </small>
        </div>
        {profile.role === "admin" && (
          <button
            className="primary"
            onClick={() => setEditor({ mode: "add" })}
          >
            <Plus />
            {t.addEquipment}
          </button>
        )}
      </div>
      <div className="equipment-groups">
        {groups.map((g: any, index: number) => (
          <article className="equipment-group" key={g.key}>
            <div className="group-top">
              <div className="group-index">{index + 1}</div>
              <div>
                <span className="eyebrow">
                  {g.kind === "service"
                    ? lang === "bm"
                      ? "Mesin Servis"
                      : "Service Machine"
                    : lang === "bm"
                      ? "Inventori"
                      : "Inventory"}
                </span>
                <h3>{g.name}</h3>
              </div>
              <strong className="group-total">
                {g.total}{" "}
                <small>
                  {g.unit === "pair"
                    ? lang === "bm"
                      ? "pasangan"
                      : "pairs"
                    : lang === "bm"
                      ? "unit"
                      : "units"}
                </small>
              </strong>
            </div>
            <div className="variant-list">
              {g.rows.map((r: any) => (
                <div key={r.id}>
                  <span>
                    {g.kind === "service"
                      ? lang === "bm"
                        ? r.name_bm
                        : r.name_en
                      : r.variant || g.name}
                  </span>
                  <strong>
                    {g.kind === "service"
                      ? r.code
                      : `${r.quantity} ${r.unit === "pair" ? (lang === "bm" ? "pasangan" : "pairs") : lang === "bm" ? "unit" : "units"}`}
                  </strong>
                </div>
              ))}
            </div>
            {profile.role === "admin" && (
              <button
                className="edit-group"
                onClick={() => setEditor({ ...g, mode: "edit" })}
              >
                {t.editEquipment}
              </button>
            )}
          </article>
        ))}
      </div>
      {editor && (
        <EquipmentEditor
          t={t}
          lang={lang}
          data={editor}
          close={() => setEditor(null)}
          done={() => {
            setEditor(null);
            refresh();
            setNotice(
              lang === "bm"
                ? "Peralatan berjaya dikemas kini."
                : "Equipment updated successfully.",
            );
          }}
        />
      )}
    </section>
  );
}

function EquipmentEditor({ t, lang, data, close, done }: any) {
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<any[]>(
    data.rows ? data.rows.map((r: any) => ({ ...r })) : [],
  );
  const [type, setType] = useState("inventory");
  const [form, setForm] = useState({
    category: "",
    equipment_type: "Dive Equipment",
    location: "Dive Centre Jetty",
    variant: "",
    quantity: "1",
    unit: "unit",
    sku: "",
    condition: "in_service",
    code: "",
    interval: "14",
    serial_no: "",
  });
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });
  const rowSet = (index: number, k: string, v: any) =>
    setRows(rows.map((r, i) => (i === index ? { ...r, [k]: v } : r)));
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (data.mode === "edit") {
        for (const r of rows) {
          if (data.kind === "service") {
            const { error } = await supabase
              .from("equipment")
              .update({
                code: r.code,
                serial_no: r.serial_no || null,
                service_interval_days: Number(r.service_interval_days),
                item_condition: r.item_condition,
                updated_at: new Date().toISOString(),
              })
              .eq("id", r.id);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from("inventory_items")
              .update({
                variant: r.variant || null,
                quantity: Number(r.quantity),
                unit: r.unit,
                serial_no: r.serial_no || null,
                service_interval_days: Number(r.service_interval_days),
                item_condition: r.item_condition,
                updated_at: new Date().toISOString(),
              })
              .eq("id", r.id);
            if (error) throw error;
          }
        }
      } else if (type === "service") {
        const category = form.category.toLowerCase();
        const { error } = await supabase.from("equipment").insert({
          code: form.code,
          name_bm: form.category,
          name_en: form.category,
          category,
          equipment_type: form.equipment_type,
          location: form.location,
          service_interval_days: Number(form.interval),
          serial_no: form.serial_no || null,
          item_condition: form.condition,
          last_service: new Date().toISOString().slice(0, 10),
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("inventory_items").insert({
          sku: form.sku.toUpperCase(),
          category: form.category,
          name_bm: form.category,
          name_en: form.category,
          equipment_type: form.equipment_type,
          location: form.location,
          variant: form.variant || null,
          quantity: Number(form.quantity),
          unit: form.unit,
          item_condition: form.condition,
          serial_no: form.serial_no || null,
          service_interval_days: Number(form.interval),
          reorder_level: 0,
        });
        if (error) throw error;
      }
      done();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="modal-backdrop">
      <div className="modal equipment-editor">
        <div className="modal-head">
          <div>
            <span>ADMIN</span>
            <h2>{data.mode === "add" ? t.addEquipment : t.editEquipment}</h2>
          </div>
          <button className="icon-btn" onClick={close}>
            <X />
          </button>
        </div>
        <form onSubmit={save}>
          {data.mode === "add" ? (
            <>
              <div className="segmented">
                <button
                  type="button"
                  className={type === "inventory" ? "active" : ""}
                  onClick={() => setType("inventory")}
                >
                  {lang === "bm" ? "Inventori" : "Inventory"}
                </button>
                <button
                  type="button"
                  className={type === "service" ? "active" : ""}
                  onClick={() => setType("service")}
                >
                  {lang === "bm" ? "Mesin Servis" : "Service Machine"}
                </button>
              </div>
              <div className="form-grid">
                <label>
                  {lang === "bm" ? "Nama Peralatan" : "Equipment Name"}
                  <input
                    required
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                    placeholder={
                      type === "service" ? "compressor / genset" : "e.g. Torch"
                    }
                  />
                </label>
                <label>
                  SKU / Code
                  <input
                    required
                    value={type === "service" ? form.code : form.sku}
                    onChange={(e) =>
                      set(type === "service" ? "code" : "sku", e.target.value)
                    }
                  />
                </label>
                <label>
                  {lang === "bm" ? "Jenis Peralatan" : "Equipment Type"}
                  <select
                    required
                    value={form.equipment_type}
                    onChange={(e) => set("equipment_type", e.target.value)}
                  >
                    <option value="Transport">Transport</option>
                    <option value="Dive Equipment">Dive Equipment</option>
                    <option value="Office Equipment">Office Equipment</option>
                    <option value="Other Equipment">Other Equipment</option>
                  </select>
                </label>
                <label>
                  {lang === "bm" ? "Lokasi" : "Location"}
                  <select
                    required
                    value={form.location}
                    onChange={(e) => set("location", e.target.value)}
                  >
                    <option value="Dive Centre Jetty">Dive Centre Jetty</option>
                    <option value="HSR">HSR</option>
                    <option value="Land Office">Land Office</option>
                  </select>
                </label>
                {type === "inventory" ? (
                  <>
                    <label>
                      {t.variant}
                      <input
                        value={form.variant}
                        onChange={(e) => set("variant", e.target.value)}
                      />
                    </label>
                    <label>
                      {t.quantity}
                      <input
                        type="number"
                        min="0"
                        required
                        value={form.quantity}
                        onChange={(e) => set("quantity", e.target.value)}
                      />
                    </label>
                    <label>
                      {t.unit}
                      <select
                        value={form.unit}
                        onChange={(e) => set("unit", e.target.value)}
                      >
                        <option value="unit">unit</option>
                        <option value="pair">pair</option>
                      </select>
                    </label>
                    <label>
                      {t.condition}
                      <select
                        value={form.condition}
                        onChange={(e) => set("condition", e.target.value)}
                      >
                        <option value="new">new</option>
                        <option value="in_service">in service</option>
                        <option value="old">old</option>
                        <option value="repair">repair</option>
                      </select>
                    </label>
                    <label>
                      No. Siri
                      <input
                        value={form.serial_no}
                        onChange={(e) => set("serial_no", e.target.value)}
                      />
                    </label>
                    <label>
                      {lang === "bm" ? "Servis (hari)" : "Service (days)"}
                      <input
                        type="number"
                        min="1"
                        required
                        value={form.interval}
                        onChange={(e) => set("interval", e.target.value)}
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label>
                      No. Siri
                      <input
                        value={form.serial_no}
                        onChange={(e) => set("serial_no", e.target.value)}
                      />
                    </label>
                    <label>
                      {lang === "bm"
                        ? "Tempoh Servis (hari)"
                        : "Service Interval (days)"}
                      <input
                        type="number"
                        min="1"
                        required
                        value={form.interval}
                        onChange={(e) => set("interval", e.target.value)}
                      />
                    </label>
                    <label>
                      {t.condition}
                      <select
                        value={form.condition}
                        onChange={(e) => set("condition", e.target.value)}
                      >
                        <option value="new">new</option>
                        <option value="in_service">in service</option>
                        <option value="old">old</option>
                        <option value="repair">repair</option>
                      </select>
                    </label>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="editable-rows">
              {rows.map((r: any, index: number) => (
                <div className="editable-row" key={r.id}>
                  {data.kind === "service" ? (
                    <>
                      <label>
                        Code
                        <input
                          value={r.code}
                          onChange={(e) =>
                            rowSet(index, "code", e.target.value)
                          }
                        />
                      </label>
                      <label>
                        No. Siri
                        <input
                          value={r.serial_no || ""}
                          onChange={(e) =>
                            rowSet(index, "serial_no", e.target.value)
                          }
                        />
                      </label>
                      <label>
                        {t.condition}
                        <select
                          value={r.item_condition}
                          onChange={(e) =>
                            rowSet(index, "item_condition", e.target.value)
                          }
                        >
                          <option value="new">new</option>
                          <option value="in_service">in service</option>
                          <option value="old">old</option>
                          <option value="repair">repair</option>
                          <option value="retired">retired</option>
                        </select>
                      </label>
                      <label>
                        {lang === "bm" ? "Servis (hari)" : "Service (days)"}
                        <input
                          type="number"
                          min="1"
                          value={r.service_interval_days}
                          onChange={(e) =>
                            rowSet(
                              index,
                              "service_interval_days",
                              e.target.value,
                            )
                          }
                        />
                      </label>
                    </>
                  ) : (
                    <>
                      <label>
                        {t.variant}
                        <input
                          value={r.variant || ""}
                          onChange={(e) =>
                            rowSet(index, "variant", e.target.value)
                          }
                        />
                      </label>
                      <label>
                        {t.quantity}
                        <input
                          type="number"
                          min="0"
                          value={r.quantity}
                          onChange={(e) =>
                            rowSet(index, "quantity", e.target.value)
                          }
                        />
                      </label>
                      <label>
                        No. Siri
                        <input
                          value={r.serial_no || ""}
                          onChange={(e) =>
                            rowSet(index, "serial_no", e.target.value)
                          }
                        />
                      </label>
                      <label>
                        {lang === "bm" ? "Servis (hari)" : "Service (days)"}
                        <input
                          type="number"
                          min="1"
                          value={r.service_interval_days}
                          onChange={(e) =>
                            rowSet(
                              index,
                              "service_interval_days",
                              e.target.value,
                            )
                          }
                        />
                      </label>
                      <label>
                        {t.condition}
                        <select
                          value={r.item_condition}
                          onChange={(e) =>
                            rowSet(index, "item_condition", e.target.value)
                          }
                        >
                          <option value="new">new</option>
                          <option value="in_service">in service</option>
                          <option value="old">old</option>
                          <option value="repair">repair</option>
                          <option value="retired">retired</option>
                        </select>
                      </label>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={close}>
              {t.cancel}
            </button>
            <button className="primary" disabled={busy}>
              {busy ? t.loading : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InventoryView({
  t,
  lang,
  items,
  low,
  profile,
  refresh,
  setNotice,
}: any) {
  const [q, setQ] = useState("");
  const filtered = items.filter((i: any) =>
    (i.sku + " " + i.name_bm + " " + i.name_en + " " + (i.variant || ""))
      .toLowerCase()
      .includes(q.toLowerCase()),
  );
  async function adjust(i: any) {
    const raw = prompt(
      lang === "bm"
        ? `Kuantiti baharu untuk ${i.name_bm}:`
        : `New quantity for ${i.name_en}:`,
      String(i.quantity),
    );
    if (raw === null) return;
    const qty = Number(raw);
    if (!Number.isInteger(qty) || qty < 0) return alert("Invalid quantity");
    const { error } = await supabase
      .from("inventory_items")
      .update({ quantity: qty, updated_at: new Date().toISOString() })
      .eq("id", i.id);
    if (error) return alert(error.message);
    await supabase.from("stock_movements").insert({
      inventory_item_id: i.id,
      movement_type: "adjustment",
      quantity: Math.abs(qty - i.quantity) || 1,
      reason: `Adjusted ${i.quantity} to ${qty}`,
      created_by: profile.id,
    });
    setNotice(
      lang === "bm"
        ? "Kuantiti inventori dikemas kini."
        : "Inventory quantity updated.",
    );
    refresh();
  }
  return (
    <section>
      <div className="toolbar">
        <div className="search">
          <Search />
          <input
            placeholder={t.search}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <span className="badge warn">
          {t.lowStock}: {low.length}
        </span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>{t.category}</th>
              <th>{lang === "bm" ? "Item" : "Item"}</th>
              <th>Variant</th>
              <th>{t.condition}</th>
              <th>{t.quantity}</th>
              {profile.role === "admin" && <th />}
            </tr>
          </thead>
          <tbody>
            {filtered.map((i: any) => (
              <tr key={i.id}>
                <td>
                  <code>{i.sku}</code>
                </td>
                <td>{i.category}</td>
                <td>
                  <strong>{lang === "bm" ? i.name_bm : i.name_en}</strong>
                </td>
                <td>{i.variant || "—"}</td>
                <td>
                  <span className="badge">{i.item_condition}</span>
                </td>
                <td
                  className={i.quantity <= i.reorder_level ? "qty low" : "qty"}
                >
                  {i.quantity} {i.unit}
                </td>
                {profile.role === "admin" && (
                  <td>
                    <button className="text-btn" onClick={() => adjust(i)}>
                      {t.adjust}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function jobEquipmentName(job: Job, lang: Lang) {
  if (job.equipment) {
    return lang === "bm" ? job.equipment.name_bm : job.equipment.name_en;
  }
  if (job.inventory_items) {
    const name =
      lang === "bm" ? job.inventory_items.name_bm : job.inventory_items.name_en;
    return `${name}${job.inventory_items.variant ? ` - ${job.inventory_items.variant}` : ""}`;
  }
  return job.equipment_category || job.job_type || "-";
}

async function printWorkRecords(records: Job[], lang: Lang) {
  if (!records.length) return;

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 17;

  const addHeader = () => {
    doc.setTextColor(10, 64, 92);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("SCUBAHOLICS SDN BHD", margin, y);
    y += 7;
    doc.setFontSize(12);
    doc.text("REKOD KERJA / JOB RECORDS", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(90, 105, 115);
    doc.text(
      `${lang === "bm" ? "Dijana" : "Generated"}: ${new Date().toLocaleString(lang === "bm" ? "ms-MY" : "en-GB")}`,
      margin,
      y,
    );
    y += 7;
    doc.setDrawColor(190, 205, 214);
    doc.line(margin, y, pageWidth - margin, y);
    y += 7;
  };

  const ensureSpace = (needed: number) => {
    if (y + needed <= pageHeight - 15) return;
    doc.addPage();
    y = 17;
    addHeader();
  };

  const field = (label: string, value: string | null | undefined) => {
    const text = `${label}: ${value || "-"}`;
    const lines = doc.splitTextToSize(text, contentWidth - 4);
    ensureSpace(lines.length * 4.5 + 1);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(35, 50, 60);
    doc.text(lines, margin + 2, y);
    y += lines.length * 4.5 + 1;
  };

  addHeader();
  records.forEach((job, index) => {
    ensureSpace(55);
    doc.setFillColor(237, 245, 248);
    doc.roundedRect(margin, y - 4, contentWidth, 8, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(10, 64, 92);
    doc.text(`${index + 1}. ${job.job_no}`, margin + 2, y + 1);
    y += 8;
    field(
      lang === "bm" ? "Peralatan" : "Equipment",
      jobEquipmentName(job, lang),
    );
    field(
      lang === "bm" ? "Tarikh servis" : "Service date",
      fmtDate(job.service_date, lang),
    );
    field(
      lang === "bm" ? "Masa kerja dilaksanakan" : "Work performed time",
      job.work_time
        ? new Date(`2000-01-01T${job.work_time}`).toLocaleTimeString(
            lang === "bm" ? "ms-MY" : "en-US",
            { hour: "numeric", minute: "2-digit", hour12: true },
          )
        : null,
    );
    field(lang === "bm" ? "Jenis kerja" : "Job type", job.job_type);
    field(lang === "bm" ? "Staf" : "Staff", job.profiles?.full_name || "Staff");
    field(
      lang === "bm" ? "Kaedah pengesahan" : "Verification",
      job.verification_method,
    );
    field(lang === "bm" ? "Kerosakan" : "Fault", job.fault);
    field(lang === "bm" ? "Kerja dilakukan" : "Work done", job.work_done);
    field(lang === "bm" ? "Catatan" : "Remarks", job.remarks);
    y += 5;
  });

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(110, 120, 128);
    doc.text(`${page} / ${pages}`, pageWidth - margin, pageHeight - 8, {
      align: "right",
    });
  }

  const suffix =
    records.length === 1
      ? records[0].job_no.replace(/[^a-zA-Z0-9_-]/g, "-")
      : new Date().toISOString().slice(0, 10);
  doc.save(`SCUBAHOLICS-Rekod-Kerja-${suffix}.pdf`);
}

function JobsView({ t, lang, jobs }: any) {
  const [q, setQ] = useState("");
  const rows = jobs.filter((j: any) =>
    (j.job_no + " " + j.work_done + " " + (j.fault || ""))
      .toLowerCase()
      .includes(q.toLowerCase()),
  );
  return (
    <section>
      <div className="toolbar">
        <div className="search">
          <Search />
          <input
            placeholder={t.search}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <button
          className="primary"
          onClick={() => printWorkRecords(rows, lang)}
          disabled={!rows.length}
        >
          <FileDown size={17} />
          {lang === "bm" ? "Cetak Rekod Kerja" : "Print Job Records"}
        </button>
      </div>
      <div className="job-grid">
        {rows.map((j: any) => (
          <article className="job-card" key={j.id}>
            <div className="job-head">
              <span>{j.job_no}</span>
              <div className="job-actions">
                <span className="badge">{j.verification_method}</span>
                <button
                  className="text-btn pdf-record-btn"
                  onClick={() => printWorkRecords([j], lang)}
                  title={
                    lang === "bm" ? "Cetak rekod ini" : "Print this record"
                  }
                >
                  <FileDown size={15} /> PDF
                </button>
              </div>
            </div>
            <h3>
              {j.equipment
                ? lang === "bm"
                  ? j.equipment.name_bm
                  : j.equipment.name_en
                : j.inventory_items
                  ? `${lang === "bm" ? j.inventory_items.name_bm : j.inventory_items.name_en}${j.inventory_items.variant ? ` · ${j.inventory_items.variant}` : ""}`
                  : j.equipment_category || j.job_type}
            </h3>
            <p>{j.work_done}</p>
            {j.fault && (
              <small>
                {t.fault}: {j.fault}
              </small>
            )}
            <footer>
              <span>{j.profiles?.full_name || "Staff"}</span>
              <span>{fmtDate(j.service_date, lang)}</span>
            </footer>
          </article>
        ))}
        {!rows.length && <div className="empty panel">{t.noData}</div>}
      </div>
    </section>
  );
}

async function printRentalRecords(records: Rental[], lang: Lang) {
  if (!records.length) return;
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = 16;
  const header = () => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(10, 64, 92);
    doc.setFontSize(16);
    doc.text("SCUBAHOLICS SDN BHD", margin, y);
    y += 7;
    doc.setFontSize(12);
    doc.text("REKOD PENYEWAAN / RENTAL RECORDS", margin, y);
    y += 7;
    doc.setDrawColor(190, 205, 214);
    doc.line(margin, y, width - margin, y);
    y += 7;
  };
  const space = (amount: number) => {
    if (y + amount < height - 14) return;
    doc.addPage();
    y = 16;
    header();
  };
  const row = (label: string, value: string) => {
    const lines = doc.splitTextToSize(
      `${label}: ${value || "-"}`,
      width - margin * 2 - 4,
    );
    space(lines.length * 4.4 + 1);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(35, 50, 60);
    doc.text(lines, margin + 2, y);
    y += lines.length * 4.4 + 1;
  };
  header();
  records.forEach((rental, index) => {
    space(58);
    doc.setFillColor(237, 245, 248);
    doc.roundedRect(margin, y - 4, width - margin * 2, 8, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(10, 64, 92);
    doc.text(`${index + 1}. ${rental.rental_no}`, margin + 2, y + 1);
    y += 8;
    row(lang === "bm" ? "Pelanggan" : "Customer", rental.customer_name);
    row(lang === "bm" ? "Telefon" : "Phone", rental.customer_phone || "-");
    row(
      lang === "bm" ? "Tarikh keluar" : "Rental date",
      fmtDate(rental.rental_date, lang),
    );
    row(
      lang === "bm" ? "Jangka pulang" : "Expected return",
      fmtDate(rental.expected_return_date, lang),
    );
    row(lang === "bm" ? "Status" : "Status", rental.status.toUpperCase());
    row(
      lang === "bm" ? "Peralatan" : "Equipment",
      (rental.rental_items || [])
        .map((item) => {
          const inv = item.inventory_items;
          const name = inv
            ? lang === "bm"
              ? inv.name_bm
              : inv.name_en
            : "Item";
          return `${name}${inv?.variant ? ` (${inv.variant})` : ""} x ${item.quantity}`;
        })
        .join(", "),
    );
    row(
      lang === "bm" ? "Jumlah" : "Total",
      `RM ${Number(rental.total_amount).toFixed(2)}`,
    );
    row(
      lang === "bm" ? "Deposit" : "Deposit",
      `RM ${Number(rental.deposit_amount).toFixed(2)}`,
    );
    row(
      lang === "bm" ? "Bayaran" : "Payment",
      rental.payment_status.toUpperCase(),
    );
    row(lang === "bm" ? "Catatan" : "Notes", rental.notes || "-");
    y += 5;
  });
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(110, 120, 128);
    doc.text(`${page} / ${pages}`, width - margin, height - 7, {
      align: "right",
    });
  }
  const suffix =
    records.length === 1
      ? records[0].rental_no
      : new Date().toISOString().slice(0, 10);
  doc.save(`SCUBAHOLICS-Rekod-Penyewaan-${suffix}.pdf`);
}

function RentalsView({
  t,
  lang,
  rentals,
  inventory,
  profile,
  user,
  refresh,
  setNotice,
}: any) {
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const rows = (rentals as Rental[]).filter((r) =>
    `${r.rental_no} ${r.customer_name} ${r.customer_phone || ""}`
      .toLowerCase()
      .includes(q.toLowerCase()),
  );
  async function markReturned(rental: Rental) {
    if (
      !confirm(
        lang === "bm"
          ? "Sahkan semua peralatan telah dipulangkan?"
          : "Confirm all equipment has been returned?",
      )
    )
      return;
    const { error } = await supabase
      .from("rentals")
      .update({
        status: "returned",
        actual_return_date: new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      })
      .eq("id", rental.id);
    if (error) return alert(error.message);
    setNotice(
      lang === "bm" ? "Pemulangan berjaya direkodkan." : "Return recorded.",
    );
    refresh();
  }
  return (
    <section>
      <div className="toolbar rental-toolbar">
        <div className="search">
          <Search />
          <input
            placeholder={t.search}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="toolbar-buttons">
          <button
            className="secondary"
            disabled={!rows.length}
            onClick={() => printRentalRecords(rows, lang)}
          >
            <FileDown size={17} />{" "}
            {lang === "bm" ? "Cetak Rekod Penyewaan" : "Print Rental Records"}
          </button>
          {profile.role !== "auditor" && (
            <button className="primary" onClick={() => setShowAdd(true)}>
              <Plus size={17} />{" "}
              {lang === "bm" ? "Penyewaan Baharu" : "New Rental"}
            </button>
          )}
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{lang === "bm" ? "No. Sewaan" : "Rental No."}</th>
              <th>{lang === "bm" ? "Pelanggan" : "Customer"}</th>
              <th>{lang === "bm" ? "Peralatan" : "Equipment"}</th>
              <th>{lang === "bm" ? "Keluar / Pulang" : "Out / Return"}</th>
              <th>Status</th>
              <th>{lang === "bm" ? "Jumlah" : "Total"}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <strong>{r.rental_no}</strong>
                </td>
                <td>
                  {r.customer_name}
                  <small className="block-muted">
                    {r.customer_phone || "-"}
                  </small>
                </td>
                <td>
                  {(r.rental_items || [])
                    .map(
                      (item) =>
                        `${item.inventory_items?.name_bm || "Item"}${item.inventory_items?.variant ? ` ${item.inventory_items.variant}` : ""} x${item.quantity}`,
                    )
                    .join(", ")}
                </td>
                <td>
                  {fmtDate(r.rental_date, lang)}
                  <small className="block-muted">
                    {fmtDate(r.expected_return_date, lang)}
                  </small>
                </td>
                <td>
                  <span
                    className={`badge ${r.status === "returned" ? "ok" : new Date(r.expected_return_date) < new Date() ? "danger" : "warn"}`}
                  >
                    {r.status}
                  </span>
                </td>
                <td>RM {Number(r.total_amount).toFixed(2)}</td>
                <td>
                  <div className="record-actions">
                    <button
                      className="text-btn"
                      onClick={() => printRentalRecords([r], lang)}
                    >
                      <FileDown size={14} /> PDF
                    </button>
                    {profile.role !== "auditor" && r.status === "out" && (
                      <button
                        className="text-btn"
                        onClick={() => markReturned(r)}
                      >
                        {lang === "bm" ? "Pulang" : "Return"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <div className="empty">{t.noData}</div>}
      </div>
      {showAdd && (
        <RentalModal
          t={t}
          lang={lang}
          inventory={inventory}
          user={user}
          close={() => setShowAdd(false)}
          done={() => {
            setShowAdd(false);
            refresh();
            setNotice(
              lang === "bm"
                ? "Rekod penyewaan berjaya disimpan."
                : "Rental record saved.",
            );
          }}
        />
      )}
    </section>
  );
}

function RentalModal({ t, lang, inventory, close, done }: any) {
  const rentable = inventory as Inventory[];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    rental_date: new Date().toISOString().slice(0, 10),
    expected_return_date: tomorrow,
    total_amount: "",
    deposit_amount: "",
    payment_status: "unpaid",
    notes: "",
  });
  const [items, setItems] = useState([
    {
      inventory_item_id: rentable[0]?.id || "",
      quantity: 1,
      condition_out: "Good",
    },
  ]);
  const set = (key: string, value: string) =>
    setForm({ ...form, [key]: value });
  const setItem = (index: number, key: string, value: string | number) =>
    setItems(
      items.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.rpc("create_rental", {
      p_customer_name: form.customer_name,
      p_customer_phone: form.customer_phone,
      p_rental_date: form.rental_date,
      p_expected_return_date: form.expected_return_date,
      p_total_amount: Number(form.total_amount || 0),
      p_deposit_amount: Number(form.deposit_amount || 0),
      p_payment_status: form.payment_status,
      p_notes: form.notes,
      p_items: items,
    });
    setBusy(false);
    if (error) return alert(error.message);
    done();
  }
  return (
    <div className="modal-backdrop">
      <div className="modal rental-modal">
        <div className="modal-head">
          <div>
            <span>SCUBAHOLICS</span>
            <h2>{lang === "bm" ? "Penyewaan Baharu" : "New Rental"}</h2>
          </div>
          <button className="icon-btn" onClick={close}>
            <X />
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="form-grid">
            <label>
              {lang === "bm" ? "Nama Pelanggan" : "Customer Name"}
              <input
                required
                value={form.customer_name}
                onChange={(e) => set("customer_name", e.target.value)}
              />
            </label>
            <label>
              {lang === "bm" ? "No. Telefon" : "Phone No."}
              <input
                value={form.customer_phone}
                onChange={(e) => set("customer_phone", e.target.value)}
              />
            </label>
            <label>
              {lang === "bm" ? "Tarikh Keluar" : "Rental Date"}
              <input
                type="date"
                required
                value={form.rental_date}
                onChange={(e) => set("rental_date", e.target.value)}
              />
            </label>
            <label>
              {lang === "bm" ? "Jangka Tarikh Pulang" : "Expected Return"}
              <input
                type="date"
                required
                min={form.rental_date}
                value={form.expected_return_date}
                onChange={(e) => set("expected_return_date", e.target.value)}
              />
            </label>
          </div>
          <div className="rental-lines">
            <strong>
              {lang === "bm" ? "Peralatan Disewa" : "Rented Equipment"}
            </strong>
            {items.map((item, index) => {
              const selected = rentable.find(
                (i) => i.id === item.inventory_item_id,
              );
              return (
                <div className="rental-line" key={index}>
                  <select
                    value={item.inventory_item_id}
                    onChange={(e) =>
                      setItem(index, "inventory_item_id", e.target.value)
                    }
                  >
                    {rentable.map((i) => (
                      <option key={i.id} value={i.id}>
                        {lang === "bm" ? i.name_bm : i.name_en}
                        {i.variant ? ` · ${i.variant}` : ""} ({i.quantity})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    max={selected?.quantity || 1}
                    value={item.quantity}
                    onChange={(e) =>
                      setItem(index, "quantity", Number(e.target.value))
                    }
                  />
                  <select
                    value={item.condition_out}
                    onChange={(e) =>
                      setItem(index, "condition_out", e.target.value)
                    }
                  >
                    <option>Good</option>
                    <option>Fair</option>
                    <option>Needs Attention</option>
                  </select>
                  {items.length > 1 && (
                    <button
                      type="button"
                      className="text-btn danger-text"
                      onClick={() =>
                        setItems(items.filter((_, i) => i !== index))
                      }
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              className="text-btn"
              onClick={() =>
                setItems([
                  ...items,
                  {
                    inventory_item_id: rentable[0]?.id || "",
                    quantity: 1,
                    condition_out: "Good",
                  },
                ])
              }
            >
              <Plus size={15} /> {lang === "bm" ? "Tambah Item" : "Add Item"}
            </button>
          </div>
          <div className="form-grid">
            <label>
              {lang === "bm" ? "Jumlah Sewa (RM)" : "Rental Total (RM)"}
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.total_amount}
                onChange={(e) => set("total_amount", e.target.value)}
              />
            </label>
            <label>
              Deposit (RM)
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.deposit_amount}
                onChange={(e) => set("deposit_amount", e.target.value)}
              />
            </label>
            <label>
              {lang === "bm" ? "Status Bayaran" : "Payment Status"}
              <select
                value={form.payment_status}
                onChange={(e) => set("payment_status", e.target.value)}
              >
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </label>
          </div>
          <label>
            {t.remarks}
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={close}>
              {t.cancel}
            </button>
            <button className="primary" disabled={busy}>
              {busy ? t.loading : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UsersView({ t, lang, users, currentUser, refresh, setNotice }: any) {
  const [showAdd, setShowAdd] = useState(false);
  async function status(u: any, s: string) {
    const { error } = await supabase
      .from("profiles")
      .update({ status: s, updated_at: new Date().toISOString() })
      .eq("id", u.id);
    if (error) return alert(error.message);
    setNotice("User updated.");
    refresh();
  }
  async function changeRole(u: any, role: string) {
    const { error } = await supabase
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", u.id);
    if (error) return alert(error.message);
    setNotice(
      lang === "bm" ? "Akses pengguna dikemas kini." : "User access updated.",
    );
    refresh();
  }
  return (
    <section>
      <div className="toolbar">
        <div>
          <strong>
            {lang === "bm" ? "PENGURUSAN PENGGUNA" : "USER MANAGEMENT"}
          </strong>
          <small className="block-muted">
            {lang === "bm"
              ? "Admin: penuh · Staff: kerja & pemantauan · Auditor: baca sahaja"
              : "Admin: full · Staff: jobs & monitoring · Auditor: read only"}
          </small>
        </div>
        <button className="primary" onClick={() => setShowAdd(true)}>
          <Plus /> {lang === "bm" ? "Tambah Pengguna" : "Add User"}
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t.fullName}</th>
              <th>Role</th>
              <th>{t.status}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id}>
                <td>
                  <strong>{u.full_name}</strong>
                </td>
                <td>
                  <select
                    className="role-select"
                    value={u.role}
                    disabled={u.id === currentUser.id}
                    onChange={(e) => changeRole(u, e.target.value)}
                  >
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                    <option value="auditor">Auditor</option>
                  </select>
                </td>
                <td>
                  <span
                    className={
                      u.status === "active"
                        ? "badge ok"
                        : u.status === "pending"
                          ? "badge warn"
                          : "badge danger"
                    }
                  >
                    {u.status}
                  </span>
                </td>
                <td>
                  {u.role !== "admin" && (
                    <button
                      className="text-btn"
                      onClick={() =>
                        status(
                          u,
                          u.status === "active" ? "suspended" : "active",
                        )
                      }
                    >
                      {u.status === "active" ? t.suspend : t.approve}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showAdd && (
        <AddUserModal
          t={t}
          lang={lang}
          close={() => setShowAdd(false)}
          done={() => {
            setShowAdd(false);
            refresh();
            setNotice(
              lang === "bm"
                ? "Pengguna baharu berjaya ditambah."
                : "New user added.",
            );
          }}
        />
      )}
    </section>
  );
}

function AddUserModal({ t, lang, close, done }: any) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "staff",
  });
  const set = (key: string, value: string) =>
    setForm({ ...form, [key]: value });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "admin-create-user",
        { body: form },
      );
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      done();
    } catch (error: any) {
      alert(error.message || "Unable to create user");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="modal-backdrop">
      <div className="modal user-modal">
        <div className="modal-head">
          <div>
            <span>ADMIN</span>
            <h2>{lang === "bm" ? "Tambah Pengguna" : "Add User"}</h2>
          </div>
          <button className="icon-btn" onClick={close}>
            <X />
          </button>
        </div>
        <form onSubmit={submit}>
          <label>
            {t.fullName}
            <input
              required
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
            />
          </label>
          <label>
            {t.email}
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </label>
          <label>
            {lang === "bm" ? "Kata Laluan Sementara" : "Temporary Password"}
            <input
              type="password"
              minLength={8}
              required
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
            />
          </label>
          <label>
            {lang === "bm" ? "Tahap Akses" : "Access Role"}
            <select
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
            >
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="auditor">Auditor</option>
            </select>
          </label>
          <div className="access-note">
            {form.role === "admin" &&
              (lang === "bm"
                ? "Akses penuh termasuk pengguna, peralatan dan inventori."
                : "Full access including users, equipment and inventory.")}
            {form.role === "staff" &&
              (lang === "bm"
                ? "Boleh mencipta kerja baharu dan memantau status peralatan."
                : "Can create jobs and monitor equipment status.")}
            {form.role === "auditor" &&
              (lang === "bm"
                ? "Baca sahaja: semua tugasan, kemajuan dan status peralatan."
                : "Read only: all jobs, progress and equipment status.")}
          </div>
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={close}>
              {t.cancel}
            </button>
            <button className="primary" disabled={busy}>
              {busy ? t.loading : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProfileView({ t, lang, profile, refresh, setNotice }: any) {
  const [pin, setPin] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.rpc("set_my_pin", { p_pin: pin });
    if (error) return alert(error.message);
    setPin("");
    setNotice("PIN saved securely.");
  }
  async function uploadAvatar(file?: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024)
      return alert(
        lang === "bm"
          ? "Gambar mesti kurang daripada 5MB."
          : "Image must be under 5MB.",
      );
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${profile.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_path: path, updated_at: new Date().toISOString() })
        .eq("id", profile.id);
      if (error) throw error;
      setNotice(
        lang === "bm"
          ? "Gambar profil dikemas kini."
          : "Profile image updated.",
      );
      refresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8)
      return alert(
        lang === "bm"
          ? "Kata laluan mesti sekurang-kurangnya 8 aksara."
          : "Password must be at least 8 characters.",
      );
    if (password !== confirmPassword)
      return alert(
        lang === "bm"
          ? "Pengesahan kata laluan tidak sama."
          : "Password confirmation does not match.",
      );
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return alert(error.message);
    setPassword("");
    setConfirmPassword("");
    setNotice(
      lang === "bm"
        ? "Kata laluan login berjaya ditukar."
        : "Login password changed.",
    );
  }
  return (
    <section>
      <div className="panel profile-card">
        <div className="avatar large">
          {profile.avatar_path ? (
            <img
              src={profileImageUrl(profile.avatar_path)}
              alt={profile.full_name}
            />
          ) : (
            profile.full_name?.[0]
          )}
        </div>
        <h2>{profile.full_name}</h2>
        <p>
          {profile.role} · {profile.status}
        </p>
        <label className="avatar-upload">
          {lang === "bm" ? "Tukar Gambar Profil" : "Change Profile Image"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(e) => uploadAvatar(e.target.files?.[0])}
          />
        </label>
        <form onSubmit={save}>
          <label>
            {t.setPin}
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4,8}"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
            />
          </label>
          <small>{t.pinHelp}</small>
          <button className="primary">{t.save}</button>
        </form>
        <form onSubmit={changePassword}>
          <h3>
            {lang === "bm"
              ? "Tukar Kata Laluan Login"
              : "Change Login Password"}
          </h3>
          <label>
            {lang === "bm" ? "Kata Laluan Baharu" : "New Password"}
            <input
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <label>
            {lang === "bm" ? "Sahkan Kata Laluan" : "Confirm Password"}
            <input
              type="password"
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </label>
          <button className="primary" disabled={busy}>
            {lang === "bm" ? "Tukar Kata Laluan" : "Change Password"}
          </button>
        </form>
      </div>
    </section>
  );
}

function JobModal({ t, lang, equipment, user, close, done }: any) {
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState("signature");
  const [signature, setSignature] = useState("");
  const [pin, setPin] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [form, setForm] = useState({
    equipment_id: equipment[0]?.id || "",
    job_type: "service",
    service_date: new Date().toISOString().slice(0, 10),
    work_time: new Date().toTimeString().slice(0, 5),
    fault: "",
    work_done: "",
    remarks: "",
  });
  const change = (k: string, v: string) => setForm({ ...form, [k]: v });
  async function upload(file: Blob, name: string) {
    const path = `${user.id}/${Date.now()}-${name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const { error } = await supabase.storage
      .from("job-media")
      .upload(path, file);
    if (error) throw error;
    return path;
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (method === "pin") {
        const { data, error } = await supabase.rpc("verify_my_pin", {
          p_pin: pin,
        });
        if (error || !data)
          throw new Error(
            lang === "bm"
              ? "PIN tidak sah. Tetapkan PIN di halaman Profil."
              : "Invalid PIN. Set your PIN in Profile.",
          );
      }
      if (method === "signature" && !signature)
        throw new Error(
          lang === "bm"
            ? "Sila lukis tandatangan."
            : "Please draw a signature.",
        );
      const photos = [];
      for (const f of files) photos.push(await upload(f, f.name));
      let sigPath = null;
      if (signature) {
        const blob = await (await fetch(signature)).blob();
        sigPath = await upload(blob, "signature.png");
      }
      const { error } = await supabase.from("service_jobs").insert({
        equipment_id: form.equipment_id,
        job_type: form.job_type,
        service_date: form.service_date,
        work_time: form.work_time || null,
        fault: form.fault || null,
        work_done: form.work_done,
        remarks: form.remarks || null,
        photo_paths: photos,
        signature_path: sigPath,
        verification_method: method,
        created_by: user.id,
      });
      if (error) throw error;
      done();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head">
          <div>
            <span>SCUBAHOLICS</span>
            <h2>{t.newJob}</h2>
          </div>
          <button className="icon-btn" onClick={close}>
            <X />
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="form-grid">
            <label>
              {t.equipment}
              <select
                value={form.equipment_id}
                onChange={(e) => change("equipment_id", e.target.value)}
              >
                {equipment.map((x: any) => (
                  <option key={x.id} value={x.id}>
                    {lang === "bm" ? x.name_bm : x.name_en}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t.jobType}
              <select
                value={form.job_type}
                onChange={(e) => change("job_type", e.target.value)}
              >
                <option value="service">{t.service}</option>
                <option value="inspection">{t.inspection}</option>
                <option value="repair">{t.repair}</option>
              </select>
            </label>
            <label>
              {t.date}
              <input
                type="date"
                value={form.service_date}
                onChange={(e) => change("service_date", e.target.value)}
              />
            </label>
            <label>
              {t.runningHours}
              <input
                type="time"
                value={form.work_time}
                onChange={(e) => change("work_time", e.target.value)}
              />
            </label>
          </div>
          <label>
            {t.fault}
            <textarea
              value={form.fault}
              onChange={(e) => change("fault", e.target.value)}
            />
          </label>
          <label>
            {t.workDone}
            <textarea
              required
              value={form.work_done}
              onChange={(e) => change("work_done", e.target.value)}
            />
          </label>
          <label>
            {t.remarks}
            <textarea
              value={form.remarks}
              onChange={(e) => change("remarks", e.target.value)}
            />
          </label>
          <label>
            {t.photos}
            <input
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
          </label>
          <div className="segmented">
            <button
              type="button"
              className={method === "signature" ? "active" : ""}
              onClick={() => setMethod("signature")}
            >
              {t.signature}
            </button>
            <button
              type="button"
              className={method === "pin" ? "active" : ""}
              onClick={() => setMethod("pin")}
            >
              {t.pin}
            </button>
          </div>
          {method === "signature" ? (
            <SignaturePad
              onChange={setSignature}
              label={t.signature}
              clearLabel={t.clear}
            />
          ) : (
            <label>
              {t.pin}
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
              />
            </label>
          )}
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={close}>
              {t.cancel}
            </button>
            <button className="primary" disabled={busy}>
              {busy ? t.loading : t.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function JobModalAll({
  t,
  lang,
  schedules,
  equipment,
  inventory,
  user,
  close,
  done,
}: any) {
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState("signature");
  const [signature, setSignature] = useState("");
  const [pin, setPin] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const firstCategory = schedules[0]?.equipment_key || "compressor";
  const firstVariation =
    equipment.find((e: any) => e.category === firstCategory)?.id ||
    inventory.find((i: any) => i.category.toLowerCase() === firstCategory)
      ?.id ||
    "";
  const [form, setForm] = useState({
    equipment_category: firstCategory,
    variation_id: firstVariation,
    job_type: "routine_service",
    service_date: new Date().toISOString().slice(0, 10),
    work_time: new Date().toTimeString().slice(0, 5),
    fault: "",
    work_done: "",
    remarks: "",
  });
  const change = (k: string, v: string) => setForm({ ...form, [k]: v });
  const serviceCategory = ["compressor", "genset"].includes(
    form.equipment_category,
  );
  const variations = serviceCategory
    ? equipment.filter((e: any) => e.category === form.equipment_category)
    : inventory.filter(
        (i: any) => i.category.toLowerCase() === form.equipment_category,
      );
  const selectCategory = (category: string) => {
    const options = ["compressor", "genset"].includes(category)
      ? equipment.filter((e: any) => e.category === category)
      : inventory.filter((i: any) => i.category.toLowerCase() === category);
    setForm({
      ...form,
      equipment_category: category,
      variation_id: options[0]?.id || "",
    });
  };
  async function upload(file: Blob, name: string) {
    const path = `${user.id}/${Date.now()}-${name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const { error } = await supabase.storage
      .from("job-media")
      .upload(path, file);
    if (error) throw error;
    return path;
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (method === "pin") {
        const { data, error } = await supabase.rpc("verify_my_pin", {
          p_pin: pin,
        });
        if (error || !data)
          throw new Error(
            lang === "bm"
              ? "PIN tidak sah. Tetapkan PIN di halaman Profil."
              : "Invalid PIN. Set your PIN in Profile.",
          );
      }
      if (method === "signature" && !signature)
        throw new Error(
          lang === "bm"
            ? "Sila lukis tandatangan."
            : "Please draw a signature.",
        );
      const photos = [];
      for (const f of files) photos.push(await upload(f, f.name));
      let sigPath = null;
      if (signature) {
        const blob = await (await fetch(signature)).blob();
        sigPath = await upload(blob, "signature.png");
      }
      const { error } = await supabase.from("service_jobs").insert({
        equipment_category: form.equipment_category,
        equipment_id: serviceCategory ? form.variation_id : null,
        inventory_item_id: serviceCategory ? null : form.variation_id,
        job_type: form.job_type,
        service_date: form.service_date,
        work_time: form.work_time || null,
        fault: form.fault || null,
        work_done: form.work_done,
        remarks: form.remarks || null,
        photo_paths: photos,
        signature_path: sigPath,
        verification_method: method,
        created_by: user.id,
      });
      if (error) throw error;
      done();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head">
          <div>
            <span>SCUBAHOLICS · 11 EQUIPMENT TYPES</span>
            <h2>{t.newJob}</h2>
          </div>
          <button className="icon-btn" onClick={close}>
            <X />
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="form-grid">
            <label>
              {t.equipment}
              <select
                value={form.equipment_category}
                onChange={(e) => selectCategory(e.target.value)}
              >
                {schedules.map((x: any) => (
                  <option key={x.id} value={x.equipment_key}>
                    {lang === "bm" ? x.name_bm : x.name_en}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {lang === "bm" ? "Variasi / Unit" : "Variant / Unit"}
              <select
                required
                value={form.variation_id}
                onChange={(e) => change("variation_id", e.target.value)}
              >
                {variations.map((x: any) => (
                  <option key={x.id} value={x.id}>
                    {serviceCategory
                      ? `${lang === "bm" ? x.name_bm : x.name_en} · ${x.serial_no || x.code}`
                      : `${x.variant || (lang === "bm" ? x.name_bm : x.name_en)} · ${x.quantity} ${x.unit === "pair" ? (lang === "bm" ? "pasangan" : "pairs") : "unit"}${x.serial_no ? ` · ${x.serial_no}` : ""}`}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t.jobType}
              <select
                value={form.job_type}
                onChange={(e) => change("job_type", e.target.value)}
              >
                <option value="routine_service">
                  {lang === "bm"
                    ? "Servis Rutin (14 Hari)"
                    : "Routine Service (14 Days)"}
                </option>
                <option value="overall_service">
                  {lang === "bm"
                    ? "Servis Menyeluruh (30 Hari)"
                    : "Overall Service (30 Days)"}
                </option>
                <option value="repair">{t.repair}</option>
              </select>
            </label>
            <label>
              {t.date}
              <input
                type="date"
                value={form.service_date}
                onChange={(e) => change("service_date", e.target.value)}
              />
            </label>
            <label>
              {t.runningHours}
              <input
                type="time"
                value={form.work_time}
                onChange={(e) => change("work_time", e.target.value)}
              />
            </label>
          </div>
          <label>
            {t.fault}
            <textarea
              value={form.fault}
              onChange={(e) => change("fault", e.target.value)}
            />
          </label>
          <label>
            {t.workDone}
            <textarea
              required
              value={form.work_done}
              onChange={(e) => change("work_done", e.target.value)}
            />
          </label>
          <label>
            {t.remarks}
            <textarea
              value={form.remarks}
              onChange={(e) => change("remarks", e.target.value)}
            />
          </label>
          <label>
            {t.photos}
            <input
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
          </label>
          <div className="segmented">
            <button
              type="button"
              className={method === "signature" ? "active" : ""}
              onClick={() => setMethod("signature")}
            >
              {t.signature}
            </button>
            <button
              type="button"
              className={method === "pin" ? "active" : ""}
              onClick={() => setMethod("pin")}
            >
              {t.pin}
            </button>
          </div>
          {method === "signature" ? (
            <SignaturePad
              onChange={setSignature}
              label={t.signature}
              clearLabel={t.clear}
            />
          ) : (
            <label>
              {t.pin}
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
              />
            </label>
          )}
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={close}>
              {t.cancel}
            </button>
            <button className="primary" disabled={busy}>
              {busy ? t.loading : t.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
