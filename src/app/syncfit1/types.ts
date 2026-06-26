export const STYLE_STATUS = {
  DESIGN: "design",
  FACTORY_REVIEW: "factory_review",
  SAMPLE_PROD: "sample_prod",
  SAMPLE_REVIEW: "sample_review",
  PROD_CONFIRM: "prod_confirm",
  PROD_ACTIVE: "prod_active",
  DIST_VENDOR: "dist_vendor",
  COMPLETED: "completed",
} as const;

export type StyleStatus = typeof STYLE_STATUS[keyof typeof STYLE_STATUS];

export interface Vendor {
  id: string;
  name: string;
}

export interface Factory {
  id: string;
  name: string;
  contact: string;
}

export interface Media {
  id: string;
  styleId: string;
  type: "techpack" | "image" | "video" | "sample" | "showroom";
  url: string;
  fileName: string;
  uploadedAt: string;
}

export interface Style {
  id: string;
  status: StyleStatus;
  name: string;
  vendorId: string;
  factoryId: string;
  techPackUrl: string;
  techPackVersion: string;
  colorBook: {
    fabricName: string;
    colors: { name: string; hex: string }[];
  };
  scmPrice: {
    factoryCostRmb: number;
    exchangeRate: number;
    duty: number;
    shipping: number;
    margin: number;
  };
  qrLogs: {
    stage: 'Factory' | 'QC' | 'Shipping' | 'Korea' | 'Review' | 'Confirmed';
    timestamp: string;
    location: string;
  }[];
}

export interface TimelineMessage {
  id: string;
  styleId: string;
  sender: {
    name: string;
    role: 'designer' | 'admin' | 'factory_staff' | 'vendor_staff';
    lang: 'KR' | 'CN';
  };
  content: string;
  translations?: {
    KR?: string;
    CN?: string;
  };
  createdAt: string;
  mediaId?: string;
  logUpdate?: {
    prevStatus?: StyleStatus;
    nextStatus?: StyleStatus;
  };
}

export interface ReadLog {
  id: string; // Format: role_styleId
  role: 'designer' | 'admin' | 'factory_staff' | 'vendor_staff';
  styleId: string;
  lastReadAt: string;
}
