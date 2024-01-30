// Basemaps
var defaultMap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

var grayscale = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
  attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  subdomains: 'abcd',
  minZoom: 0,
  maxZoom: 20,
  ext: 'png'
});

var satellite = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFya2V0c3RhdCIsImEiOiJjbHJ5MzJkNnUxM3BwMmpwOGs0M21scjUzIn0.HLEOl5ouAJVHFdrYm2lcig', {
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'
});

// Basemaps Object
let basemaps = {
  Satellite: satellite,
  Grayscale: grayscale,
  Default: defaultMap
};

// Map Initialization
var myMap = L.map("map", {
  center: [36.7783, -119.4179],
  zoom: 5,
  layers: [satellite, grayscale, defaultMap]
});

// Default basemap added to the map
defaultMap.addTo(myMap);

// Tectonic Plates Layer
let tectonicplates = new L.LayerGroup();

// Fetch Tectonic Plates GeoJSON data and add to the layer group
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json")
  .then(function(plateData) {
    L.geoJson(plateData, {
      color: "yellow",
      weight: 1
    }).addTo(tectonicplates);
  });

// Add Tectonic Plates Layer to the map
tectonicplates.addTo(myMap);

// Earthquake Data Layer
let earthquakes = new L.LayerGroup();

// Fetch Earthquake GeoJSON data and add to the layer group
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson")
  .then(function(earthquakeData) {
    // Function to determine color based on earthquake depth
    function dataColor(depth) {
      if (depth > 90) return "red";
      else if (depth > 70) return "#fc4903";
      else if (depth > 50) return "#fc8403";
      else if (depth > 30) return "#fcad03";
      else if (depth > 10) return "#cafc03";
      else return "green";
    }

    // Function to determine radius size based on earthquake magnitude
    function radiusSize(mag) {
      return mag === 0 ? 1 : mag * 5;
    }

    // Function to define style for each earthquake data point
    function dataStyle(feature) {
      return {
        opacity: 0.5,
        fillOpacity: 0.5,
        fillColor: dataColor(feature.geometry.coordinates[2]),
        color: "000000",
        radius: radiusSize(feature.properties.mag),
        weight: 0.5,
        stroke: true
      };
    }

    // Add Earthquake GeoJSON data to the earthquakes layer group
    L.geoJson(earthquakeData, {
      pointToLayer: function(feature, latLng) {
        return L.circleMarker(latLng);
      },
      style: dataStyle,
      onEachFeature: function(feature, layer) {
        layer.bindPopup(`Magnitude: <b>${feature.properties.mag}</b><br>
                         Depth: <b>${feature.geometry.coordinates[2]}</b><br>
                         Location: <b>${feature.properties.place}</b>`);
      }
    }).addTo(earthquakes);
  });

// Add Earthquakes Layer to the map
earthquakes.addTo(myMap);

// Layer Control
let overlays = {
  "Tectonic Plates": tectonicplates,
  "Earthquake Data": earthquakes
};

// Create a Layer Control and add to the map
L.control.layers(basemaps, overlays).addTo(myMap);

// Legend
let legend = L.control({
  position: "bottomright"
});

// Function to add legend HTML to the map
legend.onAdd = function () {
  let div = L.DomUtil.create("div", "info legend");

  let intervals = [-10, 10, 30, 50, 70, 90];
  let colors = ["green", "#cafc03", "#fcad03", "#fc8403", "#fc4903", "red"];

  for (var i = 0; i < intervals.length; i++) {
    // Set background color using the colors array
    let backgroundColor = colors[i];

    // Create a <div> for each legend item with a colored square and background color for text
    div.innerHTML +=
      "<div style='background:" +
      backgroundColor +
      "; display:inline-block; width:15px; height:15px; margin-right: 5px;'></div>" +
      "<span style='background:" +
      backgroundColor +
      "; padding: 2px 5px;'>" +
      intervals[i] +
      (intervals[i + 1] ? "km &ndash; " + intervals[i + 1] + "km" : "+") +
      "</span><br>";
  }
  return div;
};

// Add Legend to the map
legend.addTo(myMap);