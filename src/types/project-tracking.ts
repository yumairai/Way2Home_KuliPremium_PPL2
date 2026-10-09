export type ConstructionTask = {
  id: string;
  title: string;
  status: "pending" | "in-progress" | "completed";
  completedAt?: string;
};

export type ConstructionMilestone = {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "completed";
  startedAt?: string;
  completedAt?: string;
  tasks: ConstructionTask[];
};

export type ProjectActivity = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  authorName: string;
  authorRole: "Mandor" | "Pengawas";
};

export type ProjectGalleryItem = {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  createdAt?: string;
  milestoneId?: string;
};

export type ProjectTracking = {
  startedAt?: string;
  targetDate?: string;
  milestones: ConstructionMilestone[];
  activities: ProjectActivity[];
  gallery: ProjectGalleryItem[];
};
