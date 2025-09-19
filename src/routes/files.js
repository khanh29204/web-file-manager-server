const express = require("express");
const fs = require("fs");
const path = require("path");
const { getFileExtension, formatFileSize } = require("../utils/fileUtils");
const e = require("express");
require("dotenv").config();

const domain = process.env.DOMAIN;
console.log(domain);

const router = express.Router();

// Route xử lý download file
router.get("/download/*", (req, res) => {
  const decodedPath = decodeURIComponent(req.path);
  const webFilePath = path.join(decodedPath.replace("/download", ""));

  //chuyển hướng đến web khác với webFlePath
  res.redirect(`${domain}${webFilePath}`);
});

// Route hiển thị danh sách file và folder
router.get("/", (req, res) => {
  const currentDir = req.query.dir || "";
  const sortBy = req.query.sort || "name"; // Lấy tham số sort, mặc định là name
  const directoryPath = path.join(__dirname, "..", "..", "drive", currentDir);

  fs.readdir(directoryPath, (err, items) => {
    if (err) {
      console.error("Lỗi đọc thư mục:", err);
      return res.status(500).render("error", { error: "Lỗi server" });
    }

    const itemsWithDetails = items.map((item) => {
      const itemPath = path.join(directoryPath, item);
      const stat = fs.statSync(itemPath);
      let fileUrl;
      // bỏ qua item bắt đầu bằng dấu .
      if (item.startsWith(".")) {
        return null;
      }

      if (stat.isDirectory()) {
        fileUrl = path.join(currentDir, item);
      } else {
        fileUrl = `download/${path.join(currentDir, item)}`;
      }

      return {
        name: item,
        extension: getFileExtension(item),
        isDirectory: stat.isDirectory(),
        path: fileUrl,
        size: stat.isFile() ? formatFileSize(stat.size) : "",
      };
    }).filter(item => item !== null);

    // Sắp xếp danh sách items
    itemsWithDetails.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "type") {
        return a.isDirectory === b.isDirectory
          ? a.name.localeCompare(b.name)
          : a.isDirectory
          ? -1
          : 1;
      } else if (sortBy === "size") {
        return a.isDirectory === b.isDirectory
          ? a.size.localeCompare(b.size)
          : a.isDirectory
          ? -1
          : 1;
      }
    });

    res.render("index", {
      items: itemsWithDetails,
      currentDir,
      parentDir: currentDir ? path.dirname(currentDir) : "",
      sortBy,
    });
  });
});

module.exports = router;
