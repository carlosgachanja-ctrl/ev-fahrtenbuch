"use client";
import { useState } from "react";
import { Ladevorgang, LadeTyp, Ladestatus } from "@/lib/types";
import { genId } from "@/lib/store";

interface Props {
  initial?: Ladevorgang;
  onSave: (lv: Ladevorgang) => void;
  onCancel: () => void;
}

function nowISO() {
  const d = new Date();
  return d.toISOString().slice(0, 16);
}

export default function LadevorgangForm({ initial, onSave, onCancel }: Props) {
  const [startzeit, setStartzeit] = useState(initial?.startzeit?.slice(0, 16) ?? nowISO());
  const [endzeit, setEndzeit] = useState(initial?.endzeit?.slice(0, 16) ?? "");
  const [ladetyp, setLadetyp] = useState<LadeTyp>(initial?.ladetyp ?? "AC");
  const [ladeleistung, setLadeleistung] = useState(initial?.ladeleistung_kw?.toString() ?? "");
  const [geladenKwh, setGeladenKwh] = useState(initial?.geladene_kwh?.toString() ?? "");
  const [akkuStart, setAkkuStart] = useState(initial?.akkustand_start?.toString() ?? "");
  const [akkuEnde, setAkkuEnde] = useState(initial?.akkustand_ende?.toString() ?? "");
  const [anbieter, setAnbieter] = useState(initial?.anbieter ?? "");
  const [stationsname, setStationsname] = useState(initial?.stationsname ?? "");
  const [stationsid, setStationsid] = useState(initial?.stationsid ?? "");
  const [adresse, setAdresse] = useState(initial?.adresse ?? "");
  const [kosten, setKosten] = useState(initial?.kosten_eur?.toString() ?? "");
  const [tarif, setTarif] = useState(initial?.tarif ?? "");
  const [status, setStatus] = useState<Ladestatus>(initial?.status ?? "vollständig");
  const [notiz, setNotiz] = useState(initial?.notiz ?? "");

  // Berechnete Ladedauer
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
    const lv: Ladevorgang = {
      id: initial?.id ?? genId(),
      startzeit: new Date(startzeit).toISOString(),
      endzeit: endzeit ? new Date(endzeit).toISOString() : new Date(startzeit).toISOString(),
      ladetyp,
      ladeleistung_kw: parseFloat(ladeleistung) || 0,
      geladene_kwh: parseFloat(geladenKwh) || 0,
      akkustand_start: parseFloat(akkuStart) || 0,
      akkustand_ende: parseFloat(akkuEnde) || 0,
      anbieter, stationsname, stationsid,
      adresse,
      kosten_eur: parseFloat(kosten) || 0,
      tarif, status, notiz,
    };
    onSave(lv);
  }

  const LADETYPEN: LadeTyp[] = ["AC", "DC", "CCS", "Wallbox", "Haushaltssteckdose"];

  return (
    <div className="bg-slate-900/60 border border-yellow-600/30 rounded-xl p-4 mt-2">
      <h4 className="text-yellow-400 font-semibold text-sm mb-3">🔌 Ladevorgang erfassen</h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Zeitraum */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-slate-400 text-xs font-medium block mb-1">Ladestart</label>
            <input type="datetime-local" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500 w-full" value={startzeit} onChange={e => setStartzeit(e.target.value)} required />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-medium block mb-1">Ladeende</label>
            <input type="datetime-local" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500 w-full" value={endzeit} onChange={e => setEndzeit(e.target.value)} />
          </div>
        </div>
        {ladedauer && (
          <div className="text-xs text-yellow-400 bg-yellow-900/20 rounded px-3 py-1.5">
            ⏱ Ladedauer: <strong>{ladedauer}</strong>
          </div>
        )}

        {/* Ladetyp & Leistung */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-slate-400 text-xs font-medium block mb-1">Ladetyp / Stecker</label>
            <select className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500 w-full cursor-pointer" value={ladetyp} onChange={e => setLadetyp(e.target.value as LadeTyp)}>
              {LADETYPEN.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs font-medium block mb-1">Ladeleistung (kW)</label>
            <input type="number" step="0.1" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-yellow-500 w-full" placeholder="11.0" value={ladeleistung} onChange={e => setLadeleistung(e.target.value)} />
          </div>
        </div>

        {/* Energie & Akku */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-slate-400 text-xs font-medium block mb-1">Geladen (kWh)</label>
            <input type="number" step="0.1" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-yellow-500 w-full" placeholder="30.0" value={geladenKwh} onChange={e => setGeladenKwh(e.target.value)} required />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-medium block mb-1">Akku Start (%)</label>
            <input type="number" min="0" max="100" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-yellow-500 w-full" placeholder="20" value={akkuStart} onChange={e => setAkkuStart(e.target.value)} />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-medium block mb-1">Akku Ende (%)</label>
            <input type="number" min="0" max="100" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-yellow-500 w-full" placeholder="80" value={akkuEnde} onChange={e => setAkkuEnde(e.target.value)} />
          </div>
        </div>

        {/* Ladestation */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-slate-400 text-xs font-medium block mb-1">Anbieter / Betreiber</label>
            <input type="text" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-yellow-500 w-full" placeholder="z.B. EnBW, IONITY, eigene Wallbox" value={anbieter} onChange={e => setAnbieter(e.target.value)} required />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-medium block mb-1">Stationsname</label>
            <input type="text" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-yellow-500 w-full" placeholder="z.B. Autohof A3 Würzburg" value={stationsname} onChange={e => setStationsname(e.target.value)} required />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-medium block mb-1">Stations-ID (EVSE-ID)</label>
            <input type="text" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-yellow-500 w-full" placeholder="z.B. DE*ABC*E123456*1" value={stationsid} onChange={e => setStationsid(e.target.value)} />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-medium block mb-1">Adresse der Ladestation</label>
            <input type="text" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-yellow-500 w-full" placeholder="Musterstr. 1, 12345 Musterstadt" value={adresse} onChange={e => setAdresse(e.target.value)} />
          </div>
        </div>

        {/* Kosten & Status */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-slate-400 text-xs font-medium block mb-1">Kosten (€)</label>
            <input type="number" step="0.01" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-yellow-500 w-full" placeholder="0.00" value={kosten} onChange={e => setKosten(e.target.value)} />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-medium block mb-1">Tarif / Preismodell</label>
            <input type="text" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-yellow-500 w-full" placeholder="z.B. 0.59 €/kWh" value={tarif} onChange={e => setTarif(e.target.value)} />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-medium block mb-1">Status</label>
            <select className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500 w-full cursor-pointer" value={status} onChange={e => setStatus(e.target.value as Ladestatus)}>
              <option value="vollständig">Vollständig</option>
              <option value="unterbrochen">Unterbrochen</option>
              <option value="fehler">Fehler</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-slate-400 text-xs font-medium block mb-1">Notiz</label>
          <input type="text" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-yellow-500 w-full" placeholder="z.B. Kabel klemmt, Quittung Foto gemacht..." value={notiz} onChange={e => setNotiz(e.target.value)} />
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onCancel} className="bg-slate-700 hover:bg-slate-600 text-white font-medium px-3 py-1.5 rounded-lg transition-colors text-sm">Abbrechen</button>
          <button type="submit" className="bg-yellow-600 hover:bg-yellow-500 text-white font-medium px-4 py-1.5 rounded-lg transition-colors text-sm">Ladevorgang speichern</button>
        </div>
      </form>
    </div>
  );
}
