const express = require("express");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const PORT = process.env.PORT || 3000;

const FILE = "data.json";

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(express.static("."));

// GET tüm veriler
app.get("/data", (req, res) => {
  if (!fs.existsSync(FILE)) return res.json([]);
  const data = JSON.parse(fs.readFileSync(FILE));
  res.json(data);
});

// POST veri ekleme
app.post("/data", (req, res) => {
  const { password, kategori, aciklama, lat, lng, photo } = req.body;
  
  // Basit parola kontrolü
  if (password !== "1234") {
    return res.status(401).json({ status: "Hatalı şifre" });
  }

  let data = [];
  if (fs.existsSync(FILE)) {
    data = JSON.parse(fs.readFileSync(FILE));
  }

  const entry = { kategori, aciklama, lat, lng, photo };
  data.push(entry);
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  res.json({ status: "ok" });
});

app.listen(PORT, () => console.log(`Server çalışıyor: http://localhost:${PORT}`));
