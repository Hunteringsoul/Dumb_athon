// ────────────────── DOM ──────────────────
const panicBtn           = document.getElementById("panicBtn");
const logEl              = document.getElementById("log");
const page1              = document.getElementById("page1");
const page2              = document.getElementById("page2");
const page3              = document.getElementById("page3");
const btnZombie          = document.getElementById("btnZombie");
const btnDisease         = document.getElementById("btnDisease");
const btnNuclear         = document.getElementById("btnNuclear");
const btnBackToScenarios = document.getElementById("btnBackToScenarios");
const mapScenarioTitle   = document.getElementById("mapScenarioTitle");
const markerCountDisplay = document.getElementById("markerCountDisplay");
const statTotal          = document.getElementById("statTotal");
const legendEl           = document.getElementById("legend");
const btnToggleLegend    = document.getElementById("btnToggleLegend");
const btnCloseLegend     = document.getElementById("btnCloseLegend");
const pickerEl           = document.getElementById("markerTypePicker");

// ────────────────── TYPE DEFINITIONS ──────────────────
const TYPES = [
  {id:"food",      emoji:"🌾",label:"Food Supply",       bg:"rgba(80,200,80,.88)",   border:"#50c850",glow:"rgba(80,200,80,.7)",  cat:"survival"},
  {id:"water",     emoji:"💧",label:"Water Source",      bg:"rgba(40,140,255,.88)",  border:"#288cff",glow:"rgba(40,140,255,.7)", cat:"survival"},
  {id:"medical",   emoji:"🏥",label:"Medical",           bg:"rgba(255,80,80,.88)",   border:"#ff5050",glow:"rgba(255,80,80,.7)",  cat:"survival"},
  {id:"shelter",   emoji:"🏚️",label:"Shelter",           bg:"rgba(255,180,40,.88)",  border:"#ffb428",glow:"rgba(255,180,40,.7)", cat:"survival"},
  {id:"medicine",  emoji:"💊",label:"Medicine Cache",    bg:"rgba(255,100,180,.88)", border:"#ff64b4",glow:"rgba(255,100,180,.7)",cat:"survival"},
  {id:"power",     emoji:"⚡",label:"Power Grid",        bg:"rgba(255,240,60,.9)",   border:"#fff03c",glow:"rgba(255,240,60,.75)",cat:"infra"},
  {id:"fuel",      emoji:"⛽",label:"Fuel Depot",        bg:"rgba(255,140,30,.88)",  border:"#ff8c1e",glow:"rgba(255,140,30,.7)", cat:"infra"},
  {id:"comms",     emoji:"📡",label:"Comms Tower",       bg:"rgba(160,80,255,.88)",  border:"#a050ff",glow:"rgba(160,80,255,.7)", cat:"infra"},
  {id:"transport", emoji:"🚁",label:"Transport Hub",     bg:"rgba(80,200,240,.88)",  border:"#50c8f0",glow:"rgba(80,200,240,.7)", cat:"infra"},
  {id:"military",  emoji:"🪖",label:"Military Base",     bg:"rgba(200,160,60,.88)",  border:"#c8a03c",glow:"rgba(200,160,60,.7)", cat:"infra"},
  {id:"safe",      emoji:"✅",label:"Safe Zone",          bg:"rgba(40,200,100,.88)",  border:"#28c864",glow:"rgba(40,200,100,.7)", cat:"hazard"},
  {id:"danger",    emoji:"☠️",label:"Danger Zone",       bg:"rgba(255,30,30,.92)",   border:"#ff1e1e",glow:"rgba(255,30,30,.8)",  cat:"hazard"},
  {id:"radiation", emoji:"☢️",label:"Radiation Zone",    bg:"rgba(255,220,0,.9)",    border:"#ffdc00",glow:"rgba(255,220,0,.75)", cat:"hazard"},
  {id:"biohazard", emoji:"☣️",label:"Biohazard Zone",    bg:"rgba(180,60,255,.9)",   border:"#b43cff",glow:"rgba(180,60,255,.75)",cat:"hazard"},
  {id:"weapons",   emoji:"🔫",label:"Weapons Cache",     bg:"rgba(200,60,60,.88)",   border:"#c83c3c",glow:"rgba(200,60,60,.7)",  cat:"hazard"},
  {id:"unknown",   emoji:"❓",label:"Unknown",            bg:"rgba(140,140,140,.8)",  border:"#aaa",   glow:"rgba(140,140,140,.5)",cat:"custom"},
];

