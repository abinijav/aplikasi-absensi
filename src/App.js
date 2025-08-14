import React, { useState, useEffect, useRef } from 'react';
import { Camera, Users, LogIn, LogOut, FileDown, UserPlus, List, X, Trash2, PlusCircle, UploadCloud, Download, BookCopy, Edit, Check, XCircle, Edit3, Send, RefreshCw, Clock, UserCheck, CalendarDays, ChevronDown, ChevronUp } from 'lucide-react';

// --- LANGKAH 1: KONFIGURASI SUPABASE ---
// Memperbaiki error 'process is not defined' dengan memberikan nilai fallback.
// Kode ini akan menggunakan environment variables jika tersedia (di Vercel),
// atau menggunakan kunci yang ditulis langsung jika tidak tersedia (di lingkungan pratinjau ini).
const supabaseUrl = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_URL)
  ? process.env.REACT_APP_SUPABASE_URL
  : 'https://hrfpxxezdgfuegdizwve.supabase.co';

const supabaseAnonKey = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_ANON_KEY)
  ? process.env.REACT_APP_SUPABASE_ANON_KEY
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZnB4eGV6ZGdmdWVnZGl6d3ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1OTc3OTEsImV4cCI6MjA2OTE3Mzc5MX0.mBlr-t1bVJcavb7k4fmAvO5x3HcEy4BFgYNZbZF6cNk';


// --- KOMPONEN UTAMA APLIKASI ---
export default function App() {
    const [supabase, setSupabase] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [timeSettings, setTimeSettings] = useState(null);

    // EFEK UTAMA: Inisialisasi aplikasi, Supabase, dan pengaturan
    useEffect(() => {
        const initializeApp = async () => {
            // Validasi bahwa environment variables sudah diatur
            if (!supabaseUrl || !supabaseAnonKey) {
                setError("Konfigurasi Supabase (URL & Kunci) tidak ditemukan. Pastikan Anda sudah mengatur environment variables.");
                setLoading(false);
                return;
            }

            try {
                // Fungsi untuk memuat skrip Supabase jika belum ada
                const getSupabaseClient = () => new Promise((resolve, reject) => {
                    if (window.supabase) {
                        return resolve(window.supabase.createClient(supabaseUrl, supabaseAnonKey));
                    }
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
                    script.async = true;
                    script.onload = () => {
                        if (window.supabase) {
                            resolve(window.supabase.createClient(supabaseUrl, supabaseAnonKey));
                        } else {
                            reject(new Error("Skrip Supabase dimuat tetapi window.supabase tidak tersedia."));
                        }
                    };
                    script.onerror = () => reject(new Error("Gagal memuat skrip Supabase."));
                    document.body.appendChild(script);
                });

                const client = await getSupabaseClient();
                setSupabase(client);

                // Ambil pengaturan jam setelah client siap
                const { data, error: settingsError } = await client
                    .from('settings')
                    .select('*')
                    .limit(1)
                    .single();
                
                if (settingsError) {
                    throw settingsError;
                }
                
                setTimeSettings(data);

            } catch (e) {
                console.error("Inisialisasi gagal:", e);
                setError("Gagal memuat aplikasi. Periksa koneksi dan coba lagi.");
            } finally {
                setLoading(false); // Set loading ke false setelah semua selesai
            }
        };

        initializeApp();
    }, []); // Array dependensi kosong agar hanya berjalan sekali

    // Fungsi untuk menangani proses login
    const handleLogin = async (userData) => {
        // Cek login admin
        if (userData.id === 'manulbat') {
            setUser({ id: 'manulbat', name: 'Admin', role: 'admin' });
            return;
        }
        
        // Cek login user (siswa/guru) dari database
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('nis', userData.id)
            .single();

        if (error || !data) {
            // Error ini akan ditangkap oleh blok try-catch di LoginScreen
            throw new Error('NIS/ID Pengguna tidak ditemukan di database.');
        }
        
        setUser(data);
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-gray-100"><div className="text-xl font-semibold">Memuat Aplikasi & Pengaturan...</div></div>;
    }
    
    if (error) {
        return <div className="flex items-center justify-center h-screen bg-red-100"><div className="text-xl font-semibold text-red-700 p-4 text-center">{error}</div></div>;
    }

    if (!user) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Header user={user} onLogout={() => setUser(null)} />
            <main className="p-4 md:p-8">
                {user.role === 'admin' ? <AdminDashboard supabase={supabase} settings={timeSettings} /> 
                 : user.role === 'teacher' ? <TeacherDashboard user={user} supabase={supabase} settings={timeSettings} />
                 : <StudentDashboard user={user} supabase={supabase} settings={timeSettings} />}
            </main>
            <footer className="text-center py-4 text-sm text-gray-400">
  Dibuat oleh Abi Nijav
</footer>
        </div>
    );
}

// --- Komponen Header ---
const Header = ({ user, onLogout }) => (
    <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-green-600">Absensi Digital Civitas Akademika MA Nurul Ulum</h1>
                <p className="text-sm text-gray-500">Selamat Datang, {user.name}</p>
            </div>
            <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                <LogOut size={18} />
                <span>Keluar</span>
            </button>
        </div>
    </header>
);

