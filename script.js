const vatmarkUrl =
  "https://api.scb.se/OV0104/v1/doris/sv/ssd/START/MI/MI1303/MI1303B/ExplVatmark";

const vatmarkQuery = {
  query: [
    {
      code: "Region",
      selection: {
        filter: "vs:RegionLän07EjAggr",
        values: [
          "01",
          "03",
          "04",
          "05",
          "06",
          "07",
          "08",
          "09",
          "10",
          "12",
          "13",
          "14",
          "17",
          "18",
          "19",
          "20",
          "21",
          "22",
          "23",
          "24",
          "25",
        ],
      },
    },
  ],
  response: {
    format: "JSON",
  },
};

const regionCodeMap = {
  "01": "Stockholm",
  "03": "Uppsala",
  "04": "Södermanland",
  "05": "Östergötland",
  "06": "Jönköping",
  "07": "Kronoberg",
  "08": "Kalmar",
  "09": "Gotland",
  10: "Blekinge",
  12: "Skåne",
  13: "Halland",
  14: "Västra Götaland",
  17: "Värmland",
  18: "Örebro",
  19: "Västmanland",
  20: "Dalarna",
  21: "Gävleborg",
  22: "Västernorrland",
  23: "Jämtland",
  24: "Västerbotten",
  25: "Norrbotten",
};

async function buildVatmarkData() {
  const response = await fetch(vatmarkUrl, {
    method: "POST",
    body: JSON.stringify(vatmarkQuery),
  });
  const rawData = await response.json();

  console.log(rawData);

  const hektarVarden = rawData.data.map((item) => Number(item.values[0]));

  const regioner = rawData.data.map((item) => regionCodeMap[item.key[0]]);

  return {
    regioner,
    hektarVarden,
  };
}

async function displayVatmarkMap() {
  const mapData = await buildVatmarkData();

  const data = [
    {
      type: "choroplethmap",
      locations: mapData.regioner,
      z: mapData.hektarVarden,
      geojson:
        "https://raw.githubusercontent.com/okfse/sweden-geojson/refs/heads/master/swedish_regions.geojson",
      featureidkey: "properties.name",
      colorscale: "Greens",
      reversescale: true,
    },
  ];

  const layout = {
    map: {
      center: { lon: 16.0, lat: 62 },
      zoom: 3.5,
    },
    margin: { r: 0, t: 0, b: 0, l: 0 },
    autosize: true,
  };

  Plotly.newPlot("sverigekarta", data, layout);
}

displayVatmarkMap();
w;
