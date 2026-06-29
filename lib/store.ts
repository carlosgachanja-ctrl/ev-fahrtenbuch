import { FahrtenbuchData, Fahrt, Ladevorgang } from "./types";

const KEY = "ev_fahrtenbuch";

const DEFAULT_DATA: FahrtenbuchData = {
  fahrzeug: {
    id: "1",
    kennzeichen: "MR-EV 123",
    marke: "Tesla",
    modell: "Model 3",
    baujahr: 2022,
    akkukapazitaet_kwh: 75,
    reichweite_km: 500,
  },
  fahrten: [],
};

export function loadData(): FahrtenbuchData {
  if (typeof window === "undefined") return DEFAULT_DATA;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : DEFAULT_DATA;
  } catch {
    return DEFAULT_DATA;
  }
}

export function saveData(data: FahrtenbuchData): void {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function addFahrt(fahrt: Omit<Fahrt, "id" | "erstellt_am" | "geaendert_am">): Fahrt {
  const data = loadData();
  const now = new Date().toISOString();
  const neu: Fahrt = { ...fahrt, id: genId(), erstellt_am: now, geaendert_am: now };
  data.fahrten.unshift(neu);
  saveData(data);
  return neu;
}

export function updateFahrt(id: string, updates: Partial<Fahrt>): void {
  const data = loadData();
  const idx = data.fahrten.findIndex((f) => f.id === id);
  if (idx !== -1) {
    data.fahrten[idx] = { ...data.fahrten[idx], ...updates, geaendert_am: new Date().toISOString() };
    saveData(data);
  }
}

export function deleteFahrt(id: string): void {
  const data = loadData();
  data.fahrten = data.fahrten.filter((f) => f.id !== id);
  saveData(data);
}
