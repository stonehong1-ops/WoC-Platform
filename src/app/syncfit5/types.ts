export interface ScmPrice {
  fabricCost: number;
  usage: number;
  cmt: number;
  exchangeRate: number;
}

export interface Style {
  id: string;
  name: string;
  category: string;
  status: string;
  updatedAt: string;
  scmPrice: ScmPrice;
  isMock?: boolean;
}

export interface TimelineMessage {
  id: string;
  styleId: string;
  sender: string;
  avatar: string;
  role: string;
  content: string;
  translatedContent?: string;
  createdAt: string;
  isSelf: boolean;
  isSystem: boolean;
  attachment?: {
    fileName: string;
    fileSize: string;
    url?: string;
  } | null;
  isMock?: boolean;
}

export interface Media {
  id: string;
  styleId: string;
  type: 'techpack' | 'file' | 'showroom_fabric';
  url: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  isMock?: boolean;
}

export interface ColorBookItem {
  id: string;
  styleId: string;
  fabricId: string;
  fabricName: string;
  fabricImageUrl: string;
  colorHex: string;
}