// ────────────────── WORLD SEED DATA ──────────────────
const WORLD_RESOURCES = [
  // FOOD (10)
  {type:"food",lat:39.9, lng:116.4, name:"Beijing Grain Depot"},
  {type:"food",lat:28.6, lng:77.2,  name:"New Delhi Food Reserve"},
  {type:"food",lat:-23.5,lng:-46.6, name:"São Paulo Food Hub"},
  {type:"food",lat:41.9, lng:12.5,  name:"Rome Agri-Store"},
  {type:"food",lat:43.7, lng:-79.4, name:"Toronto Supply Depot"},
  {type:"food",lat:31.2, lng:121.5, name:"Shanghai Food Cache"},
  {type:"food",lat:-33.9,lng:151.2, name:"Sydney Food Vault"},
  {type:"food",lat:52.5, lng:13.4,  name:"Berlin Grain Reserve"},
  {type:"food",lat:6.5,  lng:3.4,   name:"Lagos Food Depot"},
  {type:"food",lat:-34.6,lng:-58.4, name:"Buenos Aires Storage"},
  // WATER (9)
  {type:"water",lat:30.0, lng:31.2,  name:"Nile River Station"},
  {type:"water",lat:-3.7, lng:-73.2, name:"Amazon Basin Pump"},
  {type:"water",lat:61.0, lng:28.0,  name:"Lake Saimaa Reserve"},
  {type:"water",lat:47.6, lng:-122.3,name:"Seattle Reservoir"},
  {type:"water",lat:1.3,  lng:103.8, name:"Singapore Desalination"},
  {type:"water",lat:-6.8, lng:39.3,  name:"Dar es Salaam Tank"},
  {type:"water",lat:45.5, lng:-73.6, name:"Montreal Water Plant"},
  {type:"water",lat:64.1, lng:-21.9, name:"Reykjavik Geothermal"},
  {type:"water",lat:-17.7,lng:31.0,  name:"Harare Reservoir"},
  // MEDICAL (9)
  {type:"medical",lat:51.5, lng:-0.1,  name:"London Trauma Center"},
  {type:"medical",lat:40.7, lng:-74.0, name:"NYC Emergency Hospital"},
  {type:"medical",lat:35.7, lng:139.7, name:"Tokyo Medical Hub"},
  {type:"medical",lat:48.8, lng:2.35,  name:"Paris Field Hospital"},
  {type:"medical",lat:-33.9,lng:18.4,  name:"Cape Town Medical"},
  {type:"medical",lat:19.4, lng:-99.1, name:"Mexico City Clinic"},
  {type:"medical",lat:1.3,  lng:103.8, name:"Singapore General"},
  {type:"medical",lat:55.7, lng:37.6,  name:"Moscow Medical Center"},
  {type:"medical",lat:-26.2,lng:28.0,  name:"Johannesburg Hospital"},
  // SHELTER (8)
  {type:"shelter",lat:46.8, lng:8.2,    name:"Swiss Alpine Bunker"},
  {type:"shelter",lat:64.1, lng:-21.9,  name:"Reykjavik Underground"},
  {type:"shelter",lat:39.0, lng:-105.0, name:"Colorado Vault"},
  {type:"shelter",lat:-43.5,lng:172.6,  name:"Christchurch Shelter"},
  {type:"shelter",lat:55.7, lng:37.6,   name:"Moscow Metro Bunker"},
  {type:"shelter",lat:37.6, lng:127.0,  name:"Seoul Underground"},
  {type:"shelter",lat:32.1, lng:34.8,   name:"Tel Aviv Shelter"},
  {type:"shelter",lat:-25.7,lng:28.2,   name:"Pretoria Safe Room"},
  // MEDICINE (6)
  {type:"medicine",lat:40.7, lng:-74.0, name:"New York Pharma Cache"},
  {type:"medicine",lat:51.5, lng:-0.1,  name:"London Drug Stockpile"},
  {type:"medicine",lat:35.7, lng:139.7, name:"Tokyo Pharma Vault"},
  {type:"medicine",lat:48.8, lng:2.35,  name:"Paris Antiviral Reserve"},
  {type:"medicine",lat:28.6, lng:77.2,  name:"Delhi Vaccine Store"},
  {type:"medicine",lat:-23.5,lng:-46.6, name:"São Paulo Meds Cache"},
  // POWER (8)
  {type:"power",lat:36.5, lng:127.5,  name:"South Korea Grid Hub"},
  {type:"power",lat:45.4, lng:9.2,    name:"Milan Power Station"},
  {type:"power",lat:34.0, lng:-118.2, name:"LA Energy Grid"},
  {type:"power",lat:22.5, lng:88.4,   name:"Kolkata Power Plant"},
  {type:"power",lat:-26.2,lng:28.0,   name:"Johannesburg Grid"},
  {type:"power",lat:60.0, lng:10.7,   name:"Oslo Hydro Plant"},
  {type:"power",lat:55.8, lng:37.6,   name:"Moscow Power Grid"},
  {type:"power",lat:-33.9,lng:151.2,  name:"Sydney Energy Hub"},
  // FUEL (7)
  {type:"fuel",lat:26.3, lng:50.2,  name:"Persian Gulf Refinery"},
  {type:"fuel",lat:61.5, lng:60.7,  name:"Ural Fuel Depot"},
  {type:"fuel",lat:29.7, lng:-95.4, name:"Houston Petroleum Hub"},
  {type:"fuel",lat:-8.8, lng:13.2,  name:"Luanda Oil Terminal"},
  {type:"fuel",lat:59.9, lng:10.7,  name:"Oslo Gas Reserve"},
  {type:"fuel",lat:1.35, lng:103.8, name:"Singapore Fuel Port"},
  {type:"fuel",lat:51.5, lng:0.1,   name:"London Fuel Depot"},
  // COMMS (7)
  {type:"comms",lat:40.7, lng:-74.0,  name:"New York Relay Tower"},
  {type:"comms",lat:51.5, lng:-0.1,   name:"London Comms Hub"},
  {type:"comms",lat:35.7, lng:139.7,  name:"Tokyo Signal Station"},
  {type:"comms",lat:-33.9,lng:151.2,  name:"Sydney Satellite Link"},
  {type:"comms",lat:19.4, lng:-99.1,  name:"Mexico City Tower"},
  {type:"comms",lat:28.6, lng:77.2,   name:"New Delhi Relay"},
  {type:"comms",lat:55.7, lng:37.6,   name:"Moscow Comms Center"},
  // TRANSPORT (7)
  {type:"transport",lat:51.47,lng:-0.46,  name:"Heathrow Evac Hub"},
  {type:"transport",lat:40.64,lng:-73.78, name:"JFK Airlift Point"},
  {type:"transport",lat:35.55,lng:139.78, name:"Tokyo Haneda Ops"},
  {type:"transport",lat:1.36, lng:103.99, name:"Changi Evac Airport"},
  {type:"transport",lat:25.25,lng:55.36,  name:"Dubai Air Bridge"},
  {type:"transport",lat:48.11,lng:16.57,  name:"Vienna Evac Base"},
  {type:"transport",lat:-33.94,lng:151.18,name:"Sydney Kingsford Hub"},
  // MILITARY (7)
  {type:"military",lat:38.9, lng:-77.0,  name:"Pentagon Command"},
  {type:"military",lat:55.8, lng:37.6,   name:"Moscow Arsenal"},
  {type:"military",lat:39.9, lng:116.4,  name:"Beijing Command"},
  {type:"military",lat:51.5, lng:-0.1,   name:"London MoD Base"},
  {type:"military",lat:35.7, lng:139.7,  name:"Tokyo JSDF HQ"},
  {type:"military",lat:-33.9,lng:151.2,  name:"Sydney RAAF Base"},
  {type:"military",lat:28.6, lng:77.2,   name:"Delhi Defence HQ"},
  // DANGER (8)
  {type:"danger",lat:37.4, lng:141.0,  name:"Fukushima Exclusion Zone"},
  {type:"danger",lat:51.4, lng:30.1,   name:"Chernobyl Zone"},
  {type:"danger",lat:36.6, lng:36.2,   name:"North Syria Conflict Zone"},
  {type:"danger",lat:15.6, lng:32.5,   name:"Khartoum Ground Zero"},
  {type:"danger",lat:3.0,  lng:42.0,   name:"Somalia Collapse Region"},
  {type:"danger",lat:33.5, lng:36.3,   name:"Damascus Hot Zone"},
  {type:"danger",lat:31.5, lng:34.5,   name:"Gaza Exclusion Zone"},
  {type:"danger",lat:-1.3, lng:36.8,   name:"Nairobi Outbreak Zone"},
  // RADIATION (4)
  {type:"radiation",lat:37.4,lng:141.0, name:"Fukushima Radiation Plume"},
  {type:"radiation",lat:51.4,lng:30.1,  name:"Chernobyl Fallout Zone"},
  {type:"radiation",lat:49.6,lng:35.3,  name:"Ukraine Fallout Region"},
  {type:"radiation",lat:22.0,lng:38.0,  name:"Red Sea Drift Zone"},
  // BIOHAZARD (5)
  {type:"biohazard",lat:30.6,lng:114.3,  name:"Wuhan Quarantine Zone"},
  {type:"biohazard",lat:8.5, lng:-11.8,  name:"West Africa Ebola Region"},
  {type:"biohazard",lat:0.3, lng:32.6,   name:"Uganda Viral Zone"},
  {type:"biohazard",lat:15.6,lng:32.5,   name:"Sudan Pathogen Site"},
  {type:"biohazard",lat:23.1,lng:113.3,  name:"Guangzhou Outbreak Zone"},
  // SAFE (7)
  {type:"safe",lat:64.1, lng:-21.9, name:"Iceland Safe Zone"},
  {type:"safe",lat:-54.8,lng:-68.3, name:"Patagonia Refuge"},
  {type:"safe",lat:46.8, lng:8.2,   name:"Switzerland Safe Area"},
  {type:"safe",lat:-43.5,lng:172.6, name:"New Zealand Safe Zone"},
  {type:"safe",lat:59.3, lng:18.1,  name:"Stockholm Enclave"},
  {type:"safe",lat:63.4, lng:10.4,  name:"Trondheim Safe Haven"},
  {type:"safe",lat:-41.3,lng:174.8, name:"Wellington Refuge"},
  // WEAPONS (5)
  {type:"weapons",lat:38.9,lng:-77.0,  name:"Pentagon Armory"},
  {type:"weapons",lat:55.8,lng:37.6,   name:"Moscow Arsenal Depot"},
  {type:"weapons",lat:51.5,lng:-0.1,   name:"London Vault"},
  {type:"weapons",lat:35.7,lng:139.7,  name:"Tokyo JSDF Depot"},
  {type:"weapons",lat:28.6,lng:77.2,   name:"Delhi Armoury"},
];

