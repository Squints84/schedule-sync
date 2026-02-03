"use client";

import { signIn, signOut, useSession, SessionProvider } from "next-auth/react";
import { useState } from "react";
import { 
  Loader2, 
  CalendarCheck, 
  UploadCloud, 
  Trash2, 
  LogOut, 
  CheckCircle2, 
  Camera,
  AlertCircle
} from "lucide-react";


export default function Home() {
  return (
    <SessionProvider>
      <MainContent />
    </SessionProvider>
  );
}

function MainContent() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [shifts, setShifts] = useState<any[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Handle File Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    setShifts([]);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result;
      try {
        const res = await fetch("/api/extract", {
          method: "POST",
          body: JSON.stringify({ image: base64Image }),
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (data.shifts) setShifts(data.shifts);
      } catch (err) {
        alert("Error parsing image. Please try again.");
      } finally {
        setLoading(false);
      }
    };
  };

  // 2. Remove a specific shift
  const removeShift = (indexToRemove: number) => {
    setShifts((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // 3. Update the Name (Title) of a specific shift
  const updateShiftTitle = (index: number, newTitle: string) => {
    setShifts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], summary: newTitle };
      return updated;
    });
  };

  // 4. Sync Logic
  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        body: JSON.stringify({ shifts }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      
      if (data.success) {
        setSuccessMsg(`Awesome! Added ${data.added} shifts to your calendar.`);
        setShifts([]); // Clear list on success
        setTimeout(() => setSuccessMsg(null), 5000); // Hide message after 5s
      }
    } catch (err) {
      alert("Network error. Check console.");
    } finally {
      setSyncing(false);
    }
  };

  // --- LOGIN SCREEN ---
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-6">
        <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl flex flex-col gap-6 items-center">
          <div className="bg-indigo-100 p-4 rounded-full">
            <CalendarCheck className="w-10 h-10 text-indigo-600" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800">Schedule Sync</h1>
          </div>
          <button
            onClick={() => signIn("google")}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors shadow-lg"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN APP SCREEN ---
  return (
    <div className="min-h-screen bg-slate-50 pb-32"> {/* pb-32 adds space for fixed footer */}
      
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <CalendarCheck className="w-6 h-6 text-indigo-600" />
          <h1 className="text-lg font-bold text-slate-800">Schedule Sync</h1>
        </div>
        <button 
          onClick={() => signOut()} 
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="max-w-md mx-auto px-6 py-8 flex flex-col gap-6">
        
        {/* Success Banner */}
        {successMsg && (
          <div className="bg-green-100 border border-green-200 text-green-800 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {/* Error Banner */}
        {errorMsg && (
          <div className="bg-amber-100 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium flex-1">{errorMsg}</span>
            <button
              onClick={() => setErrorMsg(null)}
              className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-200/50 rounded transition-colors"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {/* Upload Area */}
        <div className={`relative group border-2 border-dashed rounded-2xl p-10 text-center transition-all 
          ${shifts.length === 0 ? 'border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50' : 'border-slate-300 bg-white'}`}
        >
          <input
            type="file"
            accept="image/*"
            // capture="environment"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            disabled={loading}
          />
          <div className="flex flex-col items-center gap-3 text-slate-500 group-hover:text-indigo-600 transition-colors">
            {loading ? (
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            ) : (
              shifts.length === 0 ? <Camera className="w-10 h-10" /> : <UploadCloud className="w-10 h-10" />
            )}
            <span className="font-semibold text-sm">
              {loading ? "Reading schedule..." : (shifts.length === 0 ? "Take a photo" : "Upload another")}
            </span>
          </div>
        </div>

        {/* Shift List */}
        {shifts.length > 0 && (
          <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="flex justify-between items-end px-1">
              <h2 className="font-bold text-slate-700 text-lg">Review Shifts</h2>
              <span className="text-xs text-slate-400 font-medium">{shifts.length} items</span>
            </div>
            
            {shifts.map((shift, idx) => (
              <div 
                key={idx} 
                className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4 items-center group focus-within:ring-2 ring-indigo-500 ring-offset-2 transition-all"
              >
                {/* Date Badge */}
                <div className="flex flex-col items-center justify-center bg-indigo-50 text-indigo-700 w-16 h-16 rounded-lg flex-shrink-0">
                  <span className="text-xs font-bold uppercase">
                    {new Date(shift.start).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className="text-xl font-bold leading-none">
                    {new Date(shift.start).getDate()}
                  </span>
                </div>

                {/* Editable Content */}
                <div className="flex-1 min-w-0">
                  <input 
                    type="text" 
                    value={shift.summary} 
                    onChange={(e) => updateShiftTitle(idx, e.target.value)}
                    className="w-full font-bold text-slate-800 bg-transparent border-b border-transparent focus:border-indigo-300 focus:outline-none placeholder-slate-300 mb-1"
                    placeholder="Shift Name"
                  />
                  <div className="text-sm text-slate-500 truncate">
                    {new Date(shift.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase()} 
                    {" - "} 
                    {new Date(shift.end).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase()}
                  </div>
                </div>

                {/* Delete Action */}
                <button
                  onClick={() => removeShift(idx)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Bottom Bar */}
      {shifts.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full max-w-md mx-auto bg-slate-900 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-slate-200/50 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-70 disabled:scale-100"
          >
            {syncing ? <Loader2 className="animate-spin" /> : <CalendarCheck className="w-6 h-6" />}
            {syncing ? "Syncing..." : "Sync to Calendar"}
          </button>
        </div>
      )}
    </div>
  );
}