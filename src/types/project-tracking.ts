export type ConstructionTask = {
  id: string;
  title: string;
  status: "pending" | "in-progress" | "completed";
  weight?: number;
  completedAt?: string;
};

export type ConstructionMilestone = {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "completed";
  progress: number;
  startedAt?: string;
  completedAt?: string;
  targetStart?: string;
  targetEnd?: string;
  delayDays?: number;
  updatedAt?: string;
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

export type CustomerIssueResolution = {
  id: string;
  issueId: string;
  issueTitle: string;
  solution: string;
  approvalReason: string;
  approvalEvidence: string | null;
  impactType: "biaya" | "waktu" | "biaya_dan_waktu" | null;
  additionalCost: number | null;
  additionalDays: number | null;
  status: string;
  submittedAt: string;
  discussion: {
    id: string;
    author: string;
    message: string;
    date: string;
    impactType: "biaya" | "waktu" | "biaya_dan_waktu" | null;
    additionalCost: number | null;
    additionalDays: number | null;
  }[];
};

export type ProjectTracking = {
  startedAt?: string;
  targetDate?: string;
  totalDelayDays?: number;
  overallProgress?: number | null;
  milestones: ConstructionMilestone[];
  activities: ProjectActivity[];
  gallery: ProjectGalleryItem[];
  resolutions?: CustomerIssueResolution[];
};