// ────────────────── STATE ──────────────────
let pressCount   = 0;
let map          = null;
let activeType   = "food";
let totalPlaced  = 0;
const layerGroups  = {};
const counts       = {};
const hiddenLayers = new Set();
TYPES.forEach(t => { counts[t.id] = 0; });

const messages = [
  "Panic signal armed.",
  "Apoclypse protocol handshake started.",
  "Reality integrity check in progress...",
  "Multiverse notified. Please stand by.",
  "Apoclypse averted. For now."
];

// ────────────────── NAVIGATION ──────────────────
function showPage(p) {
  [page1,page2,page3].forEach(x=>x.classList.remove("page--active"));
  p.classList.add("page--active");
}

function launchMap(name) {
  mapScenarioTitle.textContent = name;
  showPage(page3);
  initMap();
}

// ────────────────── MAP INIT ──────────────────
function initMap() {
  if (map) { setTimeout(()=>map.invalidateSize(),80); return; }

  map = L.map("map",{center:[20,10],zoom:2,zoomControl:true,preferCanvas:true});

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains:"abcd",maxZoom:19
  }).addTo(map);

  TYPES.forEach(t=>{ layerGroups[t.id]=L.layerGroup().addTo(map); });
  WORLD_RESOURCES.forEach(r=>placeMarker(r.type,{lat:r.lat,lng:r.lng},r.name,false));

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos=>{
      const {latitude:lat,longitude:lng}=pos.coords;
      const yi=L.divIcon({className:"",html:'<div class="you-are-here"></div>',iconSize:[16,16],iconAnchor:[8,8]});
      L.marker([lat,lng],{icon:yi,zIndexOffset:3000}).addTo(map)
        .bindPopup('<div style="color:#4af;font-size:.82rem;font-weight:700;letter-spacing:.1em;text-align:center;padding:4px 8px;">📍 YOU ARE HERE</div>');
      map.setView([lat,lng],5,{animate:true});
    },()=>{});
  }

  map.on("click",e=>placeMarker(activeType,e.latlng,null,true));
  buildPicker();
}

