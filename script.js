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
    (total, index) => total - direktHektar[index]
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
GRAF 1 Stapeldiagram
*/

async function displayStapeldiagram() {
  const allData = await fetchVatmark();
  console.log(allData);

  //Filtrera till;
  //År 2024
  //Hektar
  //Exkludera totalen
  const filtrerad = allData.filter((item) => {
    return item.key[3] === "2024" && item.key[1] !== "TOT";
  });

  //Hektar per region
  const regionTotals = {};

  filtrerad.forEach((item) => {
    const region = item.key[0];
    const hektar = Number(item.values[0]);

    if (!regionTotals[region]) {
      regionTotals[region] = 0;
    }

    regionTotals[region] += hektar;
  });

  //Topp 10 regioner
  const topRegioner = Object.entries(regionTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([region]) => region);

  //Exploateringstyper
  const exploateringstyper = ["BYGGN", "JVAG", "VAG"];

  //Färger
  const colors = {
    BYGGN: "#FAFFE0",
    JVAG: "#8b966c",
    VAG: "#173505",
  };

  //Dataset för uppbyggnad av staplar
  const datasets = exploateringstyper.map((typ) => ({
    label: typ,
    backgroundColor: colors[typ],

    data: topRegioner.map((region) => {
      const found = filtrerad.find(
        (item) => item.key[0] === region && item.key[1] === typ
      );
      return found ? Number(found.values[0]) : 0;
    }),
  }));

  //Skapa diagram
  new Chart(document.getElementById("stapeldiagram"), {
    type: "bar",
    data: {
      labels: topRegioner,
      datasets,
    },

    options: {
      indexAxis: "y",
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Topp 10 regioner vs våtmarksexploatering i hektar (2024)",
        },

        legend: {
          position: "bottom",
        },
      },

      scales: {
        x: {
          beginAtZero: true,

          title: {
            display: true,
            text: "Hektar",
          },
        },
      },
    },
  });
}

/*
 GRAF 2 – CIRKELDIAGRAM
 Visar fördelning mellan exploateringstyper år 2024
 */

async function displayCirkeldiagram() {
  const allData = await fetchVatmark();

  let byggnation = 0;
  let jarnvag = 0;
  let vagar = 0;

  allData.forEach((item) => {
    const region = item.key[0];
    const exploateringstyp = item.key[1];
    const innehall = item.key[2];
    const ar = item.key[3];

    // bara år 2024
    // bara direkt exploatering (000006WZ)
    if (ar === "2024" && innehall === "000006WZ") {
      const value = Number(item.values[0]);

      if (exploateringstyp === "BYGGN") {
        byggnation += value;
      } else if (exploateringstyp === "JVAG") {
        jarnvag += value;
      } else if (exploateringstyp === "VAG") {
        vagar += value;
      }
    }
  });

  const ctx = document.getElementById("cirkeldiagram");

  new Chart(ctx, {
    type: "pie",

    data: {
      labels: ["Byggnation", "Järnvägar", "Vägar"],

      datasets: [
        {
          data: [byggnation, jarnvag, vagar],

          backgroundColor: ["#173505", "#4f7d33", "#8b966c"],

          borderWidth: 1,
        },
      ],
    },

    options: {
      responsive: true,

      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

/*
  GRAF 3
  */

/*
  GRAF 4
  */

/* LADDA ALLA DIAGRAM */
window.addEventListener("DOMContentLoaded", () => {
  displayStapeldiagram();
  displayCirkeldiagram();
});
