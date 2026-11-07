// ============================================================
// OEOO PHILIPPINES — FIELD ATLAS
// Edit the 'sites' array below to add new field observations.
// ============================================================

const sites = [
  {
    id: "survey-01",
    name: "Survey Point 01",
    date: "2026-10-16",
    time: "10:36 AM",
    lat: 13.509716,
    lng: 120.950661,
    type: "survey",
    note: "No site description supplied."
  },
  {
    id: "wreck-01",
    name: "Ship Wreck",
    date: "2026-10-16",
    time: "12:03 PM",
    lat: 13.510405,
    lng: 120.950215,
    type: "wreck",
    note: "Recorded as 'Ship Wreck' in the source spreadsheet."
  },
  {
    id: "survey-02",
    name: "Survey Point 02",
    date: "2026-10-16",
    time: "3:12 PM",
    lat: 13.50948,
    lng: 120.950006,
    type: "survey",
    note: "No site description supplied."
  }
];

// Map configuration
const map = L.map("map", { zoomControl: false }).setView([13.5099, 120.9503], 17);
L.control.zoom({ position: "bottomright" }).addTo(map);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>'
}).addTo(map);

const layer = L.layerGroup().addTo(map);
const markers = new Map();
let selected = null;

const el = id => document.getElementById(id);
const coord = site => `${site.lat.toFixed(6)}, ${site.lng.toFixed(6)}`;

function iconFor(site) {
  return L.divIcon({
    className: "",
    html: `<div class="pin ${site.type === "wreck" ? "wreck" : ""} ${selected === site.id ? "selected" : ""}"></div>`,
    iconSize: [25, 25],
    iconAnchor: [12, 12]
  });
}

// Create markers and popups
sites.forEach(site => {
  const marker = L.marker([site.lat, site.lng], {
    icon: iconFor(site),
    title: site.name
  }).addTo(layer);

  marker.bindPopup(`
    <div class="popup-title">${site.name}</div>
    <div class="popup-sub">
      ${site.date} · ${site.time}<br>
      ${coord(site)}<br>
      ${site.note}
    </div>
    <a class="popup-link"
       href="https://www.openstreetmap.org/?mlat=${site.lat}&mlon=${site.lng}#map=18/${site.lat}/${site.lng}"
       target="_blank" rel="noopener">Open in OpenStreetMap ↗</a>
  `);

  marker.on("click", () => selectSite(site.id, false));
  markers.set(site.id, marker);
});

// Search and filter the site records
function filteredSites() {
  const query = el("search").value.trim().toLowerCase();
  const type = el("filter").value;

  return sites.filter(site =>
    (type === "all" || site.type === type) &&
    [site.name, site.date, site.time, site.note, coord(site)]
      .join(" ")
      .toLowerCase()
      .includes(query)
  );
}

function renderSites() {
  const visible = filteredSites();
  el("shownCount").textContent = `${visible.length} shown`;
  el("siteList").innerHTML = visible.length
    ? ""
    : '<div class="empty">No locations match your search.</div>';

  visible.forEach(site => {
    const button = document.createElement("button");
    button.className = "site" + (selected === site.id ? " active" : "");
    button.innerHTML = `
      <div class="site-head">
        <span class="site-name">${site.name}</span>
        <span class="pill ${site.type === "wreck" ? "wreck" : ""}">
          ${site.type === "wreck" ? "Shipwreck" : "Survey"}
        </span>
      </div>
      <span class="site-coord">${coord(site)}</span>
      <span class="site-date">${site.date} · ${site.time}</span>
    `;
    button.addEventListener("click", () => selectSite(site.id, true));
    el("siteList").appendChild(button);
  });

  markers.forEach((marker, id) => {
    const site = sites.find(item => item.id === id);
    if (visible.includes(site)) {
      if (!layer.hasLayer(marker)) layer.addLayer(marker);
    } else {
      layer.removeLayer(marker);
    }
  });
}

function selectSite(id, flyToLocation) {
  selected = id;
  markers.forEach((marker, markerId) => {
    marker.setIcon(iconFor(sites.find(site => site.id === markerId)));
  });
  renderSites();

  const marker = markers.get(id);
  if (flyToLocation) {
    map.flyTo(marker.getLatLng(), 18, { duration: 0.6 });
    marker.openPopup();
    if (window.innerWidth < 761) {
      el("app").classList.add("show-map");
      el("mobileSwitch").textContent = "View locations ☰";
      setTimeout(() => map.invalidateSize(), 60);
    }
  }
}

function fitAllSites() {
  const visible = filteredSites();
  if (visible.length) {
    map.fitBounds(
      L.latLngBounds(visible.map(site => [site.lat, site.lng])).pad(0.28),
      { maxZoom: 17, animate: true }
    );
  } else {
    map.setView([13.5099, 120.9503], 16);
  }
}

// Button and input interactions
el("search").addEventListener("input", () => {
  renderSites();
  fitAllSites();
});

el("filter").addEventListener("change", () => {
  renderSites();
  fitAllSites();
});

el("fit").addEventListener("click", fitAllSites);

el("resetTop").addEventListener("click", () => {
  el("search").value = "";
  el("filter").value = "all";
  selected = null;
  renderSites();
  fitAllSites();

  if (window.innerWidth < 761) {
    el("app").classList.add("show-map");
    el("mobileSwitch").textContent = "View locations ☰";
    setTimeout(() => map.invalidateSize(), 60);
  }
});

el("mobileSwitch").addEventListener("click", () => {
  const showMap = el("app").classList.toggle("show-map");
  el("mobileSwitch").textContent = showMap ? "View locations ☰" : "View map ↗";
  if (showMap) setTimeout(() => map.invalidateSize(), 70);
});

// Export currently visible records as CSV
el("export").addEventListener("click", () => {
  const rows = [
    ["Name", "Date", "Time", "Latitude", "Longitude", "Type", "Notes"],
    ...filteredSites().map(site => [
      site.name, site.date, site.time, site.lat, site.lng, site.type, site.note
    ])
  ];

  const csv = rows
    .map(row => row.map(value => '"' + String(value).replace(/"/g, '""') + '"').join(","))
    .join("\r\n");

  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  link.download = "oeoo-philippines-field-sites.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
});

// Initial page render
el("totalCount").textContent = sites.length;
el("wreckCount").textContent = sites.filter(site => site.type === "wreck").length;
renderSites();
fitAllSites();
