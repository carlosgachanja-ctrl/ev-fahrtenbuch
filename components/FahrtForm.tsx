"use client";
import { useState } from "react";
import { Fahrt, Ladevorgang, LadeTyp, Ladestatus, Zweck } from "@/lib/types";
import { genId } from "@/lib/store";
import LadevorgangForm from "./LadevorgangForm";

interface Props {
  initial?: Partial<Fahrt>;
  onSave: (f: Omit<Fahrt, "id" | "erstellt_am" | "geaendert_am">) => void;
  onCancel: () => void;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
function nowTime() {
  return new Date().toTimeString().slice(0, 5);
}

export default function FahrtForm({ initial, onSave, onCancel }: Props) {
  const [datum, setDatum] = useState(initial?.datum ?? today());
  const [abfahrt, setAbfahrt] = useState(initial?.abfahrtszeit ?? nowTime());
  const [ankunft, setAnkunft] = useState(initial?.ankunftszeit ?? "");
  const [von, setVon] = useState(initial?.von ?? "");
  const [nach, setNach] = useState(initial?.nach ?? "");
  const [zweck, setZweck] = useState<Zweck>(initial?.zweck ?? "dienstlich");
  const [projekt, setProjekt] = useState(initial?.projekt ?? "");
  const [fahrer, setFahrer] = useState(initial?.fahrer ?? "");
  const [kmStart, setKmStart] = useState(initial?.km_start?.toString() ?? "");
  const [kmEnde, setKmEnde] = useState(initial?.km_ende?.toString() ?? "");
  const [verbrauch, setVerbrauch] = useState(initial?.verbrauch_kwh?.toString() ?? "");
  const [notiz, setNotiz] = useState(initial?.notiz ?? "");
  const [ladevorgaenge, setLadevorgaenge] = useState<Ladevorgang[]>(initial?.ladevorgaenge ?? []);
  const [showLadeForm, setShowLadeForm] = useState(false);
  const [editLade, setEditLade] = useState<Ladevorgang | null>(null);

  const km = parseFloat(kmEnde) - parseFloat(kmStart);
  const kmGesamt = isNaN(km) ? 0 : km;
  const verbrauchPro100 = kmGesamt > 0 ? (parseFloat(verbrauch) / kmGesamt) * 100 : 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ks = parseFloat(kmStart);
    const ke = parseFloat(kmEnde);
    const vkwh = parseFloat(verbrauch) || 0;
    onSave({
      datum, abfahrtszeit: abfahrt, ankunftszeit: ankunft,
      von, nach, zweck, projekt, fahrer,
      km_start: ks, km_ende: ke, km_gesamt: ke - ks,
      verbrauch_kwh: vkwh,
      verbrauch_kwh_100km: (ke - ks) > 0 ? (vkwh / (ke - ks)) * 100 : 0,
      geladen_unterwegs: ladevorgaenge.length > 0,
      ladevorgaenge, notiz,
    });
  }

  function saveLadevorgang(lv: Ladevorgang) {
    if (editLade) {
      setLadevorgaenge(prev => prev.map(l => l.id === editLade.id ? lv : l));
    } else {
      setLadevorgaenge(prev => [...prev, lv]);
    }
    setShowLadeForm(false);
    setEditLade(null);
  }

  function deleteLade(id: string) {
    setLadevorgaenge(prev => prev.filter(l => l.id !== id));
  }

