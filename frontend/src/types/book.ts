/** 藏书书目类型定义 */

export interface Book {
  id: number;
  title: string;
  author: string;
  edition: string | null;
  volume_count: number;
  marginalia_count: number;
}

export interface BookFormData {
  title: string;
  author: string;
  edition: string;
  volume_count: number;
}
