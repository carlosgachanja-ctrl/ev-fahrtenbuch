"use client";
import { useState } from "react";
import { Ladevorgang, LadeTyp, Ladestatus } from "@/lib/types";
import { genId } from "@/lib/store";

interface Props {
  onSave: (lv: Ladevorgang) => void;
  onCancel: () => void;
}

function nowISO() {
  const d = new Date();
  return d.toISOString().slice(0, 16);
}

const LADETYPEN: LadeTyp[] = ["AC", "DC", "CCS", "Wallbox", "Haushaltssteckdose"];

export default function SchnellLadeModal({ onSave, onCancel }: Props) {
  const [startzeit, setStartzeit] = useState(nowISO());
  const [endzeit, setEndzeit] = useState("");
  const [ladetyp, setLadetyp] = useState<LadeTyp>("DC");
  const [ladeleistung, setLadeleistung] = useState("");
  const [geladenKwh, setGeladenKwh] = useState("");
  const [akkuStart, setAkkuStart] = useState("");
  const [akkuEnde, setAkkuEnde] = useState("");
  const [anbieter, setAnbieter] = useState("");
  const [stationsname, setStationsname] = useState("");
  const [stationsid, setStationsid] = useState("");
  const [adresse, setAdresse] = useState("");
  const [kosten, setKosten] = useState("");
  const [tarif, setTarif] = useState("");
  const [status, setStatus] = useState<Ladestatus>("vollständig");
  const [notiz, setNotiz] = useState("");

  const ladedauer = (() => {
    if (!startzeit || !endzeit) return null;
    const diff = (new Date(endzeit).getTime() - new Date(startzeit).getTime()) / 60000;
    if (diff <= 0) return null;
    const h = Math.floor(diff / 60);
    const m = Math.round(diff % 60);
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  })();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      id: genId(),
      startzeit: new Date(startzeit).toISOString(),
      endzeit: endzeit ? new Date(endzeit).toISOString() : new Date(startzeit).toISOString(),
      ladetyp,
      ladeleistung_kw: parseFloat(ladeleistung) || 0,
      geladene_kwh: parseFloat(geladenKwh) || 0,
      akkustand_start: parseFloat(akkuStart) || 0,
      akkustand_ende: parseFloat(akkuEnde) || 0,
      anbieter, stationsname, stationsid, adresse,
      kosten_eur: parseFloat(kosten) || 0,
      tarif, status, notiz,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#0f172a" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-700 shrink-0"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}>
        <button onClick={onCancel} className="text-slate-400 hover:text-white p-2 -ml-2 rounded-lg hover:bg-slate-800 transition-colors">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">Ladevorgang</h2>
            <p className="text-slate-400 text-xs">Schnell erfassen</p>
          </div>
        </div>
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto">
        <form id="ladeform" onSubmit={handleSubmit} className="px-4 py-4 space-y-5 pb-32">

          {/* Akkustand – ganz oben, groß */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
            <h3 className="text-slate-300 font-semibold text-sm mb-3 flex items-center gap-2">
              🔋 Akkustand
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-slate-400 text-xs block mb-1">Start %</label>
                <input type="number" min="0" max="100"
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-3 text-white text-xl font-bold text-center focus:outline-none focus:border-green-500"
                  placeholder="20" value={akkuStart} onChange={e => setAkkuStart(e.target.value)} />
              </div>
              <div className="text-slate-500 text-2xl pt-4">→</div>
              <div className="flex-1">
                <label className="text-slate-400 text-xs block mb-1">Ende %</label>
                <input type="number" min="0" max="100"
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-3 text-white text-xl font-bold text-center focus:outline-none focus:border-green-500"
                  placeholder="80" value={akkuEnde} onChange={e => setAkkuEnde(e.target.value)} />
              </div>
            </div>
            {akkuStart && akkuEnde && (
              <div className="mt-3">
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all"
                    style={{ width: `${Math.min(parseFloat(akkuEnde) || 0, 100)}%` }} />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>{akkuStart}%</span>
                  <span className="text-green-400 font-semibold">+{Math.max(0, (parseFloat(akkuEnde) || 0) - (parseFloat(akkuStart) || 0)).toFixed(0)}%</span>
                  <span>{akkuEnde}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Zeit */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
            <h3 className="text-slate-300 font-semibold text-sm mb-3">⏱ Ladezeitraum</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-xs block mb-1">Ladestart</label>
                <input type="datetime-local"
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500"
                  value={startzeit} onChange={e => setStartzeit(e.target.value)} required />
              </div>
              <div>
                <label className="text-slate-400 text-xs block mb-1">Ladeende</label>
                <input type="datetime-local"
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500"
                  value={endzeit} onChange={e => setEndzeit(e.target.value)} />
              </div>
            </div>
            {ladedauer && (
              <div className="mt-2 text-center text-yellow-400 font-semibold text-sm bg-yellow-900/20 rounded-lg py-2">
                ⏱ Ladedauer: {ladedauer}
              </div>
            )}
          </div>

          {/* Energie */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
            <h3 className="text-slate-300 font-semibold text-sm mb-3">⚡ Energie & Leistung</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-xs block mb-1">Geladen (kWh)</label>
                <input type="number" step="0.1"
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-3 text-white text-lg font-bold text-center focus:outline-none focus:border-green-500"
                  placeholder="0.0" value={geladenKwh} onChange={e => setGeladenKwh(e.target.value)} required />
              </div>
              <div>
                <label className="text-slate-400 text-xs block mb-1">Leistung (kW)</label>
                <input type="number" step="0.1"
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-3 text-white text-lg font-bold text-center focus:outline-none focus:border-green-500"
                  placeholder="0.0" value={ladeleistung} onChange={e => setLadeleistung(e.target.value)} />
              </div>
            </div>
            <div className="mt-3">
              <label className="text-slate-400 text-xs block mb-2">Ladetyp / Stecker</label>
              <div className="flex flex-wrap gap-2">
                {LADETYPEN.map(t => (
                  <button key={t} type="button"
                    onClick={() => setLadetyp(t)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${ladetyp === t ? "bg-yellow-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ladestation */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
            <h3 className="text-slate-300 font-semibold text-sm mb-3">📍 Ladestation</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs block mb-1">Anbieter *</label>
                  <input type="text"
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-green-500"
                    placeholder="z.B. IONITY, EnBW" value={anbieter} onChange={e => setAnbieter(e.target.value)} required />
                </div>
                <div>
                  <label className="text-slate-400 text-xs block mb-1">Stationsname *</label>
                  <input type="text"
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-green-500"
                    placeholder="z.B. Autohof A3" value={stationsname} onChange={e => setStationsname(e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-xs block mb-1">Adresse</label>
                <input type="text"
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-green-500"
                  placeholder="Straße, PLZ Stadt" value={adresse} onChange={e => setAdresse(e.target.value)} />
              </div>
              <div>
                <label className="text-slate-400 text-xs block mb-1">EVSE-ID (Stations-ID)</label>
                <input type="text"
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-green-500"
                  placeholder="z.B. DE*ABC*E123456*1" value={stationsid} onChange={e => setStationsid(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Kosten */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
            <h3 className="text-slate-300 font-semibold text-sm mb-3">💶 Kosten</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-xs block mb-1">Betrag (€)</label>
                <input type="number" step="0.01"
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-3 text-white text-lg font-bold text-center focus:outline-none focus:border-green-500"
                  placeholder="0.00" value={kosten} onChange={e => setKosten(e.target.value)} />
              </div>
              <div>
                <label className="text-slate-400 text-xs block mb-1">Tarif / €/kWh</label>
                <input type="text"
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-green-500"
                  placeholder="z.B. 0.59 €/kWh" value={tarif} onChange={e => setTarif(e.target.value)} />
              </div>
            </div>
            {geladenKwh && kosten && (
              <div className="mt-2 text-center text-xs text-slate-400 bg-slate-700/40 rounded-lg py-2">
                ⌀ {(parseFloat(kosten) / parseFloat(geladenKwh)).toFixed(3)} €/kWh
              </div>
            )}
          </div>

          {/* Status & Notiz */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
            <h3 className="text-slate-300 font-semibold text-sm mb-3">📋 Status & Notiz</h3>
            <div className="flex gap-2 mb-3">
              {(["vollständig", "unterbrochen", "fehler"] as Ladestatus[]).map(s => (
                <button key={s} type="button" onClick={() => setStatus(s)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors capitalize ${
                    status === s
                      ? s === "vollständig" ? "bg-green-700 text-white" : s === "fehler" ? "bg-red-700 text-white" : "bg-orange-700 text-white"
                      : "bg-slate-700 text-slate-300"
                  }`}>
                  {s === "vollständig" ? "✓ OK" : s === "unterbrochen" ? "⚠ Abbruch" : "✗ Fehler"}
                </button>
              ))}
            </div>
            <input type="text"
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-green-500"
              placeholder="Notiz (optional)..." value={notiz} onChange={e => setNotiz(e.target.value)} />
          </div>
        </form>
      </div>

      {/* Sticky Save Button */}
      <div className="shrink-0 px-4 py-4 border-t border-slate-700"
        style={{ background: "#0f172a", paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        <button type="submit" form="ladeform"
          className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-bold text-lg py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-900/40">
          <span>⚡</span> Ladevorgang speichern
        </button>
      </div>
    </div>
  );
}
