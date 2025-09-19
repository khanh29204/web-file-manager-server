import path from "path";

// Hàm lấy phần mở rộng của file
export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

// Hàm format kích thước file
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`;
}
