import express from "express";
import path from "path";
import fileRoutes from "./routes/files";
import morgan from "morgan";
import moment from "moment-timezone";
import { config } from "dotenv";
// import { connectDB } from "./config/database";

config();

// Kết nối Database
// connectDB();

const app = express();
const port = process.env.PORT || 2345;

app.set("trust proxy", true);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));

// Logger
morgan.token("vn-time", () =>
  moment().tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm:ss")
);
app.use(morgan(`:vn-time | :method :url status::status :response-time ms`));

// Static files
app.use(express.static(path.join(__dirname, "..", "public")));

// Routes
app.use("/", fileRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "..", "public", "404.html"));
});

app.listen(port, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${port}`);
});
