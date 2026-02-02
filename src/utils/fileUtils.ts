import path from "path";

export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase().replace(".", "");
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`;
}

// Map icon (như cũ)
export function getFileIcon(ext: string): string {
  const map: { [key: string]: string } = {
    pdf: "fa-file-pdf text-danger",
    doc: "fa-file-word text-primary",
    docx: "fa-file-word text-primary",
    xls: "fa-file-excel text-success",
    xlsx: "fa-file-excel text-success",
    ppt: "fa-file-powerpoint text-warning",
    pptx: "fa-file-powerpoint text-warning",
    jpg: "fa-file-image text-info",
    jpeg: "fa-file-image text-info",
    png: "fa-file-image text-info",
    gif: "fa-file-image text-info",
    zip: "fa-file-archive text-secondary",
    rar: "fa-file-archive text-secondary",
    js: "fa-file-code text-warning",
    ts: "fa-file-code text-primary",
    html: "fa-file-code text-danger",
    css: "fa-file-code text-primary",
    mp3: "fa-file-audio text-success",
    mp4: "fa-file-video text-danger",
    txt: "fa-file-alt text-muted",
  };
  return map[ext] || "fa-file text-secondary";
}

// HÀM MỚI: Chuyển đổi đuôi file thành mô tả loại
export function getFileTypeDescription(
  isDirectory: boolean,
  ext: string
): string {
  if (isDirectory) return "Thư mục";

  const descriptions: { [key: string]: string } = {
    png: "Hình ảnh PNG",
    jpg: "Hình ảnh JPG",
    jpeg: "Hình ảnh JPEG",
    gif: "Hình ảnh GIF",
    mp4: "Video MP4",
    mp3: "Âm thanh MP3",
    pdf: "Tài liệu PDF",
    doc: "Tài liệu Word",
    docx: "Tài liệu Word",
    xls: "Excel Spreadsheet",
    xlsx: "Excel Spreadsheet",
    ppt: "PowerPoint",
    pptx: "PowerPoint",
    zip: "File nén ZIP",
    rar: "File nén RAR",
    txt: "Text Document",
    js: "JavaScript Code",
    ts: "TypeScript Code",
    html: "HTML File",
    css: "CSS Stylesheet",
    json: "JSON File",
  };

  return descriptions[ext] || `${ext.toUpperCase()} File`;
}
