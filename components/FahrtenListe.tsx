"use client";
import { useState } from "react";
import { Fahrt } from "@/lib/types";

interface Props {
  fahrten: Fahrt[];
  onEdit: (f: Fahrt) => void;
  onDelete: (id: string) => void;
}

const ZWECK_BADGE: Record<string, string> = {
  dienstlich: "bg-blue-900/50 text-blue-300",
  privat: "bg-purple-900/50 text-purple-300",
  gemischt: "bg-orange-900/50 text-orange-300",
};

export default function FahrtenListe({ fahrten, onEdit, onDelete }: Props) {
  const [search, setSearch] = useState("");
  const [zweckFilter, setZweckFilter] = useState("alle");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = fahrten.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !q || f.von.toLowerCase().includes(q) || f.nach.toLowerCase().includes(q) || f.fahrer.toLowerCase().includes(q) || (f.projekt ?? "").toLowerCase().includes(q);
    const matchZweck = zweckFilter === "alle" || f.zweck === zweckFilter;
    return matchSearch && matchZweck;
  });

  if (fahrten.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🚗</div>
        <p className="text-slate-400 text-lg mb-2">Noch keine Fahrten eingetragen</p>
        <p className="text-slate-500 text-sm">Klicke auf „Fahrt eintragen" um zu starten.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input type="text" placeholder="Suche nach Ort, Fahrer, Projekt..." className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-green-500 flex-1 min-w-40" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 cursor-pointer" value={zweckFilter} onChange={e => setZweckFilter(e.target.value)}>
          <option value="alle">Alle Fahrten</option>
          <option value="dienstlich">Dienstlich</option>
          <option value="privat">Privat</option>
          <option value="gemischt">Gemischt</option>
        </select>
      </div>
      <p className="text-slate-500 text-xs mb-3">{filtered.length} von {fahrten.length} Fahrten</p>

      <div className="space-y-2">
        {filtered.map(fahrt => (
          <div key={fahrt.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            {/* Header row */}
            <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-700/40 transition-colors" onClick={() => setExpanded(expanded === fahrt.id ? null : fahrt.id)}>
              <div className="shrink-0 text-slate-400 text-xs font-mono w-20">{fahrt.datum}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-medium text-sm">{fahrt.von}</span>
                  <span className="text-slate-500">→</span>
                  <span className="text-white font-medium text-sm">{fahrt.nach}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ZWECK_BADGE[fahrt.zweck]}`}>{fahrt.zweck}</span>
                  {fahrt.ladevorgaenge.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-900/50 text-yellow-300">🔌 {fahrt.ladevorgaenge.length}×</span>
                  )}
                </div>
                <div className="text-slate-400 text-xs mt-0.5 flex gap-3 flex-wrap">
                  <span>{fahrt.fahrer}</span>
                  {fahrt.projekt && <span>· {fahrt.projekt}</span>}
                  <span>· {fahrt.abfahrtszeit}{fahrt.ankunftszeit ? ` – ${fahrt.ankunftszeit}` : ""}</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-green-400 font-mono text-sm font-semibold">{fahrt.km_gesamt.toFixed(0)} km</div>
                {fahrt.verbrauch_kwh > 0 && <div className="text-slate-400 text-xs">{fahrt.verbrauch_kwh_100km.toFixed(1)} kWh/100</div>}
              </div>
              <div className="text-slate-500 text-xs shrink-0">{expanded === fahrt.id ? "▲" : "▼"}</div>
            </div>

            {/* Expanded detail */}
            {expanded === fahrt.id && (
              <div className="border-t border-slate-700 px-4 py-4 bg-slate-900/30">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                  <div>
                    <div className="text-slate-400 text-xs mb-0.5">KM-Stand</div>
                    <div className="text-white font-mono">{fahrt.km_start.toLocaleString()} → {fahrt.km_ende.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs mb-0.5">Strecke</div>
                    <div className="text-white font-mono">{fahrt.km_gesamt.toFixed(1)} km</div>
                  </div>
                  {fahrt.verbrauch_kwh > 0 && (
                    <>
                      <div>
                        <div className="text-slate-400 text-xs mb-0.5">Verbrauch gesamt</div>
                        <div className="text-white font-mono">{fahrt.verbrauch_kwh.toFixed(1)} kWh</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-xs mb-0.5">Verbrauch/100km</div>
                        <div className="text-white font-mono">{fahrt.verbrauch_kwh_100km.toFixed(1)} kWh</div>
                      </div>
                    </>
                  )}
                </div>

                {/* Ladevorgänge */}
                {fahrt.ladevorgaenge.length > 0 && (
                  <div className="mb-4">
                    <div className="text-yellow-400 text-xs font-semibold uppercase tracking-wide mb-2">🔌 Ladevorgänge</div>
                    <div className="space-y-2">
                      {fahrt.ladevorgaenge.map(lv => {
                        const start = new Date(lv.startzeit);
                        const end = new Date(lv.endzeit);
                        const minuten = Math.round((end.getTime() - start.getTime()) / 60000);
                        const ladedauer = minuten > 0 ? (minuten >= 60 ? `${Math.floor(minuten / 60)}h ${minuten % 60}min` : `${minuten}min`) : "—";
                        return (
                          <div key={lv.id} className="bg-slate-800 rounded-lg p-3 text-sm">
                            <div className="flex flex-wrap gap-2 mb-1">
                              <span className="bg-yellow-900/60 text-yellow-300 px-2 py-0.5 rounded text-xs font-medium">{lv.ladetyp}</span>
                              <span className="text-slate-300">{lv.ladeleistung_kw} kW</span>
                              <span className="text-green-400 font-mono">{lv.geladene_kwh} kWh</span>
                              <span className="text-slate-400">⏱ {ladedauer}</span>
                              <span className="text-slate-300">{lv.akkustand_start}% → {lv.akkustand_ende}%</span>
                              {lv.kosten_eur > 0 && <span className="text-yellow-300">{lv.kosten_eur.toFixed(2)} €</span>}
                              <span className={`text-xs px-1.5 py-0.5 rounded ${lv.status === "vollständig" ? "bg-green-900/50 text-green-300" : lv.status === "fehler" ? "bg-red-900/50 text-red-300" : "bg-orange-900/50 text-orange-300"}`}>{lv.status}</span>
                            </div>
                            <div className="text-xs text-slate-400">
                              <span className="font-medium text-slate-300">{lv.anbieter}</span> · {lv.stationsname}
                              {lv.stationsid && <span className="text-slate-500"> ({lv.stationsid})</span>}
                            </div>
                            {lv.adresse && <div className="text-xs text-slate-500">{lv.adresse}</div>}
                            {lv.tarif && <div className="text-xs text-slate-500">Tarif: {lv.tarif}</div>}
                            <div className="text-xs text-slate-500">{start.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} – {end.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</div>
                            {lv.notiz && <div className="text-xs text-slate-400 mt-1 italic">{lv.notiz}</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {fahrt.notiz && <p className="text-slate-400 text-sm italic mb-3">💬 {fahrt.notiz}</p>}

                <div className="flex gap-2">
                  <button onClick={() => onEdit(fahrt)} className="bg-slate-700 hover:bg-slate-600 text-white font-medium px-3 py-1.5 rounded-lg transition-colors text-xs">✏️ Bearbeiten</button>
                  <button onClick={() => onDelete(fahrt.id)} className="bg-red-900/50 hover:bg-red-800 text-red-300 font-medium px-3 py-1.5 rounded-lg transition-colors text-xs">🗑️ Löschen</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
