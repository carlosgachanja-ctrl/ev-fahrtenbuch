"use client";
import { useState, useEffect } from "react";
import { Fahrt, FahrtenbuchData, Ladevorgang } from "@/lib/types";
import { loadData, saveData, addFahrt, updateFahrt, deleteFahrt } from "@/lib/store";
import FahrtForm from "./FahrtForm";
import FahrtenListe from "./FahrtenListe";
import StatsDashboard from "./StatsDashboard";
import FahrzeugSettings from "./FahrzeugSettings";
import SchnellLadeModal from "./SchnellLadeModal";

type View = "liste" | "stats" | "fahrzeug";

export default function FahrtenbuchApp() {
  const [data, setData] = useState<FahrtenbuchData | null>(null);
  const [view, setView] = useState<View>("liste");
  const [showForm, setShowForm] = useState(false);
  const [showLaden, setShowLaden] = useState(false);
  const [editFahrt, setEditFahrt] = useState<Fahrt | null>(null);

  useEffect(() => {
    setData(loadData());
  }, []);

  function refresh() {
    setData(loadData());
  }

  function handleSave(fahrt: Omit<Fahrt, "id" | "erstellt_am" | "geaendert_am">) {
    if (editFahrt) {
      updateFahrt(editFahrt.id, fahrt);
    } else {
      addFahrt(fahrt);
    }
    refresh();
    setShowForm(false);
    setEditFahrt(null);
  }

  function handleSchnellLade(lv: Ladevorgang) {
    const now = new Date().toISOString();
    const datum = lv.startzeit.slice(0, 10);
    const abfahrtszeit = lv.startzeit.slice(11, 16);
    const ankunftszeit = lv.endzeit.slice(11, 16);
    addFahrt({
      datum,
      abfahrtszeit,
      ankunftszeit,
      von: lv.adresse || lv.stationsname || "Ladestation",
      nach: lv.adresse || lv.stationsname || "Ladestation",
      zweck: "privat",
      projekt: "",
      fahrer: "",
      km_start: 0,
      km_ende: 0,
      km_gesamt: 0,
      verbrauch_kwh: lv.geladene_kwh,
      verbrauch_kwh_100km: 0,
      geladen_unterwegs: true,
      ladevorgaenge: [lv],
      notiz: "Schnell-Ladevorgang",
    });
    refresh();
    setShowLaden(false);
  }

  function handleEdit(fahrt: Fahrt) {
    setEditFahrt(fahrt);
    setShowForm(true);
    setView("liste");
  }

  function handleDelete(id: string) {
    if (confirm("Fahrt wirklich löschen?")) {
      deleteFahrt(id);
      refresh();
    }
  }

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f172a" }}>
      <div className="text-slate-400">Lade...</div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#0f172a" }}>

      {/* Schnell-Laden Fullscreen Modal */}
      {showLaden && (
        <SchnellLadeModal
          onSave={handleSchnellLade}
          onCancel={() => setShowLaden(false)}
        />
      )}

      {/* Header */}
      <header className="border-b border-slate-700 sticky top-0 z-10" style={{ background: "#0f172a" }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">EV Fahrtenbuch</h1>
              <p className="text-slate-400 text-xs">{data.fahrzeug.kennzeichen} · {data.fahrzeug.marke} {data.fahrzeug.modell}</p>
            </div>
          </div>
          {!showForm && (
            <button onClick={() => { setEditFahrt(null); setShowForm(true); }}
              className="bg-slate-700 hover:bg-slate-600 text-white font-medium px-3 py-2 rounded-lg transition-colors text-sm">
              + Fahrt
            </button>
          )}
        </div>
        {/* Nav */}
        {!showForm && (
          <div className="max-w-5xl mx-auto px-4 pb-0 flex gap-0 border-t border-slate-800">
            {(["liste", "stats", "fahrzeug"] as View[]).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${view === v ? "border-green-500 text-green-400" : "border-transparent text-slate-400 hover:text-white"}`}>
                {v === "liste" ? "📋 Fahrten" : v === "stats" ? "📊 Auswertung" : "🚗 Fahrzeug"}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 pb-36">
        {showForm ? (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => { setShowForm(false); setEditFahrt(null); }} className="text-slate-400 hover:text-white text-sm">← Zurück</button>
              <h2 className="text-white font-semibold text-lg">{editFahrt ? "Fahrt bearbeiten" : "Neue Fahrt"}</h2>
            </div>
            <FahrtForm
              initial={editFahrt ?? undefined}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditFahrt(null); }}
            />
          </div>
        ) : view === "liste" ? (
          <FahrtenListe fahrten={data.fahrten} onEdit={handleEdit} onDelete={handleDelete} />
        ) : view === "stats" ? (
          <StatsDashboard fahrten={data.fahrten} fahrzeug={data.fahrzeug} />
        ) : (
          <FahrzeugSettings fahrzeug={data.fahrzeug} onSave={fz => { const d = loadData(); d.fahrzeug = fz; saveData(d); refresh(); }} />
        )}
      </main>

      {/* Prominenter Laden-FAB — immer sichtbar */}
      {!showForm && (
        <div className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-6"
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))", background: "linear-gradient(to top, #0f172a 60%, transparent)" }}>
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => setShowLaden(true)}
              className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-bold text-xl text-white transition-all active:scale-95 shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                boxShadow: "0 8px 32px rgba(22, 163, 74, 0.45)",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" stroke="none"/>
              </svg>
              Ladevorgang erfassen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
