/** 眉批摘录类型定义 */

export interface Marginalia {
  id: number;
  book_title: string;
  page_number: string;
  original_text: string;
  marginalia_content: string;
  purchase_channel: string | null;
}

export interface MarginaliaFormData {
  book_title: string;
  page_number: string;
  original_text: string;
  marginalia_content: string;
  purchase_channel: string;
}
