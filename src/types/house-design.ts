export type HouseDesign = {
  id?: string;
  slug: string;
  name: string;
  style: string;
  location: string;
  landArea: number;
  buildingArea: number;
  bedrooms: number;
  bathrooms?: number;
  floors: number;
  estimatedCost: number;
  estimatedDuration: number; // in months
  estimatedDurationDays?: number; // raw days from DB
  description: string;
  highlights: string[];
  image: string;
  images?: string[];
  spesifikasi?: Record<string, unknown>;
};