// ────────────────── PLACE MARKER ──────────────────
function placeMarker(typeId,latlng,nameOverride,openPopup){
  const t=TYPES.find(x=>x.id===typeId)||TYPES[TYPES.length-1];
  counts[t.id]++; totalPlaced++; updateCounts();
  const defaultName=nameOverride||(t.label+" #"+counts[t.id]);

  const icon=L.divIcon({
    className:"",
    html:`<div class="res-marker" style="width:28px;height:28px;background:${t.bg};border-color:${t.border};box-shadow:0 0 14px ${t.glow},0 2px 6px rgba(0,0,0,.8);">${t.emoji}</div>`,
    iconSize:[28,28],iconAnchor:[14,14]
  });

  const marker=L.marker([latlng.lat,latlng.lng],{icon}).addTo(layerGroups[t.id]);
  marker._typeId=typeId; marker._name=defaultName; marker._note="";
  marker.bindPopup(buildPopup(t,defaultName,""),{minWidth:220});
  if(openPopup) marker.openPopup();

  marker.on("popupopen",()=>{
    const el=document.querySelector(".leaflet-popup-content .popup-inner");
    if(!el) return;
    const inp=el.querySelector(".popup-name-input");
    const note=el.querySelector(".popup-note-input");
    el.querySelector(".popup-save-btn").addEventListener("click",()=>{
      const n=inp.value.trim()||defaultName;
      const nt=note.value.trim();
      marker._name=n; marker._note=nt;
      marker.setPopupContent(buildPopup(t,n,nt)); marker.closePopup();
    });
    el.querySelector(".popup-delete-btn").addEventListener("click",()=>{
      layerGroups[t.id].removeLayer(marker);
      counts[t.id]=Math.max(0,counts[t.id]-1);
      totalPlaced=Math.max(0,totalPlaced-1); updateCounts();
    });
  });
}

