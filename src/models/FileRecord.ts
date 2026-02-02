import mongoose, { Schema, Document } from "mongoose";

export interface IFileRecord extends Document {
  filePath: string; // Lưu đường dẫn tương đối (ví dụ: /folder/image.png)
  downloadCount: number;
  lastDownloadedAt: Date;
}

const FileRecordSchema: Schema = new Schema(
  {
    filePath: { type: String, required: true, unique: true, index: true },
    downloadCount: { type: Number, default: 0 },
    lastDownloadedAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  }
);

export default mongoose.model<IFileRecord>("FileRecord", FileRecordSchema);
