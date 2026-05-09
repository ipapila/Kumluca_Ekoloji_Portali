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

// Yardımcı: data.json'dan oku
function readData() {
  if (!fs.existsSync(FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(FILE));
  } catch {
    return [];
  }
}

// Yardımcı: data.json'a yaz + otomatik git push
function writeDataAndCommit(data, commitMsg = "Veri güncellendi") {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  // Otomatik git işlemleri
  exec(`git add data.json && git commit -m "${commitMsg}" && git push origin main`, (err, stdout, stderr) => {
    if (err) console.error("❌ Git otomatik hata:", err.message);
    else console.log("✅ Otomatik yedek başarılı:", stdout.trim());
  });
}

// ---------- API ----------
// Tüm verileri getir
app.get("/data", (req, res) => {
  const data = readData();
  res.json(data);
});

// Yeni kayıt ekle
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
  writeDataAndCommit(data, `Yeni kayıt: ${kategori} - ${aciklama.slice(0,30)}`);
  res.json({ status: "ok", id: newId });
});

// Kayıt güncelle (düzenleme veya çözme)
app.put("/data/:id", (req, res) => {
  const { password } = req.body;
  if (password !== "1234") return res.status(401).json({ status: "Hatalı şifre" });

  let data = readData();
  const index = data.findIndex(i => i.id === req.params.id);
  if (index === -1) return res.status(404).json({ status: "Kayıt bulunamadı" });

  // Gelen alanları mevcut kayıtla birleştir
  data[index] = { ...data[index], ...req.body.updates };
  writeDataAndCommit(data, `Güncelleme: ${data[index].category}`);
  res.json({ status: "ok" });
});

// Kayıt sil
app.delete("/data/:id", (req, res) => {
  const { password } = req.body;
  if (password !== "1234") return res.status(401).json({ status: "Hatalı şifre" });

  let data = readData();
  const newData = data.filter(i => i.id !== req.params.id);
  if (newData.length === data.length) return res.status(404).json({ status: "Kayıt bulunamadı" });
  writeDataAndCommit(newData, `Kayıt silindi: ${req.params.id}`);
  res.json({ status: "ok" });
});

// Tüm verileri temizle (sadece admin acil durum)
app.delete("/data", (req, res) => {
  const { password } = req.body;
  if (password !== "1234") return res.status(401).json({ status: "Hatalı şifre" });
  writeDataAndCommit([], "Tüm veriler temizlendi");
  res.json({ status: "ok" });
});

app.listen(PORT, () => console.log(`🚀 Sunucu çalışıyor: http://localhost:${PORT}`));