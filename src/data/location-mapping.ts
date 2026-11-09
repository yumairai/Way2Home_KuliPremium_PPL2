export const LOCATION_MAPPING = {
  "Kota Bandung": "Kota Bandung",
  "Kabupaten Bandung": "Bandung",
  "Kabupaten Bandung Barat": "Bandung Barat",
  "Kota Cimahi": "Kota Cimahi",
  "Kabupaten Sumedang": "Sumedang",
  "Kabupaten Garut": "Garut",
  "Kota Tasikmalaya": "Kota Tasikmalaya",
  "Kabupaten Tasikmalaya": "Tasikmalaya",
  "Kabupaten Cianjur": "Cianjur",
  "Kota Sukabumi": "Kota Sukabumi",
  "Kabupaten Sukabumi": "Sukabumi",
  "Kota Bogor": "Kota Bogor",
  "Kabupaten Bogor": "Bogor",
  "Kota Depok": "Kota Depok",
  "Kota Bekasi": "Kota Bekasi",
  "Kabupaten Bekasi": "Bekasi",
  "Kabupaten Karawang": "Karawang",
  "Kabupaten Purwakarta": "Purwakarta",
  "Kabupaten Subang": "Subang",
  "Kabupaten Indramayu": "Indramayu",
  "Kota Cirebon": "Kota Cirebon",
  "Kabupaten Cirebon": "Cirebon",
  "Kabupaten Kuningan": "Kuningan",
  "Kabupaten Majalengka": "Majalengka",
  "Kabupaten Ciamis": "Ciamis",
  "Kota Banjar": "Kota Banjar",
  "Kabupaten Pangandaran": "Pangandaran",
} as const;

export type UiLocation = keyof typeof LOCATION_MAPPING;

export const UI_LOCATIONS = Object.keys(LOCATION_MAPPING) as UiLocation[];

const UI_LOCATION_BY_DATABASE_NAME = new Map<string, UiLocation>(
  Object.entries(LOCATION_MAPPING).map(([uiLocation, databaseLocation]) => [
    databaseLocation,
    uiLocation as UiLocation,
  ]),
);

export function toDatabaseLocation(location: string): string {
  return LOCATION_MAPPING[location as UiLocation] ?? location;
}

export function toUiLocation(location: string): string {
  return UI_LOCATION_BY_DATABASE_NAME.get(location) ?? location;
}