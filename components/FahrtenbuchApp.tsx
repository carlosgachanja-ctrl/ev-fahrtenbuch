"use client";
import { useState, useEffect } from "react";
import { Fahrt, FahrtenbuchData } from "@/lib/types";
import { loadData, saveData, addFahrt, updateFahrt, deleteFahrt } from "@/lib/store";
import FahrtForm from "./FahrtForm";
import FahrtenListe from "./FahrtenListe";
import StatsDashboard from "./StatsDashboard";
import FahrzeugSettings from "./FahrzeugSettings";

type View = "liste" | "stats" | "fahrzeug";

export default function FahrtenbuchApp() {
  const [data, setData] = useState<FahrtenbuchData | null>(null);
  const [view, setView] = useState<View>("liste");
  const [showForm, setShowForm] = useState(false);
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
              className="bg-green-600 hover:bg-green-500 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2">
              <span>+</span> Fahrt eintragen
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
      <main className="max-w-5xl mx-auto px-4 py-6">
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
    </div>
  );
}
