// Harita oluştur
const map = L.map("map").setView([37.8579, 27.2586], 12);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

// Base64 fotoğraf dönüştür
function getPhotoBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// Marker renkleri kategoriye göre
function getColor(kategori) {
  if (kategori === "Sera Atığı") return "green";
  if (kategori === "Kaçak Döküm") return "red";
  if (kategori === "Kirlenmiş Su") return "blue";
  return "gray";
}

// Veri yükleme
async function loadData() {
  const res = await fetch("/data");
  const data = await res.json();

  data.forEach(d => {
    const marker = L.circleMarker([d.lat, d.lng], {
      color: getColor(d.kategori),
      radius: 8
    }).addTo(map);

    let popup = `<b>${d.kategori}</b><br>${d.aciklama}`;
    if (d.photo) popup += `<br><img src="${d.photo}" width="200">`;
    marker.bindPopup(popup);
  });
}

// Veri kaydet
async function submitData() {
  const pass = prompt("Parola gir:");
  if (!pass) return;

  const kategori = document.getElementById("kategori").value;
  const aciklama = document.getElementById("aciklama").value;
  const lat = parseFloat(document.getElementById("lat").value);
  const lng = parseFloat(document.getElementById("lng").value);

  const fileInput = document.getElementById("photoInput");
  let photo = null;
  if (fileInput.files.length > 0) {
    photo = await getPhotoBase64(fileInput.files[0]);
  }

  const res = await fetch("/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: pass, kategori, aciklama, lat, lng, photo })
  });

  const result = await res.json();
  if (result.status === "ok") {
    alert("Veri kaydedildi!");
    loadData(); // haritayı güncelle
  } else {
    alert(result.status);
  }
}

loadData();
