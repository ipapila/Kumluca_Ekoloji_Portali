const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());

const DATA_FILE = './data.json';

// veri oku
function readData(){
  if(!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

// veri yaz
function writeData(data){
  fs.writeFileSync(DATA_FILE, JSON.stringify(data,null,2));
}

// TEST
app.get('/', (req,res)=>{
  res.send("API çalışıyor");
});

// GET
app.get('/ihlaller', (req,res)=>{
  res.json(readData());
});

// POST
app.post('/ihlaller', (req,res)=>{
  const data = readData();
  const yeni = {
    id: Date.now(),
    ...req.body
  };
  data.push(yeni);
  writeData(data);
  res.json(yeni);
});

app.listen(3000, ()=> console.log("Server çalışıyor"));
