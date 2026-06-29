"use client";
import { useState } from "react";
import { Fahrzeug } from "@/lib/types";

interface Props {
  fahrzeug: Fahrzeug;
  onSave: (fz: Fahrzeug) => void;
}

export default function FahrzeugSettings({ fahrzeug, onSave }: Props) {
  const [kennzeichen, setKennzeichen] = useState(fahrzeug.kennzeichen);
  const [marke, setMarke] = useState(fahrzeug.marke);
  const [modell, setModell] = useState(fahrzeug.modell);
  const [baujahr, setBaujahr] = useState(fahrzeug.baujahr.toString());
  const [akku, setAkku] = useState(fahrzeug.akkukapazitaet_kwh.toString());
  const [reichweite, setReichweite] = useState(fahrzeug.reichweite_km.toString());
  const [fgn, setFgn] = useState(fahrzeug.fahrgestellnummer ?? "");
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      ...fahrzeug,
      kennzeichen, marke, modell,
      baujahr: parseInt(baujahr),
      akkukapazitaet_kwh: parseFloat(akku),
      reichweite_km: parseFloat(reichweite),
      fahrgestellnummer: fgn || undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <h2 className="text-white font-semibold text-lg mb-6">🚗 Fahrzeugdaten</h2>
      <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4 max-w-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-slate-400 text-xs font-medium uppercase tracking-wide block mb-1">Kennzeichen</label>
            <input type="text" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 w-full" value={kennzeichen} onChange={e => setKennzeichen(e.target.value)} required />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-medium uppercase tracking-wide block mb-1">Baujahr</label>
            <input type="number" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 w-full" value={baujahr} onChange={e => setBaujahr(e.target.value)} />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-medium uppercase tracking-wide block mb-1">Marke</label>
            <input type="text" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 w-full" value={marke} onChange={e => setMarke(e.target.value)} required />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-medium uppercase tracking-wide block mb-1">Modell</label>
            <input type="text" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 w-full" value={modell} onChange={e => setModell(e.target.value)} required />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-medium uppercase tracking-wide block mb-1">Akkukapazität (kWh)</label>
            <input type="number" step="0.1" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 w-full" value={akku} onChange={e => setAkku(e.target.value)} />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-medium uppercase tracking-wide block mb-1">Reichweite WLTP (km)</label>
            <input type="number" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 w-full" value={reichweite} onChange={e => setReichweite(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-slate-400 text-xs font-medium uppercase tracking-wide block mb-1">Fahrgestellnummer (VIN)</label>
          <input type="text" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-green-500 w-full" placeholder="WXX..." value={fgn} onChange={e => setFgn(e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="bg-green-600 hover:bg-green-500 text-white font-medium px-5 py-2 rounded-lg transition-colors text-sm">Speichern</button>
          {saved && <span className="text-green-400 text-sm">✓ Gespeichert</span>}
        </div>
      </form>
    </div>
  );
}