  const totalGeladenKwh = ladevorgaenge.reduce((s, l) => s + l.geladene_kwh, 0);
  const totalKosten = ladevorgaenge.reduce((s, l) => s + l.kosten_eur, 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Fahrtdaten */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="text-green-400 font-semibold mb-4 flex items-center gap-2">
          <span>🚗</span> Fahrtdaten
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-slate-400 text-xs font-medium uppercase tracking-wide block mb-1">Datum</label>
            <input type="date" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 w-full" value={datum} onChange={e => setDatum(e.target.value)} required />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-medium uppercase tracking-wide block mb-1">Abfahrtszeit</label>
            <input type="time" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 w-full" value={abfahrt} onChange={e => setAbfahrt(e.target.value)} required />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-medium uppercase tracking-wide block mb-1">Ankunftszeit</label>
            <input type="time" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 w-full" value={ankunft} onChange={e => setAnkunft(e.target.value)} />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-medium uppercase tracking-wide block mb-1">Abfahrtsort</label>
            <input type="text" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-green-500 w-full" placeholder="z.B. Berlin Mitte" value={von} onChange={e => setVon(e.target.value)} required />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-medium uppercase tracking-wide block mb-1">Zielort</label>
            <input type="text" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-green-500 w-full" placeholder="z.B. Frankfurt Hbf" value={nach} onChange={e => setNach(e.target.value)} required />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-medium uppercase tracking-wide block mb-1">Fahrer</label>
            <input type="text" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-green-500 w-full" placeholder="Name des Fahrers" value={fahrer} onChange={e => setFahrer(e.target.value)} required />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-medium uppercase tracking-wide block mb-1">Fahrtanlass</label>
            <select className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 w-full cursor-pointer" value={zweck} onChange={e => setZweck(e.target.value as Zweck)}>
              <option value="dienstlich">Dienstlich</option>
              <option value="privat">Privat</option>
              <option value="gemischt">Gemischt</option>
            </select>
          </div>
          {(zweck === "dienstlich" || zweck === "gemischt") && (
            <div>
              <label className="text-slate-400 text-xs font-medium uppercase tracking-wide block mb-1">Projekt / Kunde</label>
              <input type="text" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-green-500 w-full" placeholder="z.B. Kunde XY" value={projekt} onChange={e => setProjekt(e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {/* Kilometerstand & Verbrauch */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="text-blue-400 font-semibold mb-4 flex items-center gap-2">
          <span>⚡</span> Kilometerstand & Verbrauch
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-slate-400 text-xs font-medium uppercase tracking-wide block mb-1">KM-Stand Start</label>
            <input type="number" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-green-500 w-full" placeholder="0" value={kmStart} onChange={e => setKmStart(e.target.value)} required />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-medium uppercase tracking-wide block mb-1">KM-Stand Ende</label>
            <input type="number" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-green-500 w-full" placeholder="0" value={kmEnde} onChange={e => setKmEnde(e.target.value)} required />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-medium uppercase tracking-wide block mb-1">Gefahrene KM</label>
            <div className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-green-400 text-sm font-mono">
              {kmGesamt > 0 ? kmGesamt.toFixed(1) : "—"} km
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-xs font-medium uppercase tracking-wide block mb-1">Verbrauch (kWh)</label>
            <input type="number" step="0.1" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-green-500 w-full" placeholder="0.0" value={verbrauch} onChange={e => setVerbrauch(e.target.value)} />
          </div>
          {verbrauchPro100 > 0 && (
            <div className="col-span-2 md:col-span-4">
              <div className="bg-slate-700/50 rounded-lg px-4 py-2 text-sm flex gap-6">
                <span className="text-slate-400">Verbrauch: <span className="text-white font-mono">{verbrauchPro100.toFixed(1)} kWh/100km</span></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ladevorgänge */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-yellow-400 font-semibold flex items-center gap-2">
            <span>🔌</span> Ladevorgänge ({ladevorgaenge.length})
          </h3>
          <button type="button" onClick={() => { setEditLade(null); setShowLadeForm(true); }}
            className="bg-yellow-600 hover:bg-yellow-500 text-white font-medium px-3 py-1.5 rounded-lg transition-colors text-sm">
            + Ladevorgang
          </button>
        </div>
        {ladevorgaenge.length > 0 && (
          <div className="space-y-2 mb-4">
            {ladevorgaenge.map(lv => (
              <div key={lv.id} className="bg-slate-700/60 rounded-lg p-3 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 text-xs mb-1">
                    <span className="bg-yellow-900/50 text-yellow-300 px-2 py-0.5 rounded">{lv.ladetyp}</span>
                    <span className="bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded">{lv.ladeleistung_kw} kW</span>
                    <span className="bg-green-900/50 text-green-300 px-2 py-0.5 rounded">{lv.geladene_kwh} kWh</span>
                    <span className="text-slate-400">{lv.akkustand_start}% → {lv.akkustand_ende}%</span>
                    <span className="text-slate-400">{lv.kosten_eur.toFixed(2)} €</span>
                  </div>
                  <div className="text-xs text-slate-400 truncate">{lv.stationsname} · {lv.anbieter}</div>
                  <div className="text-xs text-slate-500">{lv.adresse}</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button type="button" onClick={() => { setEditLade(lv); setShowLadeForm(true); }} className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-slate-600">✏️</button>
                  <button type="button" onClick={() => deleteLade(lv.id)} className="text-slate-400 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-slate-600">🗑️</button>
                </div>
              </div>
            ))}
            <div className="text-xs text-slate-400 pt-1 flex gap-4">
              <span>Gesamt geladen: <span className="text-green-400 font-mono">{totalGeladenKwh.toFixed(1)} kWh</span></span>
              <span>Ladekosten: <span className="text-yellow-400 font-mono">{totalKosten.toFixed(2)} €</span></span>
            </div>
          </div>
        )}
        {showLadeForm && (
          <LadevorgangForm
            initial={editLade ?? undefined}
            onSave={saveLadevorgang}
            onCancel={() => { setShowLadeForm(false); setEditLade(null); }}
          />
        )}
      </div>

      {/* Notiz */}
      <div>
        <label className="text-slate-400 text-xs font-medium uppercase tracking-wide block mb-1">Notiz (optional)</label>
        <textarea className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-green-500 w-full resize-none" rows={2} placeholder="Freie Anmerkungen..." value={notiz} onChange={e => setNotiz(e.target.value)} />
      </div>

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel} className="bg-slate-700 hover:bg-slate-600 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm">Abbrechen</button>
        <button type="submit" className="bg-green-600 hover:bg-green-500 text-white font-medium px-6 py-2 rounded-lg transition-colors text-sm">Speichern</button>
      </div>
    </form>
  );
}
