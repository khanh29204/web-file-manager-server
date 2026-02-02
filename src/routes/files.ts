import { Request, Response, Router } from "express";
import {
  getFileExtension,
  formatFileSize,
  getFileIcon,
  getFileTypeDescription,
} from "../utils/fileUtils";
import path from "path";
import { readdir, stat } from "fs/promises";
import mime from "mime-types";
import { config } from "dotenv";
import FileRecord from "../models/FileRecord";

config();

const router = Router();
const DRIVE_PATH = path.join(__dirname, "..", "..", "drive");
const STATIC_HOST = process.env.STATIC_HOST;

// 1. Route Xem/Tải file (Không còn đếm DB)
router.get("/file/*", async (req: Request, res: Response) => {
  try {
    const rawPath = req.params[0];

    // Encode đường dẫn (giữ nguyên tiếng Việt/khoảng trắng cho đúng URL)
    // Lưu ý: encodeURI không encode ký tự ? và & nên an toàn
    const filePathEncoded = encodeURI(rawPath);

    // Đường dẫn cơ sở sang Nginx
    let redirectUrl = `${STATIC_HOST}/${filePathEncoded}`;

    // Kiểm tra có yêu cầu download không
    const isDownload = req.query.download === "1";

    // Ghi log lượt tải vào DB (Giữ nguyên logic của bạn)
    // Lưu ý: filePath trong DB nên lưu thống nhất (decoded) để dễ query
    await FileRecord.findOneAndUpdate(
      { filePath: rawPath }, // Lưu rawPath (decoded) để dễ quản lý
      { $inc: { downloadCount: 1 }, lastDownloadedAt: new Date() },
      { upsert: true, new: true }
    );

    // QUAN TRỌNG: Nếu user muốn download, nối thêm ?download=1 vào URL Nginx
    if (isDownload) {
      redirectUrl += "?download=1";
    }

    // Redirect sang Nginx
    return res.redirect(302, redirectUrl);
  } catch (error) {
    console.error("Redirect Error:", error);
    res.status(500).send("Error");
  }
});

// 2. Route Danh sách
router.get("/", async (req: Request, res: Response) => {
  const currentDir = (req.query.dir as string) || "";
  const sortBy = (req.query.sort as string) || "name";
  // 1. Lấy chiều sắp xếp, mặc định là tăng dần (asc)
  const sortOrder = (req.query.order as string) === "desc" ? "desc" : "asc";

  if (currentDir.includes("..")) return res.status(403).send("Forbidden");

  const directoryPath = path.join(DRIVE_PATH, currentDir);

  try {
    const items = await readdir(directoryPath, { withFileTypes: true });

    const processedItems = await Promise.all(
      items.map(async (item) => {
        if (item.name.startsWith(".")) return null;

        const relativePath = path.join(currentDir, item.name);
        let fileStat;
        try {
          fileStat = await stat(path.join(directoryPath, item.name));
        } catch {
          return null;
        }
        const isDir = item.isDirectory();
        const ext = isDir ? "folder" : getFileExtension(item.name);
        const typeDesc = getFileTypeDescription(isDir, ext);
        return {
          name: item.name,
          path: isDir
            ? `/?dir=${encodeURIComponent(relativePath)}`
            : `/file/${relativePath}`,
          downloadPath: `/file/${encodeURIComponent(relativePath)}?download=1`,
          isDirectory: isDir,
          size: isDir ? "-" : formatFileSize(fileStat.size),
          rawSize: fileStat.size,
          modified: fileStat.mtime,
          extension: ext,
          icon: isDir ? "fa-folder text-warning" : getFileIcon(ext),
          type: typeDesc,
        };
      })
    );

    const finalItems = processedItems.filter((i) => i !== null) as any[];

    // 2. Sorting logic hai chiều
    finalItems.sort((a, b) => {
      // Giữ folder luôn nằm trên cùng (Windows style)
      // Nếu bạn muốn folder cũng bị đảo lộn xuống dưới khi sort desc thì xóa dòng này
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;

      const modifier = sortOrder === "desc" ? -1 : 1;
      let comparison = 0;

      switch (sortBy) {
        case "size":
          // So sánh số
          comparison = a.rawSize - b.rawSize;
          break;
        case "date":
          // So sánh thời gian
          comparison = a.modified.getTime() - b.modified.getTime();
          break;
        case "type":
          // So sánh chuỗi
          comparison = a.type.localeCompare(b.type);
          break;
        default:
          // Mặc định so sánh tên
          comparison = a.name.localeCompare(b.name);
          break;
      }

      // Nhân kết quả với modifier để đảo chiều
      return comparison * modifier;
    });

    const breadcrumbs = currentDir
      ? currentDir.split("/").map((part, index, arr) => ({
          name: part,
          path: arr.slice(0, index + 1).join("/"),
        }))
      : [];
    const nextOrder = sortOrder === "asc" ? "desc" : "asc";

    const sortUrls = {
      name: `/?dir=${encodeURIComponent(currentDir)}&sort=name&order=${
        sortBy === "name" ? nextOrder : "asc"
      }`,
      type: `/?dir=${encodeURIComponent(currentDir)}&sort=type&order=${
        sortBy === "type" ? nextOrder : "asc"
      }`,
      size: `/?dir=${encodeURIComponent(currentDir)}&sort=size&order=${
        sortBy === "size" ? nextOrder : "asc"
      }`,
      date: `/?dir=${encodeURIComponent(currentDir)}&sort=date&order=${
        sortBy === "date" ? nextOrder : "asc"
      }`,
    };

    const sortIcons = {
      name:
        sortBy === "name"
          ? sortOrder === "asc"
            ? "fa-sort-up"
            : "fa-sort-down"
          : "fa-sort text-muted",
      type:
        sortBy === "type"
          ? sortOrder === "asc"
            ? "fa-sort-up"
            : "fa-sort-down"
          : "fa-sort text-muted",
      size:
        sortBy === "size"
          ? sortOrder === "asc"
            ? "fa-sort-up"
            : "fa-sort-down"
          : "fa-sort text-muted",
      date:
        sortBy === "date"
          ? sortOrder === "asc"
            ? "fa-sort-up"
            : "fa-sort-down"
          : "fa-sort text-muted",
    };
    res.render("index", {
      items: finalItems,
      currentDir,
      breadcrumbs,
      sortBy,
      sortOrder,
      sortUrls,
      sortIcons,
    });
  } catch (err: any) {
    if (err.code === "ENOENT") {
      res.status(404).render("error", { error: "Thư mục không tồn tại" });
    } else {
      console.error(err);
      res.status(500).render("error", { error: "Lỗi server" });
    }
  }
});

export default router;
