const vatmarkUrl =
  "https://api.scb.se/OV0104/v1/doris/sv/ssd/START/MI/MI1303/MI1303B/ExplVatmark";

const befolkningUrl =
  "https://api.scb.se/OV0104/v1/doris/sv/ssd/START/BE/BE0101/BE0101A/BefolkningNy";

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
    {
      code: "Exploateringstyp",
      selection: {
        filter: "item",
        values: ["BYGGN", "JVAG", "VAG", "TOT"],
      },
    },
    {
      code: "ContentsCode",
      selection: {
        filter: "item",
        values: ["000006WZ", "000006WX"],
      },
    },
    {
      code: "Tid",
      selection: {
        filter: "item",
        values: ["2020", "2021", "2022", "2023", "2024"],
      },
    },
  ],
  response: {
    format: "json",
  },
};

const befolkningQuery = {
  query: [
    {
      code: "Region",
      selection: {
        filter: "vs:RegionLän07",
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
    {
      code: "ContentsCode",
      selection: {
        filter: "item",
        values: ["BE0101N1"],
      },
    },
    {
      code: "Tid",
      selection: {
        filter: "item",
        values: ["2020", "2021", "2022", "2023", "2024"],
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

async function fetchVatmark() {
  const response = await fetch(vatmarkUrl, {
    method: "POST",
    body: JSON.stringify(vatmarkQuery),
  });
  const data = await response.json();
  return data.data;
}

async function fetchBefolkning() {
  const response = await fetch(befolkningUrl, {
    method: "POST",
    body: JSON.stringify(befolkningQuery),
  });
  const data = await response.json();
  return data.data;
}

/* 
KARTAN
*/
async function displayVatmarkMap() {
  const allVatmarkData = await fetchVatmark();

  const kartaData = allVatmarkData.filter((item) => {
    return item.key.includes("TOT") && item.key.includes("2024");
  });

  const regionerList = kartaData.map((item) => regionCodeMap[item.key[0]]);

  const direktHektar = kartaData.map((item) => Number(item.values[0]));
  const totalHektar = kartaData.map((item) => Number(item.values[1]));

  const indirektHektar = totalHektar.map(
    (total, index) => total - direktHektar[index],
  );

  const hoverData = direktHektar.map((direkt, index) => [
    direkt,
    indirektHektar[index],
  ]);

  const data = [
    {
      type: "choroplethmap",
      locations: regionerList,
      z: totalHektar,
      customdata: hoverData,
      geojson:
        "https://raw.githubusercontent.com/okfse/sweden-geojson/refs/heads/master/swedish_regions.geojson",
      featureidkey: "properties.name",
      colorscale: [
        [0, "#FAFFE0"],
        [0.5, "#8b966c"],
        [1, "#173505"],
      ],
      showscale: false,
      hovertemplate:
        "<b>%{location}</b><br><br>" +
        "Direkt exploatering: <b>%{customdata[0]} ha</b><br>" +
        "Indirekt exploatering: <b>%{customdata[1]} ha</b><extra></extra>",
      marker: { line: { color: "rgba(23,53,5,0.3)", width: 1 } },
    },
  ];

  const layout = {
    map: {
      center: { lon: 16.0, lat: 62 },
      zoom: 3.9,
    },
    margin: { r: 0, t: 0, b: 0, l: 0 },
    dragmode: false,
  };

  const config = {
    displayModeBar: false,
    responsive: true,
  };

  Plotly.newPlot("sverigekarta", data, layout, config);
}

displayVatmarkMap();

/*
GRAF 1
*/

/*
GRAF 2
*/

/*
GRAF 3
*/

/*
GRAF 4
*/
