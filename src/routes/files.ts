import { Request, Response, Router } from "express";
import { getFileExtension, formatFileSize } from "../utils/fileUtils";
import path from "path";
import { readdir, stat } from "fs/promises";
import { config } from "dotenv";
config();

const domain = process.env.DOMAIN || "http://localhost:2345";
const router = Router();
const DRIVE_PATH = path.join(__dirname, "..", "..", "drive");

// Route xử lý download file
router.get("/download/*", (req, res) => {
  const decodedPath = decodeURIComponent(req.path);
  const webFilePath = path.join(decodedPath.replace("/download", ""));
  res.redirect(`${domain}${webFilePath}`);
});

// Route hiển thị danh sách file và folder
router.get("/", async (req: Request, res: Response) => {
  const currentDir = (req.query.dir ?? "") as string;
  const sortBy = req.query.sort || "name";

  // Bảo vệ đường dẫn: ngăn chặn truy cập thư mục cha bằng cách kiểm tra ".."
  if (currentDir.includes("..")) {
    return res.status(403).send("Forbidden");
  }

  const directoryPath = path.join(DRIVE_PATH, currentDir);

  try {
    const items = await readdir(directoryPath, { withFileTypes: true });

    const itemsWithDetails = await Promise.all(
      items.map(async (item) => {
        // Bỏ qua các file và folder ẩn
        if (item.name.startsWith(".")) {
          return null;
        }

        const itemPath = path.join(directoryPath, item.name);
        let fileUrl;
        let fileStat;

        try {
          fileStat = await stat(itemPath);
        } catch (error) {
          return null;
        }

        if (fileStat.isDirectory()) {
          fileUrl = path.join(currentDir, item.name);
        } else {
          fileUrl = path.join("download", currentDir, item.name);
        }

        return {
          name: item.name,
          extension: getFileExtension(item.name),
          isDirectory: fileStat.isDirectory(),
          path: fileUrl,
          size: fileStat.isFile() ? formatFileSize(fileStat.size) : "",
        };
      })
    );

    const filteredItems = itemsWithDetails.filter((item) => item !== null);

    filteredItems.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "type") {
        return a.isDirectory === b.isDirectory
          ? a.name.localeCompare(b.name)
          : a.isDirectory
          ? -1
          : 1;
      } else if (sortBy === "size") {
        // So sánh kích thước file sau khi đã xử lý
        const sizeA = a.isDirectory ? -1 : a.size;
        const sizeB = b.isDirectory ? -1 : b.size;

        if (sizeA === -1 || sizeB === -1) {
          return sizeA === sizeB ? 0 : sizeA === -1 ? -1 : 1;
        } else {
          return sizeA.localeCompare(sizeB, undefined, { numeric: true });
        }
      }
      return 0;
    });

    res.render("index", {
      items: filteredItems,
      currentDir,
      parentDir: currentDir ? path.dirname(currentDir) : "",
      sortBy,
    });
  } catch (err: any) {
    if (err.code === "ENOENT") {
      res.status(404).render("error", { error: "Thư mục không tồn tại" });
    } else {
      console.error("Lỗi đọc thư mục:", err);
      res.status(500).render("error", { error: "Lỗi server" });
    }
  }
});

export default router;
