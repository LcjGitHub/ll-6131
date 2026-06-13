/** 眉批摘录类型定义 */

import type { Tag } from "./tag";

export interface Marginalia {
  id: number;
  book_id: number;
  book_title: string;
  page_number: string;
  original_text: string;
  marginalia_content: string;
  purchase_channel: string | null;
  is_favorite: boolean;
  entry_date: string;
  tags: Tag[];
}

export interface MarginaliaFormData {
  book_id: number;
  page_number: string;
  original_text: string;
  marginalia_content: string;
  purchase_channel: string;
  is_favorite: boolean;
  entry_date: string;
  tag_ids: number[];
}

export interface PaginatedMarginalia {
  items: Marginalia[];
  total: number;
  page: number;
  page_size: number;
}