function buildPopup(t,name,note){
  return `<div class="popup-inner">
    <div class="popup-header">
      <div class="popup-icon-big">${t.emoji}</div>
      <div class="popup-title-col">
        <div class="popup-type-label">${t.label}</div>
        <div class="popup-name-display">${name}</div>
      </div>
    </div>
    <input class="popup-name-input" type="text" value="${name.replace(/"/g,'&quot;')}" placeholder="Location name…"/>
    <textarea class="popup-note-input" rows="2" placeholder="Status, supplies, intel…">${note}</textarea>
    <div class="popup-btn-row">
      <button class="popup-save-btn">💾 Save</button>
      <button class="popup-delete-btn">✕ Remove</button>
    </div>
  </div>`;
}

// ────────────────── PICKER ──────────────────
function buildPicker(){
  let lastCat=null;
  TYPES.forEach(t=>{
    if(t.cat!==lastCat&&lastCat!==null){
      const sep=document.createElement("div"); sep.className="mtp-sep"; pickerEl.appendChild(sep);
    }
    lastCat=t.cat;
    const btn=document.createElement("div");
    btn.className="mtp-btn"+(t.id===activeType?" active":"");
    btn.dataset.id=t.id;
    btn.innerHTML=`${t.emoji}<span class="mtp-tip">${t.label}</span>`;
    btn.addEventListener("click",()=>{
      activeType=t.id;
      pickerEl.querySelectorAll(".mtp-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
    });
    pickerEl.appendChild(btn);
  });
}

// ────────────────── COUNTS ──────────────────
function updateCounts(){
  markerCountDisplay.textContent=totalPlaced;
  statTotal.textContent=totalPlaced;
  TYPES.forEach(t=>{
    const el=document.getElementById("cnt-"+t.id);
    if(!el) return;
    el.textContent=counts[t.id]>0?counts[t.id]:"";
    el.classList.toggle("has",counts[t.id]>0);
  });
}

// ────────────────── EVENTS ──────────────────
panicBtn.addEventListener("click",()=>{
  pressCount++;
  logEl.innerHTML="<strong>"+messages[(pressCount-1)%messages.length]+"</strong>";
  document.body.animate(
    [{transform:"translate(0,0)"},{transform:"translate(-2px,1px)"},{transform:"translate(3px,-1px)"},{transform:"translate(0,0)"}],
    {duration:120,iterations:1}
  );
  if(pressCount===1) setTimeout(()=>showPage(page2),350);
});

btnZombie.addEventListener("click",  ()=>launchMap("🧟 Zombie Outbreak"));
btnDisease.addEventListener("click", ()=>launchMap("☣️ Disease Outbreak"));
btnNuclear.addEventListener("click", ()=>launchMap("☢️ Nuclear Outbreak"));
btnBackToScenarios.addEventListener("click",()=>showPage(page2));

btnToggleLegend.addEventListener("click",()=>{
  legendEl.classList.remove("collapsed");
  btnToggleLegend.classList.add("open");
});
btnCloseLegend.addEventListener("click",()=>{
  legendEl.classList.add("collapsed");
  btnToggleLegend.classList.remove("open");
});

legendEl.querySelectorAll(".legend-row[data-layer]").forEach(row=>{
  row.addEventListener("click",()=>{
    const id=row.dataset.layer;
    if(!layerGroups[id]||!map) return;
    if(hiddenLayers.has(id)){
      hiddenLayers.delete(id); layerGroups[id].addTo(map); row.classList.remove("dimmed");
    } else {
      hiddenLayers.add(id); map.removeLayer(layerGroups[id]); row.classList.add("dimmed");
    }
  });
});

// ────────────────── INITIALIZE MAIN APP ──────────────────
function initMainApp() {
  // This function is called after face recognition unlocks the app
  // All initialization is already done above, but we can add any post-unlock setup here
  console.log('App unlocked and initialized');
}
