"use client";
import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

export interface Ladestation {
  placeId: string;
  name: string;
  adresse: string;
  distanzM: number;
  lat: number;
  lng: number;
  offen?: boolean;
}

interface Props {
  onSelect: (s: Ladestation) => void;
}

type Status = "idle" | "locating" | "loading" | "ready" | "error";

export default function LadekarteDropdown({ onSelect }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [stationen, setStationen] = useState<Ladestation[]>([]);
  const [ausgewaehlt, setAusgewaehlt] = useState<Ladestation | null>(null);
  const [offen, setOffen] = useState(false);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  useEffect(() => {
    if (!API_KEY) {
      setStatus("error");
      setErrorMsg("Kein Google Maps API Key konfiguriert.");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setStatus("loading");
        ladeKarteUndStationen(lat, lng);
      },
      () => {
        setStatus("error");
        setErrorMsg("Standort konnte nicht ermittelt werden. Bitte Berechtigung erteilen.");
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  async function ladeKarteUndStationen(lat: number, lng: number) {
    const loader = new Loader({ apiKey: API_KEY, version: "weekly", libraries: ["places"] });
    await loader.load();

    const map = new google.maps.Map(mapRef.current!, {
      center: { lat, lng },
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#1e293b" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#334155" }] },
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1e293b" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f172a" }] },
        { featureType: "poi", stylers: [{ visibility: "off" }] },
      ],
    });
    mapInstanceRef.current = map;

    // Eigener Standort Marker
    new google.maps.Marker({
      position: { lat, lng },
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#3b82f6",
        fillOpacity: 1,
        strokeColor: "#fff",
        strokeWeight: 2,
      },
      title: "Mein Standort",
      zIndex: 999,
    });

    // Nearby EV Charging Stations suchen
    const service = new google.maps.places.PlacesService(map);
    service.nearbySearch(
      {
        location: { lat, lng },
        radius: 5000,
        type: "electric_vehicle_charging_station",
      },
      (results, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
          setStatus("error");
          setErrorMsg("Keine Ladestationen in der Nähe gefunden.");
          return;
        }

        const liste: Ladestation[] = results.slice(0, 10).map((p) => {
          const plat = p.geometry?.location?.lat() ?? 0;
          const plng = p.geometry?.location?.lng() ?? 0;
          const distanzM = haversine(lat, lng, plat, plng);
          return {
            placeId: p.place_id ?? "",
            name: p.name ?? "Unbekannt",
            adresse: p.vicinity ?? "",
            distanzM,
            lat: plat,
            lng: plng,
            offen: p.opening_hours?.open_now,
          };
        });

        // Nach Entfernung sortieren
        liste.sort((a, b) => a.distanzM - b.distanzM);
        setStationen(liste);

        // Marker für jede Station
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = liste.map((s, i) => {
          const marker = new google.maps.Marker({
            position: { lat: s.lat, lng: s.lng },
            map,
            title: s.name,
            label: {
              text: String(i + 1),
              color: "#fff",
              fontSize: "12px",
              fontWeight: "bold",
            },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 14,
              fillColor: "#16a34a",
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 2,
            },
          });
          marker.addListener("click", () => waehleStation(s));
          return marker;
        });

        setStatus("ready");
      }
    );
  }

  function waehleStation(s: Ladestation) {
    setAusgewaehlt(s);
    setOffen(false);
    onSelect(s);
    // Karte auf Station zentrieren
    mapInstanceRef.current?.panTo({ lat: s.lat, lng: s.lng });
  }

  function formatDistanz(m: number) {
    return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
  }

  return (
    <div className="space-y-3">
      {/* Karte */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-600"
        style={{ height: 200 }}>
        <div ref={mapRef} className="w-full h-full" />
        {status === "locating" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            style={{ background: "#1e293b" }}>
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Standort wird ermittelt…</p>
          </div>
        )}
        {status === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-800/70">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Ladestationen werden gesucht…</p>
          </div>
        )}
        {status === "error" && !API_KEY && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4"
            style={{ background: "#1e293b" }}>
            <span className="text-3xl">🗺️</span>
            <p className="text-slate-300 text-sm text-center font-medium">Google Maps API Key fehlt</p>
            <p className="text-slate-500 text-xs text-center">Siehe Anleitung unten</p>
          </div>
        )}
        {status === "error" && API_KEY && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4"
            style={{ background: "#1e293b" }}>
            <span className="text-2xl">📍</span>
            <p className="text-red-400 text-sm text-center">{errorMsg}</p>
          </div>
        )}
      </div>

      {/* Dropdown Stationsauswahl */}
      {status === "ready" && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setOffen(!offen)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors"
            style={{
              background: "#1e293b",
              borderColor: ausgewaehlt ? "#16a34a" : "#475569",
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-green-400 text-lg shrink-0">⚡</span>
              {ausgewaehlt ? (
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{ausgewaehlt.name}</p>
                  <p className="text-slate-400 text-xs truncate">{ausgewaehlt.adresse} · {formatDistanz(ausgewaehlt.distanzM)}</p>
                </div>
              ) : (
                <span className="text-slate-400 text-sm">Ladestation auswählen ({stationen.length} in der Nähe)</span>
              )}
            </div>
            <span className="text-slate-400 text-xs shrink-0 ml-2">{offen ? "▲" : "▼"}</span>
          </button>

          {offen && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-slate-600 overflow-hidden shadow-2xl"
              style={{ background: "#1e293b", maxHeight: 280, overflowY: "auto" }}>
              {stationen.map((s, i) => (
                <button
                  key={s.placeId}
                  type="button"
                  onClick={() => waehleStation(s)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-0"
                >
                  <div className="shrink-0 w-7 h-7 rounded-full bg-green-800 flex items-center justify-center text-green-300 text-xs font-bold mt-0.5">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{s.name}</p>
                    <p className="text-slate-400 text-xs truncate">{s.adresse}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-blue-400 text-xs">{formatDistanz(s.distanzM)}</span>
                      {s.offen === true && <span className="text-green-400 text-xs">● Geöffnet</span>}
                      {s.offen === false && <span className="text-red-400 text-xs">● Geschlossen</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* API Key Hinweis */}
      {!API_KEY && (
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl px-3 py-2 text-xs text-amber-300">
          <p className="font-semibold mb-1">⚠️ Google Maps API Key benötigt</p>
          <p className="text-amber-400">Füge <code className="bg-amber-900/40 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in Vercel → Settings → Environment Variables hinzu.</p>
        </div>
      )}
    </div>
  );
}

// Haversine Formel für Entfernung in Metern
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
