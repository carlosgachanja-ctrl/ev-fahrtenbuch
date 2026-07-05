"use client";
import { useRef, useState } from "react";
import { FahrtenbuchData } from "@/lib/types";
import { loadData, saveData } from "@/lib/store";

interface Props {
  onImport: () => void;
}

export default function DatenVerwaltung({ onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [meldung, setMeldung] = useState<{ typ: "ok" | "fehler"; text: string } | null>(null);

  function zeigeMeldung(typ: "ok" | "fehler", text: string) {
    setMeldung({ typ, text });
    setTimeout(() => setMeldung(null), 4000);
  }

  // JSON-Backup exportieren
  function exportJSON() {
    const data = loadData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const datum = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `ev-fahrtenbuch-backup-${datum}.json`;
    a.click();
    URL.revokeObjectURL(url);
    zeigeMeldung("ok", "Backup gespeichert.");
  }

  // JSON-Backup importieren
  function importJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as FahrtenbuchData;
        if (!parsed.fahrten || !parsed.fahrzeug) throw new Error("Ungültiges Format");
        saveData(parsed);
        onImport();
        zeigeMeldung("ok", `${parsed.fahrten.length} Fahrten wiederhergestellt.`);
      } catch {
        zeigeMeldung("fehler", "Datei konnte nicht geladen werden. Falsches Format?");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  // CSV-Export für einen Monat
  function exportCSV() {
    const data = loadData();
    const header = [
      "Datum", "Von", "Nach", "km", "Zweck", "Fahrer",
      "Ladetyp", "kWh geladen", "Akku Start %", "Akku Ende %",
      "Anbieter", "Station", "Adresse", "Kosten €", "Tarif", "Status"
    ].join(";");

    const rows = data.fahrten.flatMap(f => {
      if (f.ladevorgaenge.length === 0) {
        return [[
          f.datum, f.von, f.nach, f.km_gesamt, f.zweck, f.fahrer,
          "", "", "", "", "", "", "", "", "", ""
        ].join(";")];
      }
      return f.ladevorgaenge.map(lv => [
        f.datum, f.von, f.nach, f.km_gesamt, f.zweck, f.fahrer,
        lv.ladetyp, lv.geladene_kwh, lv.akkustand_start, lv.akkustand_ende,
        lv.anbieter, lv.stationsname, lv.adresse, lv.kosten_eur, lv.tarif ?? "", lv.status
      ].join(";"));
    });

    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const datum = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `ev-fahrtenbuch-${datum}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    zeigeMeldung("ok", "CSV exportiert (öffne in Excel oder Numbers).");
  }

  const data = loadData();
  const letzteAenderung = data.fahrten.length > 0
    ? [...data.fahrten].sort((a, b) => b.geaendert_am.localeCompare(a.geaendert_am))[0].geaendert_am.slice(0, 10)
    : null;

  return (
    <div className="space-y-5">
      <h2 className="text-white font-semibold text-lg">💾 Datenverwaltung</h2>

      {/* Status */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
        <h3 className="text-slate-300 font-semibold text-sm mb-3">📊 Aktueller Datenstand</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><div className="text-slate-400 text-xs mb-0.5">Fahrten gespeichert</div><div className="text-white font-mono font-bold">{data.fahrten.length}</div></div>
          <div><div className="text-slate-400 text-xs mb-0.5">Ladevorgänge</div><div className="text-white font-mono font-bold">{data.fahrten.flatMap(f => f.ladevorgaenge).length}</div></div>
          <div><div className="text-slate-400 text-xs mb-0.5">Letzte Änderung</div><div className="text-white font-mono">{letzteAenderung ?? "—"}</div></div>
          <div><div className="text-slate-400 text-xs mb-0.5">Fahrzeug</div><div className="text-white">{data.fahrzeug.marke} {data.fahrzeug.modell}</div></div>
        </div>
      </div>

      {/* Meldung */}
      {meldung && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${meldung.typ === "ok" ? "bg-green-900/40 text-green-300 border border-green-700/40" : "bg-red-900/40 text-red-300 border border-red-700/40"}`}>
          {meldung.typ === "ok" ? "✓ " : "✗ "}{meldung.text}
        </div>
      )}

      {/* Backup */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 space-y-3">
        <h3 className="text-slate-300 font-semibold text-sm">🗄️ Backup (JSON)</h3>
        <p className="text-slate-500 text-xs">Speichert alle Daten als Datei auf deinem Gerät. Ideal um Daten zu sichern oder auf ein neues Gerät zu übertragen.</p>
        <button onClick={exportJSON}
          className="w-full bg-green-700 hover:bg-green-600 active:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
          <span>⬇️</span> Backup erstellen & speichern
        </button>
        <div className="border-t border-slate-700 pt-3">
          <p className="text-slate-500 text-xs mb-2">Backup wiederherstellen — überschreibt alle aktuellen Daten:</p>
          <button onClick={() => fileRef.current?.click()}
            className="w-full bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            <span>⬆️</span> Backup laden
          </button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={importJSON} />
        </div>
      </div>

      {/* CSV Export */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 space-y-3">
        <h3 className="text-slate-300 font-semibold text-sm">📋 Export als CSV</h3>
        <p className="text-slate-500 text-xs">Exportiert alle Fahrten & Ladevorgänge als CSV-Datei — öffenbar in Excel, Numbers oder Google Tabellen.</p>
        <button onClick={exportCSV}
          className="w-full bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
          <span>📊</span> CSV exportieren
        </button>
      </div>

      {/* Hinweis */}
      <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl px-4 py-3 text-xs text-amber-300">
        <p className="font-semibold mb-1">💡 Tipp: Regelmäßig sichern</p>
        <p className="text-amber-400">Browser-Daten können beim Löschen des Cache verloren gehen. Erstelle regelmäßig ein Backup und speichere es in deiner Cloud (iCloud, Google Drive).</p>
      </div>
    </div>
  );
}
