"use client";
import { Fahrt, Fahrzeug } from "@/lib/types";

interface Props {
  fahrten: Fahrt[];
  fahrzeug: Fahrzeug;
}

function BarChart({ items, maxVal, unit, color = "#16a34a" }: {
  items: { label: string; value: number; sub?: string }[];
  maxVal: number;
  unit: string;
  color?: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex justify-between text-xs mb-0.5">
            <span className="text-slate-300 truncate max-w-[60%]">{item.label}</span>
            <span className="text-white font-mono font-semibold">{item.value.toFixed(1)} {unit}</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{ width: `${Math.min((item.value / maxVal) * 100, 100)}%`, background: color }} />
          </div>
          {item.sub && <div className="text-slate-500 text-xs mt-0.5">{item.sub}</div>}
        </div>
      ))}
    </div>
  );
}

function Karte({ title, value, sub, color = "border-slate-700" }: {
  title: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className={`bg-slate-800 rounded-xl border p-3 ${color}`}>
      <div className="text-slate-400 text-xs mb-1">{title}</div>
      <div className="text-white font-bold text-xl font-mono">{value}</div>
      {sub && <div className="text-slate-500 text-xs mt-0.5">{sub}</div>}
    </div>
  );
}

export default function AnalysePage({ fahrten, fahrzeug }: Props) {
  if (fahrten.length === 0) {
    return <div className="text-center py-20 text-slate-400">Keine Daten vorhanden</div>;
  }

  const alleLV = fahrten.flatMap(f => f.ladevorgaenge);

  // ── 1. kWh/100km gesamt & Trend (letzte 10 Fahrten mit km > 0) ─────────
  const fahrtenMitKm = fahrten.filter(f => f.km_gesamt > 0 && f.verbrauch_kwh > 0);
  const avgVerbrauch = fahrtenMitKm.length > 0
    ? fahrtenMitKm.reduce((s, f) => s + (f.verbrauch_kwh / f.km_gesamt) * 100, 0) / fahrtenMitKm.length
    : 0;
  const trendFahrten = [...fahrtenMitKm].sort((a, b) => a.datum.localeCompare(b.datum)).slice(-10);
  const trendItems = trendFahrten.map(f => ({
    label: f.datum.slice(5),
    value: (f.verbrauch_kwh / f.km_gesamt) * 100,
  }));
  const trendMax = Math.max(...trendItems.map(t => t.value), 25);

  // ── 2. Ladedauer & Ladegeschwindigkeit pro Station ─────────────────────
  const stationMap: Record<string, {
    name: string; sessionen: number; gesamtMin: number;
    gesamtKwh: number; maxKw: number; gesamtKw: number; kostenProKwh: number[];
  }> = {};
  for (const lv of alleLV) {
    const key = lv.stationsname || lv.anbieter || "Unbekannt";
    if (!stationMap[key]) stationMap[key] = { name: key, sessionen: 0, gesamtMin: 0, gesamtKwh: 0, maxKw: 0, gesamtKw: 0, kostenProKwh: [] };
    const s = stationMap[key];
    s.sessionen++;
    const min = (new Date(lv.endzeit).getTime() - new Date(lv.startzeit).getTime()) / 60000;
    if (min > 0) s.gesamtMin += min;
    s.gesamtKwh += lv.geladene_kwh;
    s.gesamtKw += lv.ladeleistung_kw;
    if (lv.ladeleistung_kw > s.maxKw) s.maxKw = lv.ladeleistung_kw;
    if (lv.kosten_eur > 0 && lv.geladene_kwh > 0) s.kostenProKwh.push(lv.kosten_eur / lv.geladene_kwh);
  }
  const stationen = Object.values(stationMap).filter(s => s.sessionen > 0);
  const stationenNachSpeed = [...stationen].sort((a, b) => (b.gesamtKw / b.sessionen) - (a.gesamtKw / a.sessionen));
  const stationenNachDauer = [...stationen].sort((a, b) => (a.gesamtMin / a.sessionen) - (b.gesamtMin / b.sessionen));

  const maxAvgKw = Math.max(...stationenNachSpeed.map(s => s.gesamtKw / s.sessionen), 1);
  const maxAvgMin = Math.max(...stationenNachDauer.map(s => s.gesamtMin / s.sessionen), 1);

  // ── 3. Ladedauer / km ──────────────────────────────────────────────────
  // Minuten Laden pro 100km gefahren (nach Ladung)
  const ladeMinPro100km = (() => {
    const pairs: { min: number; km: number }[] = [];
    for (const f of fahrten) {
      if (f.km_gesamt <= 0) continue;
      const totalMin = f.ladevorgaenge.reduce((s, lv) => {
        const m = (new Date(lv.endzeit).getTime() - new Date(lv.startzeit).getTime()) / 60000;
        return s + (m > 0 ? m : 0);
      }, 0);
      if (totalMin > 0) pairs.push({ min: totalMin, km: f.km_gesamt });
    }
    if (!pairs.length) return null;
    const avg = pairs.reduce((s, p) => s + (p.min / p.km) * 100, 0) / pairs.length;
    return avg;
  })();

  // ── 4. Verbrauch bei Temperaturen ──────────────────────────────────────
  const tempBuckets: Record<string, number[]> = {
    "< 0 °C": [], "0–10 °C": [], "10–20 °C": [], "20–30 °C": [], "> 30 °C": []
  };
  for (const lv of alleLV) {
    if (lv.temperatur_c === undefined || lv.temperatur_c === null) continue;
    const t = lv.temperatur_c;
    // Finde zugehörige Fahrt für den Verbrauch
    const fahrt = fahrten.find(f => f.ladevorgaenge.some(l => l.id === lv.id));
    if (!fahrt || fahrt.km_gesamt <= 0 || fahrt.verbrauch_kwh <= 0) continue;
    const v = (fahrt.verbrauch_kwh / fahrt.km_gesamt) * 100;
    if (t < 0) tempBuckets["< 0 °C"].push(v);
    else if (t < 10) tempBuckets["0–10 °C"].push(v);
    else if (t < 20) tempBuckets["10–20 °C"].push(v);
    else if (t < 30) tempBuckets["20–30 °C"].push(v);
    else tempBuckets["> 30 °C"].push(v);
  }
  const tempData = Object.entries(tempBuckets)
    .map(([label, vals]) => ({ label, value: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0, n: vals.length }))
    .filter(t => t.n > 0);
  const maxTempVal = Math.max(...tempData.map(t => t.value), 25);

  // ── 5. Anbieter: €/kWh Vergleich ──────────────────────────────────────
  const anbieterMap: Record<string, { kwh: number; kosten: number; sessionen: number }> = {};
  for (const lv of alleLV) {
    const key = lv.anbieter || "Unbekannt";
    if (!anbieterMap[key]) anbieterMap[key] = { kwh: 0, kosten: 0, sessionen: 0 };
    anbieterMap[key].kwh += lv.geladene_kwh;
    anbieterMap[key].kosten += lv.kosten_eur;
    anbieterMap[key].sessionen++;
  }
  const anbieterPreis = Object.entries(anbieterMap)
    .filter(([, v]) => v.kosten > 0 && v.kwh > 0)
    .map(([name, v]) => ({ label: name, value: v.kosten / v.kwh, sub: `${v.sessionen}× · ${v.kwh.toFixed(1)} kWh` }))
    .sort((a, b) => a.value - b.value);
  const maxPreis = Math.max(...anbieterPreis.map(a => a.value), 1);

  // ── 6. AC vs DC Vergleich ──────────────────────────────────────────────
  const acSessions = alleLV.filter(l => l.ladetyp === "AC" || l.ladetyp === "Wallbox" || l.ladetyp === "Haushaltssteckdose");
  const dcSessions = alleLV.filter(l => l.ladetyp === "DC" || l.ladetyp === "CCS");
  const avgSpeedAC = acSessions.length ? acSessions.reduce((s, l) => s + l.ladeleistung_kw, 0) / acSessions.length : 0;
  const avgSpeedDC = dcSessions.length ? dcSessions.reduce((s, l) => s + l.ladeleistung_kw, 0) / dcSessions.length : 0;
  const avgKostenAC = acSessions.filter(l => l.kosten_eur > 0 && l.geladene_kwh > 0);
  const avgKostenDC = dcSessions.filter(l => l.kosten_eur > 0 && l.geladene_kwh > 0);
  const eurkwhAC = avgKostenAC.length ? avgKostenAC.reduce((s, l) => s + l.kosten_eur / l.geladene_kwh, 0) / avgKostenAC.length : 0;
  const eurkwhDC = avgKostenDC.length ? avgKostenDC.reduce((s, l) => s + l.kosten_eur / l.geladene_kwh, 0) / avgKostenDC.length : 0;

  // ── 7. Akku-Nutzung: typischer Ladebereich ─────────────────────────────
  const akkuStartAvg = alleLV.filter(l => l.akkustand_start > 0).reduce((s, l, _, a) => s + l.akkustand_start / a.length, 0);
  const akkuEndeAvg = alleLV.filter(l => l.akkustand_ende > 0).reduce((s, l, _, a) => s + l.akkustand_ende / a.length, 0);

  // ── 8. Kosten pro 100km ────────────────────────────────────────────────
  const gesamtKm = fahrten.reduce((s, f) => s + f.km_gesamt, 0);
  const gesamtLadekosten = alleLV.reduce((s, l) => s + l.kosten_eur, 0);
  const kostenPro100km = gesamtKm > 0 ? (gesamtLadekosten / gesamtKm) * 100 : 0;

  return (
    <div className="space-y-6 pb-8">
      <h2 className="text-white font-semibold text-lg">🔬 Analyse</h2>

      {/* Schnellübersicht */}
      <div className="grid grid-cols-2 gap-3">
        <Karte title="⌀ kWh/100km" value={avgVerbrauch > 0 ? `${avgVerbrauch.toFixed(1)} kWh` : "—"} sub={`aus ${fahrtenMitKm.length} Fahrten`} color="border-green-800/50" />
        <Karte title="Kosten/100km" value={kostenPro100km > 0 ? `${kostenPro100km.toFixed(2)} €` : "—"} sub={`${gesamtKm.toFixed(0)} km gesamt`} color="border-blue-800/50" />
        <Karte title="Laden pro 100km" value={ladeMinPro100km ? `${ladeMinPro100km.toFixed(0)} min` : "—"} sub="Ø Ladezeit je 100 km" color="border-yellow-800/50" />
        <Karte title="Akku Ladebereich" value={akkuStartAvg > 0 ? `${akkuStartAvg.toFixed(0)}→${akkuEndeAvg.toFixed(0)}%` : "—"} sub="Ø Start → Ende" color="border-purple-800/50" />
      </div>

      {/* kWh/100km Trend */}
      {trendItems.length > 1 && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
          <h3 className="text-green-400 font-semibold text-sm mb-4">📈 Verbrauch kWh/100km — letzte {trendItems.length} Fahrten</h3>
          <BarChart items={trendItems} maxVal={trendMax} unit="kWh" color="#16a34a" />
        </div>
      )}

      {/* Ladegeschwindigkeit pro Station */}
      {stationenNachSpeed.length > 0 && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
          <h3 className="text-yellow-400 font-semibold text-sm mb-4">⚡ Ladegeschwindigkeit pro Station (⌀ kW)</h3>
          <BarChart
            items={stationenNachSpeed.slice(0, 8).map(s => ({
              label: s.name,
              value: s.gesamtKw / s.sessionen,
              sub: `${s.sessionen}× geladen · max ${s.maxKw} kW`,
            }))}
            maxVal={maxAvgKw}
            unit="kW"
            color="#ca8a04"
          />
        </div>
      )}

      {/* Ladedauer pro Station */}
      {stationenNachDauer.length > 0 && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
          <h3 className="text-blue-400 font-semibold text-sm mb-4">⏱ Ladedauer pro Station (⌀ Minuten)</h3>
          <BarChart
            items={stationenNachDauer.slice(0, 8).map(s => ({
              label: s.name,
              value: s.gesamtMin / s.sessionen,
              sub: `${s.sessionen}× · ${(s.gesamtKwh / s.sessionen).toFixed(1)} kWh/Session`,
            }))}
            maxVal={maxAvgMin}
            unit="min"
            color="#3b82f6"
          />
        </div>
      )}

      {/* Anbieter €/kWh */}
      {anbieterPreis.length > 0 && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
          <h3 className="text-purple-400 font-semibold text-sm mb-4">💶 Strompreis pro Anbieter (€/kWh)</h3>
          <BarChart items={anbieterPreis} maxVal={maxPreis} unit="€/kWh" color="#9333ea" />
        </div>
      )}

      {/* AC vs DC */}
      {(acSessions.length > 0 || dcSessions.length > 0) && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
          <h3 className="text-slate-300 font-semibold text-sm mb-4">🔌 AC vs. DC Schnellladung</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-700/50 rounded-xl p-3">
              <div className="text-blue-400 font-semibold mb-2">AC / Wallbox</div>
              <div className="space-y-1">
                <div className="flex justify-between"><span className="text-slate-400 text-xs">Sessionen</span><span className="text-white font-mono">{acSessions.length}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 text-xs">⌀ Leistung</span><span className="text-white font-mono">{avgSpeedAC.toFixed(1)} kW</span></div>
                {eurkwhAC > 0 && <div className="flex justify-between"><span className="text-slate-400 text-xs">⌀ €/kWh</span><span className="text-white font-mono">{eurkwhAC.toFixed(3)}</span></div>}
              </div>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-3">
              <div className="text-orange-400 font-semibold mb-2">DC / CCS</div>
              <div className="space-y-1">
                <div className="flex justify-between"><span className="text-slate-400 text-xs">Sessionen</span><span className="text-white font-mono">{dcSessions.length}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 text-xs">⌀ Leistung</span><span className="text-white font-mono">{avgSpeedDC.toFixed(1)} kW</span></div>
                {eurkwhDC > 0 && <div className="flex justify-between"><span className="text-slate-400 text-xs">⌀ €/kWh</span><span className="text-white font-mono">{eurkwhDC.toFixed(3)}</span></div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Temperatur vs. Verbrauch */}
      {tempData.length > 0 ? (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
          <h3 className="text-cyan-400 font-semibold text-sm mb-4">🌡️ Verbrauch bei Außentemperatur (kWh/100km)</h3>
          <BarChart
            items={tempData.map(t => ({ label: t.label, value: t.value, sub: `${t.n} Messung${t.n > 1 ? "en" : ""}` }))}
            maxVal={maxTempVal}
            unit="kWh"
            color="#06b6d4"
          />
        </div>
      ) : (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
          <h3 className="text-cyan-400 font-semibold text-sm mb-2">🌡️ Verbrauch bei Außentemperatur</h3>
          <p className="text-slate-500 text-xs">Trage beim Ladevorgang die Außentemperatur ein, um diesen Vergleich zu sehen.</p>
        </div>
      )}

      {/* Stationsdetailtabelle */}
      {stationen.length > 0 && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
          <h3 className="text-slate-300 font-semibold text-sm mb-3">📍 Alle Stationen im Überblick</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-700">
                  <th className="text-left py-2 pr-3 font-medium">Station</th>
                  <th className="text-right py-2 px-2 font-medium">Ses.</th>
                  <th className="text-right py-2 px-2 font-medium">⌀ kW</th>
                  <th className="text-right py-2 px-2 font-medium">⌀ min</th>
                  <th className="text-right py-2 pl-2 font-medium">kWh ges.</th>
                </tr>
              </thead>
              <tbody>
                {[...stationen].sort((a, b) => b.gesamtKwh - a.gesamtKwh).map(s => (
                  <tr key={s.name} className="border-b border-slate-700/50 last:border-0">
                    <td className="py-2 pr-3 text-slate-300 max-w-[120px] truncate">{s.name}</td>
                    <td className="text-right py-2 px-2 text-white font-mono">{s.sessionen}</td>
                    <td className="text-right py-2 px-2 text-yellow-300 font-mono">{(s.gesamtKw / s.sessionen).toFixed(0)}</td>
                    <td className="text-right py-2 px-2 text-blue-300 font-mono">{s.gesamtMin > 0 ? (s.gesamtMin / s.sessionen).toFixed(0) : "—"}</td>
                    <td className="text-right py-2 pl-2 text-green-300 font-mono">{s.gesamtKwh.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* WLTP-Vergleich */}
      {avgVerbrauch > 0 && fahrzeug.reichweite_km > 0 && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
          <h3 className="text-slate-300 font-semibold text-sm mb-3">🚗 Reale vs. WLTP-Reichweite</h3>
          <div className="space-y-3 text-sm">
            {(() => {
              const wltpVerbrauch = (fahrzeug.akkukapazitaet_kwh / fahrzeug.reichweite_km) * 100;
              const realeReichweite = (fahrzeug.akkukapazitaet_kwh / avgVerbrauch) * 100;
              const diff = ((realeReichweite - fahrzeug.reichweite_km) / fahrzeug.reichweite_km) * 100;
              return (
                <>
                  <div className="flex justify-between"><span className="text-slate-400">WLTP Reichweite</span><span className="text-white font-mono">{fahrzeug.reichweite_km} km · {wltpVerbrauch.toFixed(1)} kWh/100km</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Reale Reichweite (⌀)</span><span className="text-white font-mono">{realeReichweite.toFixed(0)} km</span></div>
                  <div className={`text-center font-bold py-2 rounded-xl ${diff >= 0 ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
                    {diff >= 0 ? "+" : ""}{diff.toFixed(1)}% vs. WLTP
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
