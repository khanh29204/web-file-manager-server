import express, { NextFunction, Request, Response } from "express";
import path from "path";
import fileRoutes from "./routes/files";
import morgan from "morgan";
import moment from "moment-timezone";
import { config } from "dotenv";
config();

const app = express();
const port = process.env.PORT || 2345;

// Thiết lập EJS và thư mục public
morgan.token("vn-time", () => {
  return moment().tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm:ss");
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));
app.use(express.static(path.join(__dirname, "..", "public")));

app.use((req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip as string;
  //chỉ log ipv4
  let ipv4: string;
  if (ip.includes(":")) {
    ipv4 = ip.split(":")[3];
  } else {
    ipv4 = ip;
  }
  console.log(`\nIp Address ${ipv4}`);
  next();
});
app.use(morgan(`:vn-time| :method :url status::status :response-time ms`));

// Sử dụng route cho /files
app.use("/", fileRoutes);

// Middleware xử lý lỗi 404 cho UI (trang web)
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, "..", "public", "404.html"));
});

app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});
