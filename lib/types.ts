export type Zweck = "dienstlich" | "privat" | "gemischt";
export type LadeTyp = "AC" | "DC" | "CCS" | "Wallbox" | "Haushaltssteckdose";
export type Ladestatus = "vollständig" | "unterbrochen" | "fehler";

export interface Ladevorgang {
  id: string;
  startzeit: string; // ISO
  endzeit: string;   // ISO
  ladetyp: LadeTyp;
  ladeleistung_kw: number;
  geladene_kwh: number;
  akkustand_start: number; // %
  akkustand_ende: number;  // %
  reichweite_start_km?: number;
  reichweite_ende_km?: number;
  anbieter: string;
  stationsname: string;
  stationsid?: string;
  adresse: string;
  kosten_eur: number;
  tarif?: string;
  status: Ladestatus;
  temperatur_c?: number; // Außentemperatur beim Laden
  notiz?: string;
}

export interface Fahrt {
  id: string;
  datum: string; // ISO date
  abfahrtszeit: string;
  ankunftszeit: string;
  von: string;
  nach: string;
  zweck: Zweck;
  projekt?: string;
  fahrer: string;
  km_start: number;
  km_ende: number;
  km_gesamt: number;
  verbrauch_kwh: number;        // tatsächlich verbraucht
  verbrauch_kwh_100km: number;  // kWh/100km
  geladen_unterwegs: boolean;
  ladevorgaenge: Ladevorgang[];
  notiz?: string;
  erstellt_am: string;
  geaendert_am: string;
}

export interface Fahrzeug {
  id: string;
  kennzeichen: string;
  marke: string;
  modell: string;
  baujahr: number;
  akkukapazitaet_kwh: number;
  reichweite_km: number;
  fahrgestellnummer?: string;
}

export interface FahrtenbuchData {
  fahrzeug: Fahrzeug;
  fahrten: Fahrt[];
}
