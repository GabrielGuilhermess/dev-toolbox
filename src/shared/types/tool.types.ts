import type { LucideIcon } from 'lucide-react';

export type ToolCategory = 'documents' | 'data' | 'utilities';

export interface ToolMeta {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  path: string;
  icon: LucideIcon;
}

export interface CategoryMeta {
  id: ToolCategory;
  name: string;
  description: string;
}
