// script.js - Firebase'siz, server.js ile çalışan sürüm
let data = [];
let markers = {};
let addMode = false;
let pendingLatLng = null;
let editId = null;
let viewMode = 'active';
let activeFilters = new Set();
let isAdmin = false;
let photoBase64 = null;
let adminPass = "1234";

// Kategoriler (orijinalinizdeki gibi)
const CATS = [
  {id:'cop',label:'Çöp / Evsel Atık',icon:'🗑️',color:'#e05535'},
  {id:'sera',label:'Sera Atığı',icon:'🏚️',color:'#55bb65'},
  {id:'su',label:'Kirlenmiş Su',icon:'💧',color:'#2d80e0'},
  {id:'kimyasal',label:'Kimyasal',icon:'☣️',color:'#b828c0'},
  {id:'kacak',label:'Kaçak Döküm',icon:'🚮',color:'#c03040'},
  {id:'yangin',label:'Yangın Riski',icon:'🔥',color:'#e86010'}
];
CATS.forEach(c => activeFilters.add(c.id));

// Sunucuyla iletişim
async function fetchData() {
  const res = await fetch('/data');
  data = await res.json();
  renderMarkers();
  renderList();
  updateStats();
}

async function sendPost(entry) {
  const res = await fetch('/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: adminPass, ...entry })
  });
  if (!res.ok) throw new Error(await res.text());
  await fetchData();
}

async function sendPut(id, updates) {
  const res = await fetch(`/data/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: adminPass, updates })
  });
  if (!res.ok) throw new Error(await res.text());
  await fetchData();
}

async function sendDelete(id) {
  const res = await fetch(`/data/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: adminPass })
  });
  if (!res.ok) throw new Error(await res.text());
  await fetchData();
}

// Harita, markerlar vs. (orijinal kodunuzdaki aynı fonksiyonlar)
const map = L.map('map').setView([36.368, 30.290], 12);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '© CartoDB', subdomains: 'abcd'
}).addTo(map);

map.on('click', e => { if(addMode) { pendingLatLng = e.latlng; addMode=false; document.body.style.cursor='default'; alert('Konum alındı'); } });

function makeIcon(catId) {
  let cat = CATS.find(c=>c.id===catId) || CATS[0];
  const sz = 34;
  const svg = `<svg width="${sz}" height="${sz+10}" viewBox="0 0 ${sz} ${sz+10}"><path d="M${sz/2} 2 C${sz*.18} 2,2 ${sz*.3},2 ${sz*.52} C2 ${sz*.82},${sz/2} ${sz+8},${sz/2} ${sz+8} C${sz/2} ${sz+8},${sz-2} ${sz*.82},${sz-2} ${sz*.52} C${sz-2} ${sz*.3},${sz*.82} 2,${sz/2} 2Z" fill="${cat.color}"/><text x="${sz/2}" y="${sz*.5}" text-anchor="middle" font-size="${sz*.44}" fill="white">${cat.icon}</text></svg>`;
  return L.divIcon({html:svg, iconSize:[sz,sz+10], iconAnchor:[sz/2,sz+10]});
}

function renderMarkers() {
  Object.values(markers).forEach(m => map.removeLayer(m));
  markers = {};
  data.forEach(inc => {
    if (!inc.active || viewMode !== 'active') return;
    if (!activeFilters.has(inc.category)) return;
    const m = L.marker([inc.lat, inc.lng], { icon: makeIcon(inc.category) }).addTo(map);
    m.bindPopup(popupContent(inc));
    markers[inc.id] = m;
  });
}

function popupContent(inc) {
  let acts = '';
  if(isAdmin) acts = `<div><button onclick="editInc('${inc.id}')">✏️ Düzenle</button> <button onclick="resolveInc('${inc.id}')">✅ Çözüldü</button> <button onclick="deleteInc('${inc.id}')">🗑 Sil</button></div>`;
  return `<b>${inc.category}</b><br>${inc.description}<br><img src="${inc.photo||''}" width="200" onerror="this.style.display='none'"><br>${inc.date} ${inc.location||''}<br>${acts}`;
}

function renderList() { /* orijinaldeki gibi */ }
function updateStats() { /* orijinaldeki gibi */ }
function initFilters() { /* orijinaldeki gibi */ }
function saveReport() { /* orijinaldeki gibi ama sendPost kullanarak */ }
function editInc(id) { /* orijinaldeki gibi */ }
function resolveInc(id) { /* orijinaldeki gibi */ }
function deleteInc(id) { sendDelete(id); }
function toggleAdd() { /* orijinaldeki gibi */ }

// Admin girişi
function promptLogin() {
  let pwd = prompt("Admin şifresi:");
  if(pwd === adminPass) { isAdmin = true; alert("Admin girişi yapıldı"); }
  else alert("Hatalı şifre");
}

// Başlat
fetchData();
initFilters();
// ... diğer başlatmalar