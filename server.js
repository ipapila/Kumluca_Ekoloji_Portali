const express = require("express");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");
const { exec } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3000;
const FILE = "data.json";

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(express.static("."));

// Verileri oku
function readData() {
  if (!fs.existsSync(FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(FILE));
  } catch {
    return [];
  }
}

// Verileri yaz ve otomatik git push
function writeDataAndCommit(data, commitMsg) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  exec(`git add data.json && git commit -m "${commitMsg}" && git push origin main`, (err, stdout, stderr) => {
    if (err) console.error("❌ Otomatik git hatası:", err.message);
    else console.log("✅ Otomatik yedek başarılı");
  });
}

// GET /data - tüm veriler
app.get("/data", (req, res) => {
  res.json(readData());
});

// POST /data - yeni kayıt (şifre 1234)
app.post("/data", (req, res) => {
  const { password, kategori, aciklama, lat, lng, photo, date, location, reporter, severity } = req.body;
  if (password !== "1234") return res.status(401).json({ status: "Hatalı şifre" });

  let data = readData();
  const newId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const newEntry = {
    id: newId,
    lat, lng,
    category: kategori,
    description: aciklama,
    date: date || new Date().toISOString().split("T")[0],
    location: location || "",
    active: true,
    photo: photo || "",
    reporter: reporter || "",
    severity: severity || "3",
    createdAt: new Date().toISOString()
  };
  data.push(newEntry);
  writeDataAndCommit(data, `Yeni kayıt: ${kategori}`);
  res.json({ status: "ok", id: newId });
});

// PUT /data/:id - güncelleme (çözme, düzenleme)
app.put("/data/:id", (req, res) => {
  const { password, updates } = req.body;
  if (password !== "1234") return res.status(401).json({ status: "Hatalı şifre" });

  let data = readData();
  const index = data.findIndex(i => i.id === req.params.id);
  if (index === -1) return res.status(404).json({ status: "Bulunamadı" });
  data[index] = { ...data[index], ...updates };
  writeDataAndCommit(data, `Güncelleme: ${req.params.id}`);
  res.json({ status: "ok" });
});

// DELETE /data/:id - silme
app.delete("/data/:id", (req, res) => {
  const { password } = req.body;
  if (password !== "1234") return res.status(401).json({ status: "Hatalı şifre" });

  let data = readData();
  const newData = data.filter(i => i.id !== req.params.id);
  if (newData.length === data.length) return res.status(404).json({ status: "Bulunamadı" });
  writeDataAndCommit(newData, `Silindi: ${req.params.id}`);
  res.json({ status: "ok" });
});

app.listen(PORT, () => console.log(`🚀 Sunucu http://localhost:${PORT}`));