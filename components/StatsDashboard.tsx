"use client";
import { Fahrt, Fahrzeug } from "@/lib/types";

interface Props {
  fahrten: Fahrt[];
  fahrzeug: Fahrzeug;
}

export default function StatsDashboard({ fahrten, fahrzeug }: Props) {
  if (fahrten.length === 0) {
    return <div className="text-center py-20 text-slate-400">Keine Daten vorhanden</div>;
  }

  const totalKm = fahrten.reduce((s, f) => s + f.km_gesamt, 0);
  const totalKwh = fahrten.reduce((s, f) => s + f.verbrauch_kwh, 0);
  const avgKwh100 = totalKm > 0 ? (totalKwh / totalKm) * 100 : 0;

  const dienstFahrten = fahrten.filter(f => f.zweck === "dienstlich");
  const privatFahrten = fahrten.filter(f => f.zweck === "privat");

  const alleLadevorgaenge = fahrten.flatMap(f => f.ladevorgaenge);
  const totalGeladenKwh = alleLadevorgaenge.reduce((s, l) => s + l.geladene_kwh, 0);
  const totalLadekosten = alleLadevorgaenge.reduce((s, l) => s + l.kosten_eur, 0);

  const ladetypen = alleLadevorgaenge.reduce<Record<string, number>>((acc, lv) => {
    acc[lv.ladetyp] = (acc[lv.ladetyp] ?? 0) + 1;
    return acc;
  }, {});

  const anbieter = alleLadevorgaenge.reduce<Record<string, number>>((acc, lv) => {
    acc[lv.anbieter] = (acc[lv.anbieter] ?? 0) + lv.geladene_kwh;
    return acc;
  }, {});

  const avgLadedauer = (() => {
    const mins = alleLadevorgaenge.map(lv => {
      const diff = (new Date(lv.endzeit).getTime() - new Date(lv.startzeit).getTime()) / 60000;
      return diff > 0 ? diff : 0;
    }).filter(m => m > 0);
    if (!mins.length) return null;
    const avg = mins.reduce((a, b) => a + b, 0) / mins.length;
    return avg >= 60 ? `${Math.floor(avg / 60)}h ${Math.round(avg % 60)}min` : `${Math.round(avg)}min`;
  })();

  function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <div className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">{label}</div>
        <div className="text-white font-bold text-2xl font-mono">{value}</div>
        {sub && <div className="text-slate-500 text-xs mt-0.5">{sub}</div>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-white font-semibold text-lg">📊 Auswertung</h2>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Gesamte Fahrten" value={fahrten.length.toString()} sub={`${dienstFahrten.length} dienstl. / ${privatFahrten.length} privat`} />
        <Stat label="Gesamtkilometer" value={`${totalKm.toFixed(0)} km`} sub={`⌀ ${(totalKm / fahrten.length).toFixed(0)} km/Fahrt`} />
        <Stat label="Verbrauch gesamt" value={`${totalKwh.toFixed(1)} kWh`} sub={avgKwh100 > 0 ? `⌀ ${avgKwh100.toFixed(1)} kWh/100km` : undefined} />
        <Stat label="Ladekosten" value={`${totalLadekosten.toFixed(2)} €`} sub={totalGeladenKwh > 0 ? `⌀ ${(totalLadekosten / totalGeladenKwh).toFixed(3)} €/kWh` : undefined} />
      </div>

      {/* Dienstlich / Privat aufgeteilt */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-xl border border-blue-800/40 p-4">
          <h3 className="text-blue-400 font-semibold mb-3 text-sm">🏢 Dienstliche Fahrten</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Fahrten</span><span className="text-white font-mono">{dienstFahrten.length}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Kilometer</span><span className="text-white font-mono">{dienstFahrten.reduce((s, f) => s + f.km_gesamt, 0).toFixed(0)} km</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Energieverbrauch</span><span className="text-white font-mono">{dienstFahrten.reduce((s, f) => s + f.verbrauch_kwh, 0).toFixed(1)} kWh</span></div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl border border-purple-800/40 p-4">
          <h3 className="text-purple-400 font-semibold mb-3 text-sm">🏠 Private Fahrten</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Fahrten</span><span className="text-white font-mono">{privatFahrten.length}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Kilometer</span><span className="text-white font-mono">{privatFahrten.reduce((s, f) => s + f.km_gesamt, 0).toFixed(0)} km</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Energieverbrauch</span><span className="text-white font-mono">{privatFahrten.reduce((s, f) => s + f.verbrauch_kwh, 0).toFixed(1)} kWh</span></div>
          </div>
        </div>
      </div>

      {/* Laden */}
      {alleLadevorgaenge.length > 0 && (
        <div className="bg-slate-800 rounded-xl border border-yellow-800/40 p-4">
          <h3 className="text-yellow-400 font-semibold mb-3 text-sm">🔌 Ladestatistik</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
            <div>
              <div className="text-slate-400 text-xs mb-0.5">Ladevorgänge</div>
              <div className="text-white font-mono font-bold">{alleLadevorgaenge.length}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs mb-0.5">Geladen gesamt</div>
              <div className="text-white font-mono font-bold">{totalGeladenKwh.toFixed(1)} kWh</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs mb-0.5">Gesamtkosten</div>
              <div className="text-white font-mono font-bold">{totalLadekosten.toFixed(2)} €</div>
            </div>
            {avgLadedauer && (
              <div>
                <div className="text-slate-400 text-xs mb-0.5">⌀ Ladedauer</div>
                <div className="text-white font-mono font-bold">{avgLadedauer}</div>
              </div>
            )}
          </div>

          {/* Ladetypen */}
          {Object.keys(ladetypen).length > 0 && (
            <div className="mb-3">
              <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">Ladetypen</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ladetypen).sort((a, b) => b[1] - a[1]).map(([typ, count]) => (
                  <span key={typ} className="bg-yellow-900/40 text-yellow-300 text-xs px-3 py-1 rounded-full">{typ}: {count}×</span>
                ))}
              </div>
            </div>
          )}

          {/* Anbieter */}
          {Object.keys(anbieter).length > 0 && (
            <div>
              <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">Anbieter nach geladener Energie</div>
              <div className="space-y-1">
                {Object.entries(anbieter).sort((a, b) => b[1] - a[1]).map(([name, kwh]) => (
                  <div key={name} className="flex justify-between text-sm">
                    <span className="text-slate-300">{name}</span>
                    <span className="text-white font-mono">{kwh.toFixed(1)} kWh</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fahrzeuginfo */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <h3 className="text-slate-300 font-semibold mb-3 text-sm">🚗 Fahrzeug: {fahrzeug.marke} {fahrzeug.modell}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div><div className="text-slate-400 text-xs">Kennzeichen</div><div className="text-white">{fahrzeug.kennzeichen}</div></div>
          <div><div className="text-slate-400 text-xs">Baujahr</div><div className="text-white">{fahrzeug.baujahr}</div></div>
          <div><div className="text-slate-400 text-xs">Akkukapazität</div><div className="text-white font-mono">{fahrzeug.akkukapazitaet_kwh} kWh</div></div>
          <div><div className="text-slate-400 text-xs">Reichweite (WLTP)</div><div className="text-white font-mono">{fahrzeug.reichweite_km} km</div></div>
        </div>
      </div>
    </div>
  );
}