// --- Komponen Halaman Login ---
const LoginScreen = ({ onLogin }) => {
    const [nis, setNis] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLoginAttempt = async () => {
        if (!nis) {
            setError('NIS/ID Pengguna tidak boleh kosong.');
            return;
        }
        setLoading(true); // Mengelola state loading-nya sendiri
        setError('');
        try {
            await onLogin({ id: nis });
            // Jika sukses, komponen App akan re-render dan LoginScreen akan unmount.
        } catch (err) {
            setError(err.message || 'NIS/ID Pengguna tidak ditemukan.');
            setLoading(false); // Set loading false hanya jika terjadi error agar bisa coba lagi.
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-500 to-emerald-600">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-2xl">
                <div className="flex items-center justify-center space-x-4">
                    <img 
                        src="https://hrfpxxezdgfuegdizwve.supabase.co/storage/v1/object/public/assets/logo.png" 
                        alt="Logo Sekolah" 
                        className="w-16 h-16 md:w-20 md:h-20"
                        onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/80x80/e2e8f0/4a5568?text=Logo'; }}
                    />
                    <div className="text-left">
                        <h2 className="text-lg font-bold text-gray-800 leading-tight">ABSENSI DIGITAL CIVITAS AKADEMIKA</h2>
                        <p className="text-md font-semibold text-gray-700 leading-tight">MA NURUL ULUM</p>
                        <p className="text-xs text-gray-500 leading-tight">Batursari Mranggen Demak</p>
                    </div>
                </div>
                <hr/>
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800">Login Absensi</h1>
                    <p className="text-gray-500">Gunakan NIS untuk Siswa atau ID untuk Guru</p>
                </div>
                <div>
                    <label htmlFor="nis" className="text-sm font-medium text-gray-700">NIS / ID Pengguna</label>
                    <input
                        id="nis"
                        type="text"
                        value={nis}
                        onChange={(e) => setNis(e.target.value)}
                        placeholder="Masukkan NIS atau ID Guru"
                        className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                    />
                </div>
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                <button
                    onClick={handleLoginAttempt}
                    disabled={loading}
                    className="w-full py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-transform transform hover:scale-105 disabled:bg-green-400"
                >
                    {loading ? 'Memverifikasi...' : 'Masuk'}
                </button>
            </div>
        </div>
    );
};

// --- Komponen Dasbor Siswa ---
const StudentDashboard = ({ user, supabase, settings }) => {
    const [showCamera, setShowCamera] = useState(false);
    const [attendanceType, setAttendanceType] = useState('');
    const [todayAttendance, setTodayAttendance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!supabase) return;
        const fetchAttendance = async () => {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('attendance')
                .select('*')
                .eq('user_nis', user.nis)
                .eq('date', today)
                .maybeSingle();
            
            if (error) {
                console.error("Gagal mengambil data absensi siswa:", error);
                setMessage("Gagal memuat status absensi. Coba lagi nanti.");
            } else {
                setTodayAttendance(data);
            }
            setLoading(false);
        };
        fetchAttendance();
    }, [user.nis, supabase]);

    const handleAttend = (type) => {
        if (!settings) {
            setMessage("Pengaturan jam belum siap. Mohon tunggu sebentar.");
            return;
        }
        const now = new Date();
        const currentHour = now.getHours();

        if (type === 'in' && (currentHour < settings.checkin_start_hour || currentHour >= settings.checkin_end_hour)) {
            setMessage(`Absen masuk hanya bisa dilakukan antara pukul ${String(settings.checkin_start_hour).padStart(2, '0')}:00 - ${String(settings.checkin_end_hour).padStart(2, '0')}:00.`);
            setTimeout(() => setMessage(''), 5000);
            return;
        }

        if (type === 'out' && (currentHour < settings.checkout_start_hour || currentHour >= settings.checkout_end_hour)) {
            setMessage(`Absen pulang hanya bisa dilakukan antara pukul ${String(settings.checkout_start_hour).padStart(2, '0')}:00 - ${String(settings.checkout_end_hour).padStart(2, '0')}:00.`);
            setTimeout(() => setMessage(''), 5000);
            return;
        }
        
        setAttendanceType(type);
        setShowCamera(true);
    };

    const handleSelfieCapture = async (imageData) => {
        setShowCamera(false);
        setMessage('Mengunggah foto dan menyimpan data...');

        try {
            const today = new Date();
            const dateStr = today.toISOString().split('T')[0];
            const fileExt = 'jpg';
            const filePath = `${user.nis}/${dateStr}-${attendanceType}.${fileExt}`;

            const response = await fetch(imageData);
            const blob = await response.blob();

            const { error: uploadError } = await supabase.storage
                .from('selfies')
                .upload(filePath, blob, { upsert: true });
            if (uploadError) throw uploadError;

            const { data: urlData } = await supabase.storage
                .from('selfies')
                .getPublicUrl(filePath);
            const publicURL = urlData.publicUrl;

            if (attendanceType === 'in') {
                const { error } = await supabase.from('attendance').insert({
                    user_nis: user.nis,
                    name: user.name,
                    class: user.class,
                    date: dateStr,
                    time_in: new Date().toISOString(),
                    selfie_in_url: publicURL,
                    status: 'Hadir'
                });
                if (error) throw error;
                setMessage('Absen masuk berhasil!');
            } else if (attendanceType === 'out' && todayAttendance) {
                const { error } = await supabase.from('attendance')
                    .update({
                        time_out: new Date().toISOString(),
                        selfie_out_url: publicURL,
                    })
                    .eq('id', todayAttendance.id);
                if (error) throw error;
                setMessage('Absen pulang berhasil!');
            }
            
             const { data: newData } = await supabase.from('attendance').select('*').eq('user_nis', user.nis).eq('date', dateStr).maybeSingle();
             if (newData) setTodayAttendance(newData);

        } catch (error) {
            console.error("Error saving attendance: ", error);
            setMessage(`Terjadi kesalahan: ${error.message}`);
        } finally {
            setTimeout(() => setMessage(''), 5000);
        }
    };

    if (loading) return <div className="text-center p-8">Memeriksa status absensi...</div>

    return (
        <div className="container mx-auto">
            {showCamera && <CameraModal onCapture={handleSelfieCapture} onCancel={() => setShowCamera(false)} />}
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Dasbor Siswa</h2>
                {message && <div className={`mb-4 p-3 text-center rounded-lg ${message.includes('berhasil') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message}</div>}
                
                {!settings ? <div className="text-center p-4 bg-yellow-100 text-yellow-800 rounded-lg">Memuat pengaturan jam...</div> :
                <div className="grid md:grid-cols-2 gap-6">
                    <div className={`p-6 rounded-lg text-center transition-all ${!todayAttendance ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        <h3 className="text-xl font-semibold mb-3">Absen Masuk ({String(settings.checkin_start_hour).padStart(2, '0')}:00 - {String(settings.checkin_end_hour).padStart(2, '0')}:00)</h3>
                        <button onClick={() => handleAttend('in')} disabled={!!todayAttendance} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white text-green-600 font-bold rounded-lg shadow-md hover:bg-green-50 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"><LogIn size={20} /><span>Ambil Selfie Masuk</span></button>
                        {todayAttendance && <p className="text-xs mt-2 text-gray-600">Anda sudah absen masuk hari ini.</p>}
                    </div>
                    <div className={`p-6 rounded-lg text-center transition-all ${todayAttendance && !todayAttendance.time_out ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        <h3 className="text-xl font-semibold mb-3">Absen Pulang ({String(settings.checkout_start_hour).padStart(2, '0')}:00 - {String(settings.checkout_end_hour).padStart(2, '0')}:00)</h3>
                        <button onClick={() => handleAttend('out')} disabled={!todayAttendance || !!todayAttendance.time_out} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white text-red-600 font-bold rounded-lg shadow-md hover:bg-red-50 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"><LogOut size={20} /><span>Ambil Selfie Pulang</span></button>
                        {!todayAttendance && <p className="text-xs mt-2 text-gray-600">Anda harus absen masuk terlebih dahulu.</p>}
                        {todayAttendance?.time_out && <p className="text-xs mt-2 text-gray-600">Anda sudah absen pulang hari ini.</p>}
                    </div>
                </div>
                }

                {todayAttendance && (
                    <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-bold text-lg mb-2">Rekap Absensi Hari Ini</h3>
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            {todayAttendance.selfie_in_url && (
                                <div className="text-center">
                                    <img src={todayAttendance.selfie_in_url} alt="Selfie Masuk" className="w-32 h-32 object-cover rounded-lg mx-auto shadow-sm" />
                                    <p className="text-sm mt-1">Masuk: {new Date(todayAttendance.time_in).toLocaleTimeString('id-ID')}</p>
                                </div>
                            )}
                            {todayAttendance.selfie_out_url && (
                                <div className="text-center">
                                    <img src={todayAttendance.selfie_out_url} alt="Selfie Pulang" className="w-32 h-32 object-cover rounded-lg mx-auto shadow-sm" />
                                    <p className="text-sm mt-1">Pulang: {new Date(todayAttendance.time_out).toLocaleTimeString('id-ID')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- Komponen Dasbor Guru ---
const TeacherDashboard = ({ user, supabase, settings }) => {
    const [showCamera, setShowCamera] = useState(false);
    const [attendanceType, setAttendanceType] = useState('');
    const [todayAttendance, setTodayAttendance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!supabase) return;
        const fetchAttendance = async () => {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('attendance')
                .select('*')
                .eq('user_nis', user.nis) // 'nis' digunakan sebagai ID unik guru
                .eq('date', today)
                .maybeSingle();
            
            if (error) {
                console.error("Gagal mengambil data absensi guru:", error);
                setMessage("Gagal memuat status absensi. Coba lagi nanti.");
            } else {
                setTodayAttendance(data);
            }
            setLoading(false);
        };
        fetchAttendance();
    }, [user.nis, supabase]);

    const handleAttend = (type) => {
        if (!settings) {
            setMessage("Pengaturan jam belum siap. Mohon tunggu sebentar.");
            return;
        }
        const now = new Date();
        const currentHour = now.getHours();

        if (type === 'in' && (currentHour < settings.teacher_checkin_start || currentHour >= settings.teacher_checkin_end)) {
            setMessage(`Absen masuk hanya bisa dilakukan antara pukul ${String(settings.teacher_checkin_start).padStart(2, '0')}:00 - ${String(settings.teacher_checkin_end).padStart(2, '0')}:00.`);
            setTimeout(() => setMessage(''), 5000);
            return;
        }

        if (type === 'out' && (currentHour < settings.teacher_checkout_start || currentHour >= settings.teacher_checkout_end)) {
            setMessage(`Absen pulang hanya bisa dilakukan antara pukul ${String(settings.teacher_checkout_start).padStart(2, '0')}:00 - ${String(settings.teacher_checkout_end).padStart(2, '0')}:00.`);
            setTimeout(() => setMessage(''), 5000);
            return;
        }
        
        setAttendanceType(type);
        setShowCamera(true);
    };

    const handleSelfieCapture = async (imageData) => {
        setShowCamera(false);
        setMessage('Mengunggah foto dan menyimpan data...');

        try {
            const today = new Date();
            const dateStr = today.toISOString().split('T')[0];
            const fileExt = 'jpg';
            const filePath = `${user.nis}/${dateStr}-${attendanceType}.${fileExt}`;

            const response = await fetch(imageData);
            const blob = await response.blob();

            const { error: uploadError } = await supabase.storage
                .from('selfies')
                .upload(filePath, blob, { upsert: true });
            if (uploadError) throw uploadError;

            const { data: urlData } = await supabase.storage
                .from('selfies')
                .getPublicUrl(filePath);
            const publicURL = urlData.publicUrl;

            if (attendanceType === 'in') {
                const { error } = await supabase.from('attendance').insert({
                    user_nis: user.nis,
                    name: user.name,
                    class: null, // Guru tidak punya kelas
                    date: dateStr,
                    time_in: new Date().toISOString(),
                    selfie_in_url: publicURL,
                    status: 'Hadir'
                });
                if (error) throw error;
                setMessage('Absen masuk berhasil!');
            } else if (attendanceType === 'out' && todayAttendance) {
                const { error } = await supabase.from('attendance')
                    .update({
                        time_out: new Date().toISOString(),
                        selfie_out_url: publicURL,
                    })
                    .eq('id', todayAttendance.id);
                if (error) throw error;
                setMessage('Absen pulang berhasil!');
            }
            
             const { data: newData } = await supabase.from('attendance').select('*').eq('user_nis', user.nis).eq('date', dateStr).maybeSingle();
             if (newData) setTodayAttendance(newData);

        } catch (error) {
            console.error("Error saving attendance: ", error);
            setMessage(`Terjadi kesalahan: ${error.message}`);
        } finally {
            setTimeout(() => setMessage(''), 5000);
        }
    };

    if (loading) return <div className="text-center p-8">Memeriksa status absensi...</div>

    return (
        <div className="container mx-auto">
            {showCamera && <CameraModal onCapture={handleSelfieCapture} onCancel={() => setShowCamera(false)} />}
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Dasbor Guru</h2>
                {message && <div className={`mb-4 p-3 text-center rounded-lg ${message.includes('berhasil') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message}</div>}

                {!settings ? <div className="text-center p-4 bg-yellow-100 text-yellow-800 rounded-lg">Memuat pengaturan jam...</div> :
                <div className="grid md:grid-cols-2 gap-6">
                    <div className={`p-6 rounded-lg text-center transition-all ${!todayAttendance ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        <h3 className="text-xl font-semibold mb-3">Absen Masuk ({String(settings.teacher_checkin_start).padStart(2, '0')}:00 - {String(settings.teacher_checkin_end).padStart(2, '0')}:00)</h3>
                        <button onClick={() => handleAttend('in')} disabled={!!todayAttendance} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white text-green-600 font-bold rounded-lg shadow-md hover:bg-green-50 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"><LogIn size={20} /><span>Ambil Selfie Masuk</span></button>
                        {todayAttendance && <p className="text-xs mt-2 text-gray-600">Anda sudah absen masuk hari ini.</p>}
                    </div>
                    <div className={`p-6 rounded-lg text-center transition-all ${todayAttendance && !todayAttendance.time_out ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        <h3 className="text-xl font-semibold mb-3">Absen Pulang ({String(settings.teacher_checkout_start).padStart(2, '0')}:00 - {String(settings.teacher_checkout_end).padStart(2, '0')}:00)</h3>
                        <button onClick={() => handleAttend('out')} disabled={!todayAttendance || !!todayAttendance.time_out} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white text-red-600 font-bold rounded-lg shadow-md hover:bg-red-50 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"><LogOut size={20} /><span>Ambil Selfie Pulang</span></button>
                        {!todayAttendance && <p className="text-xs mt-2 text-gray-600">Anda harus absen masuk terlebih dahulu.</p>}
                        {todayAttendance?.time_out && <p className="text-xs mt-2 text-gray-600">Anda sudah absen pulang hari ini.</p>}
                    </div>
                </div>
                }

                {todayAttendance && (
                    <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-bold text-lg mb-2">Rekap Absensi Hari Ini</h3>
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            {todayAttendance.selfie_in_url && (
                                <div className="text-center">
                                    <img src={todayAttendance.selfie_in_url} alt="Selfie Masuk" className="w-32 h-32 object-cover rounded-lg mx-auto shadow-sm" />
                                    <p className="text-sm mt-1">Masuk: {new Date(todayAttendance.time_in).toLocaleTimeString('id-ID')}</p>
                                </div>
                            )}
                            {todayAttendance.selfie_out_url && (
                                <div className="text-center">
                                    <img src={todayAttendance.selfie_out_url} alt="Selfie Pulang" className="w-32 h-32 object-cover rounded-lg mx-auto shadow-sm" />
                                    <p className="text-sm mt-1">Pulang: {new Date(todayAttendance.time_out).toLocaleTimeString('id-ID')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Komponen Modal Kamera (DIPERBARUI untuk Laptop) ---
const CameraModal = ({ onCapture, onCancel }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [cameraError, setCameraError] = useState('');
    const [isCameraReady, setIsCameraReady] = useState(false);

    useEffect(() => {
        let stream = null;
        const startCamera = async () => {
            if (capturedImage) return;
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error('Fitur kamera tidak didukung di browser ini.');
                }
                
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        setIsCameraReady(true);
                    };
                }
            } catch (err) {
                console.error("Tidak bisa mengakses kamera:", err);
                let message = "Kamera tidak bisa diakses. Pastikan Anda memberikan izin.";
                if (err.name === 'NotAllowedError') {
                    message = 'Anda telah memblokir akses kamera. Harap izinkan di pengaturan browser Anda.';
                } else if (err.name === 'NotFoundError') {
                    message = 'Tidak ada kamera yang ditemukan di perangkat ini.';
                }
                setCameraError(message);
            }
        };
        startCamera();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [capturedImage]);

    const handleCaptureClick = () => {
        if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
            setCapturedImage(canvas.toDataURL('image/jpeg'));
            setCameraError('');
        } else {
            setCameraError('Kamera belum siap. Mohon tunggu sebentar.');
            setTimeout(() => setCameraError(''), 3000);
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        setIsCameraReady(false);
    };

    const handleSend = () => {
        onCapture(capturedImage);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-4 rounded-lg max-w-lg w-full flex flex-col max-h-[90vh]">
                <h3 className="text-lg font-bold mb-4 text-center flex-shrink-0">{capturedImage ? 'Pratinjau Foto' : 'Ambil Selfie'}</h3>
                
                <div className="flex-1 min-h-0 overflow-y-auto">
                    <div className="relative w-full max-w-md mx-auto aspect-square bg-gray-200 rounded-md overflow-hidden">
                        {cameraError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-red-100 text-red-700">
                                <p className="font-semibold">Gagal Mengakses Kamera</p>
                                <p className="text-sm mt-2">{cameraError}</p>
                                <button onClick={onCancel} className="mt-4 px-6 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400">Tutup</button>
                            </div>
                        )}

                        {capturedImage ? (
                            <img src={capturedImage} alt="Pratinjau Selfie" className="w-full h-full object-cover" />
                        ) : (
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                        )}

                        {!isCameraReady && !capturedImage && !cameraError && (
                             <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                                <p className="text-white">Menyalakan kamera...</p>
                            </div>
                        )}
                    </div>
                </div>

                <canvas ref={canvasRef} className="hidden"></canvas>
                
                {!cameraError && (
                    <div className="flex justify-center gap-4 mt-4 flex-shrink-0">
                        {capturedImage ? (
                            <>
                                <button onClick={handleRetake} className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600"><RefreshCw size={20} />Ambil Ulang</button>
                                <button onClick={handleSend} className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"><Send size={20} />Kirim</button>
                            </>
                        ) : (
                            <>
                                <button onClick={handleCaptureClick} disabled={!isCameraReady} className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400"><Camera size={20} />Ambil Gambar</button>
                                <button onClick={onCancel} className="flex items-center gap-2 px-6 py-3 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400"><X size={20} />Batal</button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Komponen Pengaturan Jam (Admin) ---
const TimeSettings = ({ supabase, currentSettings }) => {
    const [settings, setSettings] = useState(currentSettings);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSave = async () => {
        setLoading(true);
        setMessage('');
        const { data, error } = await supabase
            .from('settings')
            .update({
                checkin_start_hour: settings.checkin_start_hour,
                checkin_end_hour: settings.checkin_end_hour,
                checkout_start_hour: settings.checkout_start_hour,
                checkout_end_hour: settings.checkout_end_hour,
                teacher_checkin_start: settings.teacher_checkin_start,
                teacher_checkin_end: settings.teacher_checkin_end,
                teacher_checkout_start: settings.teacher_checkout_start,
                teacher_checkout_end: settings.teacher_checkout_end,
            })
            .eq('id', settings.id);
        
        if (error) {
            setMessage(`Gagal menyimpan: ${error.message}`);
        } else {
            setMessage('Pengaturan berhasil disimpan! Halaman akan dimuat ulang.');
            setTimeout(() => window.location.reload(), 1500);
        }
        setLoading(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: parseInt(value) }));
    };

    if (!settings) return <p>Memuat pengaturan...</p>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Pengaturan Jam Absensi</h2>
            {message && <p className={`p-3 text-center rounded-lg ${message.includes('berhasil') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message}</p>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border rounded-lg space-y-4">
                    <h3 className="font-bold text-lg text-center">Untuk Siswa</h3>
                    <div>
                        <h4 className="font-semibold mb-2">Jam Masuk</h4>
                        <div className="flex items-center gap-2">
                            <input type="number" name="checkin_start_hour" value={settings.checkin_start_hour} onChange={handleChange} min="0" max="23" className="w-full p-2 border rounded-md" />
                            <span>-</span>
                            <input type="number" name="checkin_end_hour" value={settings.checkin_end_hour} onChange={handleChange} min="0" max="23" className="w-full p-2 border rounded-md" />
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Jam Pulang</h4>
                        <div className="flex items-center gap-2">
                            <input type="number" name="checkout_start_hour" value={settings.checkout_start_hour} onChange={handleChange} min="0" max="23" className="w-full p-2 border rounded-md" />
                            <span>-</span>
                            <input type="number" name="checkout_end_hour" value={settings.checkout_end_hour} onChange={handleChange} min="0" max="23" className="w-full p-2 border rounded-md" />
                        </div>
                    </div>
                </div>
                <div className="p-4 border rounded-lg space-y-4">
                    <h3 className="font-bold text-lg text-center">Untuk Guru</h3>
                    <div>
                        <h4 className="font-semibold mb-2">Jam Masuk</h4>
                        <div className="flex items-center gap-2">
                            <input type="number" name="teacher_checkin_start" value={settings.teacher_checkin_start} onChange={handleChange} min="0" max="23" className="w-full p-2 border rounded-md" />
                            <span>-</span>
                            <input type="number" name="teacher_checkin_end" value={settings.teacher_checkin_end} onChange={handleChange} min="0" max="23" className="w-full p-2 border rounded-md" />
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Jam Pulang</h4>
                        <div className="flex items-center gap-2">
                            <input type="number" name="teacher_checkout_start" value={settings.teacher_checkout_start} onChange={handleChange} min="0" max="23" className="w-full p-2 border rounded-md" />
                            <span>-</span>
                            <input type="number" name="teacher_checkout_end" value={settings.teacher_checkout_end} onChange={handleChange} min="0" max="23" className="w-full p-2 border rounded-md" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="text-xs text-gray-500">
                <p>* Jam menggunakan format 24 jam. Contoh: 7 untuk jam 7 pagi, 13 untuk jam 1 siang.</p>
                <p>* "Selesai" berarti absensi ditutup PADA jam tersebut. Contoh: Selesai jam 8 berarti bisa absen sampai 07:59.</p>
            </div>
            <button onClick={handleSave} disabled={loading} className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400">
                {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
        </div>
    );
};

// --- Komponen Dasbor Admin ---
const AdminDashboard = ({ supabase, settings }) => {
    const [activeMenu, setActiveMenu] = useState('report');
    const renderContent = () => {
        switch (activeMenu) {
            case 'report': return <AttendanceReport supabase={supabase} />;
            case 'students': return <StudentManagement supabase={supabase} />;
            case 'teachers': return <TeacherManagement supabase={supabase} />;
            case 'classes': return <ClassManagement supabase={supabase} />;
            case 'settings': return <TimeSettings supabase={supabase} currentSettings={settings} />;
            default: return <AttendanceReport supabase={supabase} />;
        }
    };
    return (
        <div className="container mx-auto">
            <div className="flex flex-col md:flex-row gap-8">
                <aside className="md:w-1/4">
                    <div className="bg-white p-4 rounded-xl shadow-lg">
                        <h3 className="font-bold text-lg mb-4">Menu Admin</h3>
                        <nav className="flex flex-col gap-2">
                            <button onClick={() => setActiveMenu('report')} className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors ${activeMenu === 'report' ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}><FileDown size={20} /> Laporan Kehadiran</button>
                            <button onClick={() => setActiveMenu('students')} className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors ${activeMenu === 'students' ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}><Users size={20} /> Daftar Siswa</button>
                             <button onClick={() => setActiveMenu('teachers')} className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors ${activeMenu === 'teachers' ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}><UserCheck size={20} /> Daftar Guru</button>
                            <button onClick={() => setActiveMenu('classes')} className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors ${activeMenu === 'classes' ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}><BookCopy size={20} /> Daftar Kelas</button>
                            <button onClick={() => setActiveMenu('settings')} className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors ${activeMenu === 'settings' ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}><Clock size={20} /> Pengaturan Jam</button>
                        </nav>
                    </div>
                </aside>
                <section className="flex-1">{renderContent()}</section>
            </div>
        </div>
    );
};

// --- Komponen Manajemen Kelas ---
const ClassManagement = ({ supabase }) => {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newClassName, setNewClassName] = useState('');
    const [message, setMessage] = useState('');
    const [editingClassId, setEditingClassId] = useState(null);
    const [editingClassName, setEditingClassName] = useState('');

    useEffect(() => {
        if (!supabase) return;
        const fetchClasses = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('classes').select('*').order('name');
            setClasses(data || []);
            setLoading(false);
        };
        fetchClasses();
    }, [supabase]);

    const handleAddClass = async (e) => {
        e.preventDefault();
        if (!newClassName.trim()) { setMessage({ type: 'error', text: 'Nama kelas tidak boleh kosong.' }); return; }
        const { data, error } = await supabase.from('classes').insert({ name: newClassName.trim() }).select();
        if (error) { 
            console.error(error);
            setMessage({ type: 'error', text: 'Gagal menambahkan kelas: ' + error.message }); 
        } else if (data) {
            setMessage({ type: 'success', text: 'Kelas berhasil ditambahkan!' });
            setClasses(currentClasses => [...currentClasses, ...data].sort((a,b) => a.name.localeCompare(b.name)));
            setNewClassName('');
        }
    };

    const handleEditClick = (cls) => {
        setEditingClassId(cls.id);
        setEditingClassName(cls.name);
    };

    const handleCancelEdit = () => {
        setEditingClassId(null);
        setEditingClassName('');
    };

    const handleUpdateClass = async (classId) => {
        const oldName = classes.find(c => c.id === classId)?.name;
        const newName = editingClassName.trim();

        if (!newName || newName === oldName) {
            handleCancelEdit();
            return;
        }

        setMessage({ type: 'info', text: 'Memperbarui data...' });

        const { error: classUpdateError } = await supabase
            .from('classes')
            .update({ name: newName })
            .eq('id', classId);

        if (classUpdateError) {
            setMessage({ type: 'error', text: `Gagal memperbarui kelas: ${classUpdateError.message}` });
            return;
        }

        const { error: usersUpdateError } = await supabase
            .from('users')
            .update({ class: newName })
            .eq('class', oldName);

        if (usersUpdateError) {
            setMessage({ type: 'error', text: `Kelas diperbarui, tapi gagal update data siswa: ${usersUpdateError.message}` });
        } else {
            setMessage({ type: 'success', text: 'Kelas dan data siswa berhasil diperbarui!' });
        }
        
        const { data: updatedClasses } = await supabase.from('classes').select('*').order('name');
        setClasses(updatedClasses || []);
        handleCancelEdit();
    };
    
    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Manajemen Kelas</h2>
                {message && <div className={`p-3 mb-4 rounded-lg text-center ${message.type === 'success' ? 'bg-green-100 text-green-800' : message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{message.text}</div>}
                <form onSubmit={handleAddClass} className="flex gap-4">
                    <input type="text" value={newClassName} onChange={e => setNewClassName(e.target.value)} className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm" placeholder="Contoh: Kelas 11B" />
                    <button type="submit" className="flex items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"><PlusCircle size={20} /> Tambah</button>
                </form>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-700 mb-3">Daftar Kelas Tersedia</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100"><tr><th scope="col" className="px-6 py-3">Nama Kelas</th><th scope="col" className="px-6 py-3">Aksi</th></tr></thead>
                        <tbody>
                            {loading ? <tr><td colSpan="2" className="text-center p-6">Memuat data...</td></tr> : classes.length === 0 ? <tr><td colSpan="2" className="text-center p-6">Belum ada data kelas.</td></tr> :
                                classes.map(c => (
                                    <tr key={c.id} className="bg-white border-b hover:bg-gray-50">
                                        {editingClassId === c.id ? (
                                            <>
                                                <td className="px-6 py-4">
                                                    <input 
                                                        type="text" 
                                                        value={editingClassName} 
                                                        onChange={(e) => setEditingClassName(e.target.value)}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded-md"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 flex items-center gap-4">
                                                    <button onClick={() => handleUpdateClass(c.id)} className="text-green-500 hover:text-green-700"><Check size={20} /></button>
                                                    <button onClick={handleCancelEdit} className="text-gray-500 hover:text-gray-700"><XCircle size={20} /></button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                                                <td className="px-6 py-4">
                                                    <button onClick={() => handleEditClick(c)} className="text-blue-500 hover:text-blue-700"><Edit size={18} /></button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


// --- Komponen Manajemen Siswa ---
const StudentManagement = ({ supabase }) => {
    const [students, setStudents] = useState([]);
    const [classList, setClassList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [nis, setNis] = useState('');
    const [name, setName] = useState('');
    const [studentClass, setStudentClass] = useState('');
    const [message, setMessage] = useState('');
    const [showImporter, setShowImporter] = useState(false);
    const [importerMessage, setImporterMessage] = useState({ type: '', text: '' });
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef(null);
    
    // State untuk mode edit
    const [editingStudentId, setEditingStudentId] = useState(null);
    const [editingStudentNis, setEditingStudentNis] = useState('');
    const [editingStudentName, setEditingStudentName] = useState('');
    const [editingStudentClass, setEditingStudentClass] = useState('');

    useEffect(() => {
        if (showImporter && !window.XLSX) {
            const script = document.createElement('script');
            script.src = 'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js';
            script.async = true;
            script.onload = () => console.log("Pustaka XLSX berhasil dimuat.");
            script.onerror = () => setImporterMessage({ type: 'error', text: 'Gagal memuat pustaka impor. Periksa koneksi internet.' });
            document.body.appendChild(script);
        }
    }, [showImporter]);

    useEffect(() => {
        if (!supabase) return;
        const fetchData = async () => {
            setLoading(true);
            const { data: studentsData } = await supabase.from('users').select('*').eq('role', 'student').order('name');
            const { data: classesData } = await supabase.from('classes').select('*').order('name');
            
            setStudents(studentsData || []);
            setClassList(classesData || []);

            if (classesData && classesData.length > 0) {
                setStudentClass(classesData[0].name);
            }
            setLoading(false);
        };
        fetchData();
    }, [supabase]);

    const handleAddStudent = async (e) => {
        e.preventDefault();
        const { data, error } = await supabase.from('users').insert({ nis, name, class: studentClass, role: 'student' }).select();
        if (error) { setMessage({ type: 'error', text: 'Gagal menambah siswa: ' + error.message }); }
        else if (data) {
            setMessage({ type: 'success', text: 'Siswa berhasil ditambahkan!' });
            setStudents(currentStudents => [...currentStudents, ...data].sort((a,b) => a.name.localeCompare(b.name)));
            setNis(''); setName('');
        }
    };

    const handleEditClick = (student) => {
        setEditingStudentId(student.id);
        setEditingStudentNis(student.nis);
        setEditingStudentName(student.name);
        setEditingStudentClass(student.class);
    };

    const handleCancelEdit = () => {
        setEditingStudentId(null);
        setEditingStudentNis('');
        setEditingStudentName('');
        setEditingStudentClass('');
    };

    const handleUpdateStudent = async (studentId) => {
        const originalStudent = students.find(s => s.id === studentId);
        const newNis = editingStudentNis.trim();
        const newName = editingStudentName.trim();
        const newClass = editingStudentClass;

        if (!newName || !newNis || !newClass) {
            setMessage({ type: 'error', text: 'NIS, Nama, dan Kelas tidak boleh kosong.' });
            return;
        }

        setMessage({ type: 'info', text: 'Memperbarui data siswa...' });

        // Update tabel users
        const { error: userError } = await supabase
            .from('users')
            .update({ nis: newNis, name: newName, class: newClass })
            .eq('id', studentId);

        if (userError) {
            setMessage({ type: 'error', text: `Gagal memperbarui data siswa: ${userError.message}` });
            return;
        }

        // Update tabel attendance jika NIS atau Nama berubah
        if (originalStudent.nis !== newNis || originalStudent.name !== newName) {
            const { error: attendanceError } = await supabase
                .from('attendance')
                .update({ user_nis: newNis, name: newName })
                .eq('user_nis', originalStudent.nis);
            
            if (attendanceError) {
                 setMessage({ type: 'warning', text: 'Data siswa diperbarui, tapi gagal update riwayat absensi.' });
            } else {
                 setMessage({ type: 'success', text: 'Data siswa dan riwayat absensi berhasil diperbarui.' });
            }
        } else {
             setMessage({ type: 'success', text: 'Data siswa berhasil diperbarui.' });
        }

        const { data } = await supabase.from('users').select('*').eq('role', 'student').order('name');
        setStudents(data || []);
        handleCancelEdit();
    };


    const handleDownloadTemplate = () => {
        if (!window.XLSX) {
            alert("Pustaka impor belum siap, coba lagi dalam beberapa detik.");
            return;
        }
        const sampleData = [{ nis: '123456', name: 'Budi Santoso', class: '10A' }];
        const worksheet = window.XLSX.utils.json_to_sheet(sampleData);
        const workbook = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(workbook, worksheet, "Siswa");
        window.XLSX.writeFile(workbook, "template_siswa.xlsx");
    };

    const handleImport = () => {
        const file = fileInputRef.current.files[0];
        if (!file) {
            setImporterMessage({ type: 'error', text: 'Silakan pilih file terlebih dahulu.' });
            return;
        }
        if (!window.XLSX) {
            setImporterMessage({ type: 'error', text: 'Pustaka impor belum siap. Mohon tunggu dan coba lagi.' });
            return;
        }

        setIsImporting(true);
        setImporterMessage({ type: 'info', text: 'Membaca file...' });
        
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = event.target.result;
                const workbook = window.XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = window.XLSX.utils.sheet_to_json(worksheet);

                if (json.length === 0) {
                    throw new Error("File Excel kosong atau format tidak sesuai.");
                }

                const newStudents = json.map(row => {
                    if (!row.nis || !row.name || !row.class) {
                        throw new Error(`Data tidak lengkap pada baris: ${JSON.stringify(row)}. Pastikan kolom 'nis', 'name', dan 'class' terisi.`);
                    }
                    return {
                        nis: String(row.nis),
                        name: String(row.name),
                        class: String(row.class),
                        role: 'student'
                    };
                });

                setImporterMessage({ type: 'info', text: `Menambahkan ${newStudents.length} siswa ke database...` });

                const { error } = await supabase.from('users').insert(newStudents);

                if (error) {
                    throw error;
                }

                setImporterMessage({ type: 'success', text: `${newStudents.length} siswa berhasil diimpor!` });
                const { data: studentsData } = await supabase.from('users').select('*').eq('role', 'student').order('name');
                setStudents(studentsData || []);
                fileInputRef.current.value = ""; 

            } catch (error) {
                console.error("Import error:", error);
                setImporterMessage({ type: 'error', text: `Gagal mengimpor: ${error.message}` });
            } finally {
                setIsImporting(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Manajemen Siswa</h2>
                    <button onClick={() => setShowImporter(!showImporter)} className="flex items-center gap-2 py-2 px-4 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200">
                        <UploadCloud size={16} />
                        {showImporter ? 'Tutup Impor' : 'Impor dari Excel'}
                    </button>
                </div>

                {showImporter && (
                    <div className="p-4 my-4 border-t border-b">
                        <h3 className="font-bold text-lg mb-2">Impor Siswa dari Excel</h3>
                        {importerMessage.text && <div className={`p-3 mb-4 rounded-lg text-center text-sm ${importerMessage.type === 'success' ? 'bg-green-100 text-green-800' : importerMessage.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{importerMessage.text}</div>}
                        <div className="space-y-3">
                            <p className="text-sm text-gray-600">1. Unduh template untuk memastikan format kolom sudah benar.</p>
                            <button onClick={handleDownloadTemplate} className="flex items-center gap-2 text-sm text-blue-600 hover:underline"><Download size={16}/>Unduh Template</button>
                            <p className="text-sm text-gray-600">2. Pilih file Excel (.xlsx) yang sudah diisi.</p>
                            <input type="file" ref={fileInputRef} accept=".xlsx, .xls" className="text-sm" />
                            <p className="text-sm text-gray-600">3. Klik tombol impor untuk memulai proses.</p>
                            <button onClick={handleImport} disabled={isImporting} className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400">
                                {isImporting ? 'Mengimpor...' : 'Impor Siswa'}
                            </button>
                        </div>
                    </div>
                )}
                
                {message && <div className={`p-3 mb-4 rounded-lg text-center ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}
                <form onSubmit={handleAddStudent} className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700">NIS (6 Digit Angka)</label><input type="text" value={nis} onChange={e => setNis(e.target.value)} maxLength="6" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Contoh: 123456" /></div>
                    <div><label className="block text-sm font-medium text-gray-700">Nama Lengkap</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Nama Siswa" /></div>
                    <div><label className="block text-sm font-medium text-gray-700">Kelas</label><select value={studentClass} onChange={e => setStudentClass(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md">{classList.length === 0 ? <option disabled>Buat kelas dahulu</option> : classList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
                    <button type="submit" className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"><PlusCircle size={20} /> Tambah Siswa (Manual)</button>
                </form>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Daftar Siswa</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100"><tr><th className="px-6 py-3">NIS</th><th className="px-6 py-3">Nama</th><th className="px-6 py-3">Kelas</th><th className="px-6 py-3">Aksi</th></tr></thead>
                        <tbody>
                            {loading ? <tr><td colSpan="4" className="text-center p-6">Memuat...</td></tr> : students.length === 0 ? <tr><td colSpan="4" className="text-center p-6">Belum ada data siswa.</td></tr> :
                                students.map(s => (
                                    <tr key={s.id} className="bg-white border-b hover:bg-gray-50">
                                        {editingStudentId === s.id ? (
                                            <>
                                                <td className="px-6 py-4"><input type="text" value={editingStudentNis} onChange={e => setEditingStudentNis(e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                                                <td className="px-6 py-4"><input type="text" value={editingStudentName} onChange={e => setEditingStudentName(e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                                                <td className="px-6 py-4">
                                                    <select value={editingStudentClass} onChange={e => setEditingStudentClass(e.target.value)} className="w-full px-2 py-1 border rounded bg-white">
                                                        {classList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 flex items-center gap-4">
                                                    <button onClick={() => handleUpdateStudent(s.id)} className="text-green-500 hover:text-green-700"><Check size={20} /></button>
                                                    <button onClick={handleCancelEdit} className="text-gray-500 hover:text-gray-700"><XCircle size={20} /></button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-6 py-4">{s.nis}</td>
                                                <td className="px-6 py-4">{s.name}</td>
                                                <td className="px-6 py-4">{s.class}</td>
                                                <td className="px-6 py-4">
                                                    <button onClick={() => handleEditClick(s)} className="text-blue-500 hover:text-blue-700"><Edit size={18} /></button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- Komponen Manajemen Guru ---
const TeacherManagement = ({ supabase }) => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [id, setId] = useState('');
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [editingTeacherId, setEditingTeacherId] = useState(null);
    const [editingTeacherName, setEditingTeacherName] = useState('');
    const [editingTeacherNis, setEditingTeacherNis] = useState('');

    useEffect(() => {
        if (!supabase) return;
        const fetchTeachers = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('users').select('*').eq('role', 'teacher').order('name');
            setTeachers(data || []);
            setLoading(false);
        };
        fetchTeachers();
    }, [supabase]);

    const handleAddTeacher = async (e) => {
        e.preventDefault();
        const { data, error } = await supabase.from('users').insert({ nis: id, name, role: 'teacher' }).select();
        if (error) { setMessage({ type: 'error', text: 'Gagal menambah guru: ' + error.message }); }
        else if (data) {
            setMessage({ type: 'success', text: 'Guru berhasil ditambahkan!' });
            setTeachers(current => [...current, ...data].sort((a,b) => a.name.localeCompare(b.name)));
            setId(''); setName('');
        }
    };
    
    const handleEditClick = (teacher) => {
        setEditingTeacherId(teacher.id);
        setEditingTeacherNis(teacher.nis);
        setEditingTeacherName(teacher.name);
    };

    const handleCancelEdit = () => {
        setEditingTeacherId(null);
        setEditingTeacherNis('');
        setEditingTeacherName('');
    };

    const handleUpdateTeacher = async (teacherId) => {
        const originalTeacher = teachers.find(t => t.id === teacherId);
        const newNis = editingTeacherNis.trim();
        const newName = editingTeacherName.trim();

        if (!newName || !newNis) {
            setMessage({ type: 'error', text: 'ID dan Nama tidak boleh kosong.' });
            return;
        }

        setMessage({ type: 'info', text: 'Memperbarui data guru...' });

        const { error: userError } = await supabase
            .from('users')
            .update({ nis: newNis, name: newName })
            .eq('id', teacherId);

        if (userError) {
            setMessage({ type: 'error', text: `Gagal memperbarui data guru: ${userError.message}` });
            return;
        }
        
        const { error: attendanceError } = await supabase
            .from('attendance')
            .update({ user_nis: newNis, name: newName })
            .eq('user_nis', originalTeacher.nis);

        if (attendanceError) {
            setMessage({ type: 'warning', text: 'Data guru diperbarui, tapi gagal update riwayat absensi.' });
        } else {
            setMessage({ type: 'success', text: 'Data guru berhasil diperbarui.' });
        }

        const { data } = await supabase.from('users').select('*').eq('role', 'teacher').order('name');
        setTeachers(data || []);
        handleCancelEdit();
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Manajemen Guru</h2>
                {message.text && <div className={`p-3 mb-4 rounded-lg text-center ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}
                <form onSubmit={handleAddTeacher} className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700">ID Guru (NIP, dll)</label><input type="text" value={id} onChange={e => setId(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Contoh: G001" /></div>
                    <div><label className="block text-sm font-medium text-gray-700">Nama Lengkap</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Nama Guru" /></div>
                    <button type="submit" className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"><PlusCircle size={20} /> Tambah Guru</button>
                </form>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Daftar Guru</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100"><tr><th className="px-6 py-3">ID</th><th className="px-6 py-3">Nama</th><th className="px-6 py-3">Aksi</th></tr></thead>
                        <tbody>
                            {loading ? <tr><td colSpan="3" className="text-center p-6">Memuat...</td></tr> : teachers.length === 0 ? <tr><td colSpan="3" className="text-center p-6">Belum ada data guru.</td></tr> :
                                teachers.map(t => (
                                    <tr key={t.id} className="bg-white border-b hover:bg-gray-50">
                                        {editingTeacherId === t.id ? (
                                            <>
                                                <td className="px-6 py-4"><input type="text" value={editingTeacherNis} onChange={e => setEditingTeacherNis(e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                                                <td className="px-6 py-4"><input type="text" value={editingTeacherName} onChange={e => setEditingTeacherName(e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                                                <td className="px-6 py-4 flex items-center gap-4">
                                                    <button onClick={() => handleUpdateTeacher(t.id)} className="text-green-500 hover:text-green-700"><Check size={20} /></button>
                                                    <button onClick={handleCancelEdit} className="text-gray-500 hover:text-gray-700"><XCircle size={20} /></button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-6 py-4">{t.nis}</td>
                                                <td className="px-6 py-4">{t.name}</td>
                                                <td className="px-6 py-4"><button onClick={() => handleEditClick(t)} className="text-blue-500 hover:text-blue-700"><Edit size={18} /></button></td>
                                            </>
                                        )}
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


// --- Komponen Laporan Kehadiran (Admin) ---
const AttendanceReport = ({ supabase }) => {
    // State untuk laporan harian
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    
    // State untuk filter umum
    const [filterClass, setFilterClass] = useState('Semua');
    const [filterRole, setFilterRole] = useState('student');
    const [filterTeacher, setFilterTeacher] = useState('Semua');
    const [filterStudent, setFilterStudent] = useState('Semua');
    const [classList, setClassList] = useState([]);
    const [teacherList, setTeacherList] = useState([]);
    const [studentList, setStudentList] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    
    // State untuk input manual
    const [showManualInput, setShowManualInput] = useState(false);
    
    // State untuk unduh laporan bulanan
    const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadMessage, setDownloadMessage] = useState('');
    
    // State untuk unduh laporan semester
    const [isDownloadingSemester, setIsDownloadingSemester] = useState(false);
    const [semesterDownloadMessage, setSemesterDownloadMessage] = useState('');


    useEffect(() => {
        if (!window.XLSX) {
            const script = document.createElement('script');
            script.src = 'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js';
            script.async = true;
            script.onload = () => console.log("Pustaka XLSX dimuat untuk Laporan.");
            script.onerror = () => console.error("Gagal memuat pustaka XLSX.");
            document.body.appendChild(script);
        }
    }, []);

    useEffect(() => {
        if (!supabase) return;
        const fetchInitialData = async () => {
            const { data: classData } = await supabase.from('classes').select('name').order('name');
            setClassList(classData || []);
            
            const { data: userData } = await supabase.from('users').select('*').order('name');
            setAllUsers(userData || []);
            
            const teachers = (userData || []).filter(user => user.role === 'teacher');
            setTeacherList(teachers);

            const students = (userData || []).filter(user => user.role === 'student');
            setStudentList(students);
        };
        fetchInitialData();
    }, [supabase]);
    
    useEffect(() => {
        setFilterStudent('Semua');
    }, [filterClass]);

    const generateDailyReport = async () => {
        if (!supabase) return;
        setLoading(true);
        setError('');
        try {
            let userQuery = supabase.from('users').select('*');

            if (filterRole !== 'Semua') {
                userQuery = userQuery.eq('role', filterRole);
            }
            if (filterRole === 'student') {
                if (filterStudent !== 'Semua') {
                    userQuery = userQuery.eq('nis', filterStudent);
                } else if (filterClass !== 'Semua') {
                    userQuery = userQuery.eq('class', filterClass);
                }
            }
            if (filterRole === 'teacher' && filterTeacher !== 'Semua') {
                userQuery = userQuery.eq('nis', filterTeacher);
            }
            userQuery = userQuery.order('name');

            const { data: users, error: userError } = await userQuery;
            if (userError) throw userError;
            
            const userList = users || [];
            if (userList.length === 0) {
                setReportData([]);
                setLoading(false);
                return;
            }

            const userNisList = userList.map(u => u.nis);

            const { data: attendanceData, error: attendanceError } = await supabase
                .from('attendance')
                .select('*')
                .eq('date', filterDate)
                .in('user_nis', userNisList);
            
            if (attendanceError) throw attendanceError;

            const mergedData = userList.map(user => {
                const attendanceRecord = (attendanceData || []).find(att => att.user_nis === user.nis);
                const status = attendanceRecord?.status || (attendanceRecord ? 'Hadir' : 'Alpha');
                return { ...user, ...attendanceRecord, status, id: user.id };
            });

            setReportData(mergedData);
        } catch (err) {
            console.error("Gagal memuat data laporan harian:", err);
            setError('Gagal mengambil data harian. Coba lagi.');
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        generateDailyReport();

        const channel = supabase.channel('attendance_report_changes')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'attendance',
                filter: `date=eq.${filterDate}` 
            },
            (payload) => {
                generateDailyReport();
            })
            .subscribe();
        
        return () => {
            supabase.removeChannel(channel);
        };
    }, [filterDate, filterClass, filterRole, filterTeacher, filterStudent, supabase]);
    
    const handleDownloadDailyReport = () => {
        if (!window.XLSX) {
            alert("Fitur unduh belum siap. Coba lagi sebentar.");
            return;
        }
        if (reportData.length === 0) {
            alert("Tidak ada data untuk diunduh.");
            return;
        }
        
        const idHeader = filterRole === 'teacher' ? 'ID Guru' : 'NIS/ID';
        const dataToExport = reportData.map(item => ({
            [idHeader]: item.nis,
            'Nama': item.name,
            'Kelas/Peran': item.role === 'student' ? item.class : 'Guru',
            'Status': item.status,
            'Jam Masuk': item.time_in ? new Date(item.time_in).toLocaleTimeString('id-ID') : '-',
            'Jam Pulang': item.time_out ? new Date(item.time_out).toLocaleTimeString('id-ID') : '-',
            'Keterangan': item.keterangan || '-'
        }));

        const worksheet = window.XLSX.utils.json_to_sheet(dataToExport);
        const workbook = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(workbook, worksheet, `Laporan ${filterDate}`);
        window.XLSX.writeFile(workbook, `Laporan_Harian_${filterDate}.xlsx`);
    };

    const handleDownloadMonthlyReport = async () => {
        if (!window.XLSX) {
            setDownloadMessage('Pustaka unduh belum siap, coba lagi.');
            return;
        }
        setIsDownloading(true);
        setDownloadMessage('Mempersiapkan data...');

        try {
            const [year, month] = filterMonth.split('-');
            const startDate = `${year}-${month}-01`;
            const endDate = new Date(year, month, 0).toISOString().split('T')[0];
            const daysInMonth = new Date(year, month, 0).getDate();

            let userQuery = supabase.from('users').select('nis, name, class, role');
            if (filterRole !== 'Semua') userQuery = userQuery.eq('role', filterRole);
            if (filterRole === 'student') {
                if (filterStudent !== 'Semua') {
                    userQuery = userQuery.eq('nis', filterStudent);
                } else if (filterClass !== 'Semua') {
                    userQuery = userQuery.eq('class', filterClass);
                }
            }
            if (filterRole === 'teacher' && filterTeacher !== 'Semua') {
                userQuery = userQuery.eq('nis', filterTeacher);
            }
            const { data: users, error: userError } = await userQuery.order('name');
            if (userError) throw userError;
            if (!users || users.length === 0) {
                throw new Error("Tidak ada pengguna yang cocok dengan filter yang dipilih.");
            }

            setDownloadMessage(`Mengambil data absensi untuk ${users.length} pengguna...`);

            const userNisList = users.map(u => u.nis);
            const { data: attendance, error: attendanceError } = await supabase
                .from('attendance')
                .select('user_nis, date, status, keterangan')
                .in('user_nis', userNisList)
                .gte('date', startDate)
                .lte('date', endDate);
            if (attendanceError) throw attendanceError;

            setDownloadMessage('Menyusun laporan Excel...');
            const idHeader = filterRole === 'teacher' ? 'ID Guru' : 'NIS';
            const dataForSheet = [];
            
            users.forEach(user => {
                for (let i = 1; i <= daysInMonth; i++) {
                    const dateStr = `${year}-${month}-${String(i).padStart(2, '0')}`;
                    const dayRecord = attendance.find(a => a.user_nis === user.nis && a.date === dateStr);
                    
                    dataForSheet.push({
                        [idHeader]: user.nis,
                        'Nama': user.name,
                        'Kelas/Peran': user.role === 'student' ? user.class : 'Guru',
                        'Tanggal': dateStr,
                        'Status': dayRecord ? dayRecord.status : 'Alpha',
                        'Keterangan': dayRecord ? (dayRecord.keterangan || '-') : '-',
                    });
                }
            });

            const worksheet = window.XLSX.utils.json_to_sheet(dataForSheet);
            const workbook = window.XLSX.utils.book_new();
            window.XLSX.utils.book_append_sheet(workbook, worksheet, `Laporan ${filterMonth}`);
            
            const fileName = `Laporan_Bulanan_${filterRole}_${filterMonth}.xlsx`;
            window.XLSX.writeFile(workbook, fileName);
            setDownloadMessage('Laporan berhasil diunduh!');

        } catch (err) {
            console.error("Gagal mengunduh laporan bulanan:", err);
            setDownloadMessage(`Gagal: ${err.message}`);
        } finally {
            setIsDownloading(false);
            setTimeout(() => setDownloadMessage(''), 5000);
        }
    };
    
    const handleDownloadSemesterReport = async (semester) => {
        if (!window.XLSX) {
            setSemesterDownloadMessage('Pustaka unduh belum siap, coba lagi.');
            return;
        }
        setIsDownloadingSemester(true);
        setSemesterDownloadMessage('Mempersiapkan data pengguna...');

        try {
            // 1. Ambil daftar pengguna sesuai filter
            let userQuery = supabase.from('users').select('nis, name, class, role');
            if (filterRole !== 'Semua') userQuery = userQuery.eq('role', filterRole);
            if (filterRole === 'student') {
                if (filterStudent !== 'Semua') {
                    userQuery = userQuery.eq('nis', filterStudent);
                } else if (filterClass !== 'Semua') {
                    userQuery = userQuery.eq('class', filterClass);
                }
            }
            if (filterRole === 'teacher' && filterTeacher !== 'Semua') {
                userQuery = userQuery.eq('nis', filterTeacher);
            }
            const { data: users, error: userError } = await userQuery.order('name');
            if (userError) throw userError;
            if (!users || users.length === 0) {
                throw new Error("Tidak ada pengguna yang cocok dengan filter yang dipilih untuk dibuatkan laporan.");
            }

            // 2. Ambil semua data absensi untuk pengguna tersebut dalam rentang semester
            const currentYear = new Date().getFullYear();
            const startDate = semester === 'gasal' ? `${currentYear}-07-01` : `${currentYear}-01-01`;
            const endDate = semester === 'gasal' ? `${currentYear}-12-31` : `${currentYear}-06-30`;
            
            setSemesterDownloadMessage(`Mengambil data absensi untuk ${users.length} pengguna...`);
            const userNisList = users.map(u => u.nis);
            const { data: allAttendance, error: attendanceError } = await supabase
                .from('attendance')
                .select('user_nis, date, status')
                .in('user_nis', userNisList)
                .gte('date', startDate)
                .lte('date', endDate);
            if (attendanceError) throw attendanceError;

            // 3. Proses data dan buat file Excel
            setSemesterDownloadMessage('Menyusun laporan Excel...');
            const workbook = window.XLSX.utils.book_new();
            const monthMap = { "01": "Januari", "02": "Februari", "03": "Maret", "04": "April", "05": "Mei", "06": "Juni", "07": "Juli", "08": "Agustus", "09": "September", "10": "Oktober", "11": "November", "12": "Desember" };
            const monthOrder = semester === 'gasal' 
                ? ["Juli", "Agustus", "September", "Oktober", "November", "Desember"]
                : ["Januari", "Februari", "Maret", "April", "Mei", "Juni"];
            const semesterTitle = semester === 'gasal' ? 'GASAL' : 'GENAP';

            users.forEach(user => {
                const userAttendance = allAttendance.filter(att => att.user_nis === user.nis);
                const statusTemplate = { 'Hadir': 0, 'Sakit': 0, 'Izin': 0, 'Alpha': 0, 'Jumlah': 0 };
                
                const processedData = {};
                monthOrder.forEach(month => {
                    processedData[month] = { ...statusTemplate };
                });

                userAttendance.forEach(record => {
                    const monthIndex = record.date.substring(5, 7);
                    const monthName = monthMap[monthIndex];
                    const status = record.status || 'Alpha';
                    if (processedData[monthName] && processedData[monthName][status] !== undefined) {
                        processedData[monthName][status]++;
                    }
                });

                const tableData = [];
                const semesterTotal = { ...statusTemplate };

                monthOrder.forEach(month => {
                    let monthTotal = 0;
                    Object.keys(statusTemplate).forEach(status => {
                        if (status !== 'Jumlah') {
                            monthTotal += processedData[month][status];
                            semesterTotal[status] += processedData[month][status];
                        }
                    });
                    processedData[month].Jumlah = monthTotal;
                    semesterTotal.Jumlah += monthTotal;

                    tableData.push([
                        month,
                        processedData[month].Hadir,
                        processedData[month].Sakit,
                        processedData[month].Izin,
                        processedData[month].Alpha,
                        processedData[month].Jumlah,
                    ]);
                });

                const dataForSheet = [
                    [`REKAPITULASI KEHADIRAN`],
                    [`SEMESTER ${semesterTitle} TAHUN AJARAN ${currentYear}/${currentYear + 1}`],
                    [], // Empty row
                    ['Nama', user.name],
                    ['Kelas', user.class || 'Guru'],
                    [], // Empty row
                    ['Bulan', 'Hadir', 'Sakit', 'Izin', 'Alpha', 'Jumlah'],
                    ...tableData,
                    [
                        'Total Semester',
                        semesterTotal.Hadir,
                        semesterTotal.Sakit,
                        semesterTotal.Izin,
                        semesterTotal.Alpha,
                        semesterTotal.Jumlah,
                    ]
                ];

                const worksheet = window.XLSX.utils.aoa_to_sheet(dataForSheet);
                const safeSheetName = user.name.replace(/[/\\?*:[\]']/g, '').substring(0, 30);
                window.XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
            });

            const fileName = `Laporan_Semester_${semester.toUpperCase()}_${filterClass !== 'Semua' ? filterClass : 'SemuaKelas'}.xlsx`;
            window.XLSX.writeFile(workbook, fileName);
            setSemesterDownloadMessage('Laporan berhasil diunduh!');

        } catch (err) {
            console.error("Gagal mengunduh laporan semester:", err);
            setSemesterDownloadMessage(`Gagal: ${err.message}`);
        } finally {
            setIsDownloadingSemester(false);
            setTimeout(() => setSemesterDownloadMessage(''), 5000);
        }
    };


    return (
        <div className="bg-white p-6 rounded-xl shadow-lg space-y-8">
            {showManualInput && <ManualAttendanceModal 
                students={allUsers} 
                supabase={supabase} 
                onClose={() => setShowManualInput(false)}
                onSave={generateDailyReport}
                filterDate={filterDate}
            />}
            
            {/* Bagian Filter & Laporan Harian */}
            <div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                    <h2 className="text-2xl font-bold text-gray-800">Laporan Kehadiran</h2>
                    <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-start md:justify-end w-full">
                        <button onClick={() => setShowManualInput(true)} className="flex items-center gap-2 py-2 px-3 text-sm font-medium text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200">
                            <Edit3 size={16} /><span>Input Manual</span>
                        </button>
                        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="p-2 border border-gray-300 rounded-lg bg-white text-sm">
                            <option value="student">Siswa</option>
                            <option value="teacher">Guru</option>
                            <option value="Semua">Semua</option>
                        </select>
                        {filterRole === 'student' && (
                            <>
                                <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="p-2 border border-gray-300 rounded-lg bg-white text-sm">
                                    <option value="Semua">Semua Kelas</option>
                                    {classList.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                </select>
                                <select value={filterStudent} onChange={(e) => setFilterStudent(e.target.value)} className="p-2 border border-gray-300 rounded-lg bg-white text-sm">
                                    <option value="Semua">Semua Siswa</option>
                                    {studentList
                                        .filter(s => filterClass === 'Semua' || s.class === filterClass)
                                        .map(s => <option key={s.id} value={s.nis}>{s.name}</option>)}
                                </select>
                            </>
                        )}
                        {filterRole === 'teacher' && (
                            <select value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)} className="p-2 border border-gray-300 rounded-lg bg-white text-sm">
                                <option value="Semua">Semua Guru</option>
                                {teacherList.map(t => <option key={t.id} value={t.nis}>{t.name}</option>)}
                            </select>
                        )}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <div className="flex items-center gap-4 mb-4">
                        <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="p-2 border border-gray-300 rounded-lg text-sm" />
                         <button onClick={handleDownloadDailyReport} className="flex items-center gap-2 py-2 px-3 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200">
                            <Download size={16} /><span>Unduh Harian</span>
                        </button>
                    </div>
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100"><tr><th className="px-6 py-3">Nama</th><th className="px-6 py-3">Kelas/Peran</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Jam Masuk</th><th className="px-6 py-3">Selfie Masuk</th><th className="px-6 py-3">Jam Pulang</th><th className="px-6 py-3">Selfie Pulang</th><th className="px-6 py-3">Keterangan</th></tr></thead>
                        <tbody>
                            {loading ? <tr><td colSpan="8" className="text-center p-6">Menyusun laporan...</td></tr> : 
                             error ? <tr><td colSpan="8" className="text-center p-6 text-red-600 bg-red-50">{error}</td></tr> :
                             reportData.length === 0 ? <tr><td colSpan="8" className="text-center p-6">Tidak ada data untuk filter yang dipilih.</td></tr> :
                                reportData.map(item => (
                                    <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4">{item.name}</td>
                                        <td className="px-6 py-4">{item.role === 'student' ? item.class : 'Guru'}</td>
                                        <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.status === 'Hadir' ? 'bg-green-100 text-green-800' : item.status === 'Alpha' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{item.status}</span></td>
                                        <td className="px-6 py-4">{item.time_in ? new Date(item.time_in).toLocaleTimeString('id-ID') : '-'}</td>
                                        <td className="px-6 py-4">{item.selfie_in_url ? <a href={item.selfie_in_url} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">Lihat</a> : '-'}</td>
                                        <td className="px-6 py-4">{item.time_out ? new Date(item.time_out).toLocaleTimeString('id-ID') : '-'}</td>
                                        <td className="px-6 py-4">{item.selfie_out_url ? <a href={item.selfie_out_url} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">Lihat</a> : '-'}</td>
                                        <td className="px-6 py-4 text-xs">{item.keterangan || '-'}</td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
            </div>

            <hr className="my-8" />

            {/* Bagian Laporan Bulanan */}
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Unduh Laporan Bulanan</h2>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex flex-col md:flex-row items-center gap-4">
                    <div className="flex-grow">
                        <label htmlFor="month-filter" className="block text-sm font-medium text-gray-700 mb-1">Pilih Bulan & Tahun</label>
                        <input 
                            type="month" 
                            id="month-filter"
                            value={filterMonth} 
                            onChange={(e) => setFilterMonth(e.target.value)} 
                            className="p-2 border border-gray-300 rounded-lg text-sm w-full md:w-auto"
                        />
                    </div>
                    <div className="w-full md:w-auto">
                        <button 
                            onClick={handleDownloadMonthlyReport} 
                            disabled={isDownloading}
                            className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                        >
                            <CalendarDays size={16} />
                            <span>{isDownloading ? 'Mengunduh...' : 'Unduh Laporan Bulanan'}</span>
                        </button>
                    </div>
                </div>
                {downloadMessage && (
                    <p className={`mt-4 text-center text-sm p-2 rounded-md ${downloadMessage.includes('Gagal') ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                        {downloadMessage}
                    </p>
                )}
                <div className="text-xs text-gray-500 mt-2">
                    <p>* Laporan ini akan berisi daftar kehadiran per hari dengan format ke bawah, sesuai filter yang dipilih di atas.</p>
                </div>
            </div>
            
            <hr className="my-8" />

            {/* Bagian Laporan Semester */}
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Unduh Laporan Semester</h2>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex flex-col md:flex-row items-center gap-4">
                    <button 
                        onClick={() => handleDownloadSemesterReport('gasal')} 
                        disabled={isDownloadingSemester}
                        className="flex-1 w-full flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                    >
                        <CalendarDays size={16} />
                        <span>{isDownloadingSemester ? 'Mengunduh...' : 'Unduh Semester Gasal'}</span>
                    </button>
                    <button 
                        onClick={() => handleDownloadSemesterReport('genap')} 
                        disabled={isDownloadingSemester}
                        className="flex-1 w-full flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-purple-400"
                    >
                        <CalendarDays size={16} />
                        <span>{isDownloadingSemester ? 'Mengunduh...' : 'Unduh Semester Genap'}</span>
                    </button>
                </div>
                 {semesterDownloadMessage && (
                    <p className={`mt-4 text-center text-sm p-2 rounded-md ${semesterDownloadMessage.includes('Gagal') ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                        {semesterDownloadMessage}
                    </p>
                )}
                <div className="text-xs text-gray-500 mt-2">
                    <p>* Laporan ini akan menghasilkan file Excel dengan rekapitulasi per bulan, sesuai filter yang dipilih di atas.</p>
                    <p>* Setiap pengguna (siswa/guru) yang terpilih akan dibuatkan lembar (sheet) terpisah di dalam satu file Excel.</p>
                </div>
            </div>
        </div>
    );
};

// --- Komponen Modal Input Absensi Manual ---
const ManualAttendanceModal = ({ students, supabase, onClose, onSave, filterDate }) => {
    const [selectedStudentNis, setSelectedStudentNis] = useState('');
    const [status, setStatus] = useState('Hadir');
    const [timeIn, setTimeIn] = useState('');
    const [timeOut, setTimeOut] = useState('');
    const [keterangan, setKeterangan] = useState('');
    const [message, setMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedStudentNis) {
            setMessage('Silakan pilih pengguna terlebih dahulu.');
            return;
        }
        setIsSaving(true);
        setMessage('');

        const selectedUser = students.find(s => s.nis === selectedStudentNis);
        
        const dataToUpsert = {
            user_nis: selectedUser.nis,
            name: selectedUser.name,
            class: selectedUser.class,
            date: filterDate,
            status: status,
            keterangan: keterangan,
            time_in: timeIn ? new Date(`${filterDate}T${timeIn}`).toISOString() : null,
            time_out: timeOut ? new Date(`${filterDate}T${timeOut}`).toISOString() : null,
        };

        const { error } = await supabase
            .from('attendance')
            .upsert(dataToUpsert, { onConflict: 'user_nis, date' });

        if (error) {
            console.error("Manual input error:", error);
            setMessage(`Gagal menyimpan: ${error.message}`);
        } else {
            setMessage('Data absensi berhasil disimpan!');
            onSave(); // Refresh laporan
            setTimeout(onClose, 1500); // Tutup modal setelah sukses
        }
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
                <h3 className="text-lg font-bold mb-4">Input Absensi Manual ({filterDate})</h3>
                {message && <p className="text-center text-sm mb-4">{message}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Pilih Pengguna</label>
                        <select value={selectedStudentNis} onChange={e => setSelectedStudentNis(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md">
                            <option value="">-- Pilih Pengguna --</option>
                            {students.map(s => <option key={s.id} value={s.nis}>{s.name} ({s.role === 'student' ? s.class : 'Guru'})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Status Kehadiran</label>
                        <select value={status} onChange={e => setStatus(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md">
                            <option>Hadir</option>
                            <option>Izin</option>
                            <option>Sakit</option>
                            <option>Alpha</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Jam Masuk</label>
                            <input type="time" value={timeIn} onChange={e => setTimeIn(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Jam Pulang</label>
                            <input type="time" value={timeOut} onChange={e => setTimeOut(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Keterangan</label>
                        <textarea value={keterangan} onChange={e => setKeterangan(e.target.value)} rows="2" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Contoh: Izin acara keluarga"></textarea>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400">{isSaving ? 'Menyimpan...' : 'Simpan'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

