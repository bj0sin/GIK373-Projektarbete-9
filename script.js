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

const typeNames = {
  BYGGN: "Byggnation",
  JVAG: "Järnväg",
  VAG: "Vägar",
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

/*
GRAF 1 Stapeldiagram
*/

async function displayStapeldiagram() {
  const allVatmarkData = await fetchVatmark();
  console.log(allVatmarkData);

  const filteredData = allVatmarkData.filter((item) => {
    return item.key[2] === "2024" && item.key[1] !== "TOT";
  });

  //Hektar per region
  const regionTotals = {};

  filteredData.forEach((item) => {
    const region = item.key[0];
    const hektar = Number(item.values[0]);

    if (!regionTotals[region]) {
      regionTotals[region] = 0;
    }

    regionTotals[region] += hektar;
  });

  const topRegioner = Object.entries(regionTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([code]) => ({
      code,
      name: regionCodeMap[code] ?? code,
    }));

  const exploateringstyper = ["BYGGN", "JVAG", "VAG"];

  const colors = {
    BYGGN: "#FAFFE0",
    JVAG: "#8b966c",
    VAG: "#173505",
  };

  const datasets = exploateringstyper.map((typ) => ({
    label: typeNames[typ],
    backgroundColor: colors[typ],

    data: topRegioner.map((region) => {
      const found = filteredData.find(
        (item) => item.key[0] === region.code && item.key[1] === typ,
      );
      return found ? Number(found.values[0]) : 0;
    }),
  }));

  new Chart(document.getElementById("stapeldiagram"), {
    type: "bar",
    data: {
      labels: topRegioner.map((r) => r.name),
      datasets,
    },

    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          color: "#FAFFE0",
          text: "Topp 10 regioner med våtmarksexploatering i hektar (2024)",
          font: {
            size: 18,
            weight: "bold",
          },
        },

        legend: {
          position: "bottom",
          labels: {
            color: "#FAFFE0",
            font: {
              size: 14,
            },
            padding: 20,
          },
        },
      },

      scales: {
        x: {
          ticks: {
            color: "#FAFFE0",
            font: {
              size: 12,
            },
          },

          title: {
            display: true,
            color: "#FAFFE0",
            text: "Hektar",
            font: {
              size: 14,
              weight: "bold",
            },
          },
        },
        y: {
          ticks: {
            color: "#FAFFE0",
            font: {
              size: 12,
            },
          },
        },
      },
    },
  });
}

/* GRAF 2 CIRKELDIAGRAM*/

async function displayCirkeldiagram() {
  const allVatmarkData = await fetchVatmark();

  // filtrera fram rätt data
  const filteredData = allVatmarkData.filter((item) => {
    return item.key.includes("2024") && item.key.includes("000006WZ");
  });

  let byggnation = 0;
  let jarnvag = 0;
  let vagar = 0;

  allVatmarkData.forEach((item) => {
    const exploateringstyp = item.key[1];
    const ar = item.key[2];

    if (ar === "2024") {
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

  new Chart(document.getElementById("cirkeldiagram"), {
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

      layout: {
        padding: 30,
      },

      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#FAFFE0",
          },
        },

        title: {
          display: true,
          text: "Störst påverkan på våtmarker i hektar",
          color: "#FAFFE0",
          font: {
            size: 18,
            weight: "bold",
          },
        },
      },
    },
  });
}

/*
  GRAF 3
  */

/*
  GRAF 4 drop down
  */

async function displayDropdownDiagram() {
  const vatmarkData = await fetchVatmark();
  const befolkData = await fetchBefolkning();

  const years = ["2020", "2021", "2022", "2023", "2024"];
  const combinedData = {};

  Object.keys(regionCodeMap).forEach((code) => {
    combinedData[code] = {};
    years.forEach(
      (year) => (combinedData[code][year] = { vatmark: 0, befolkning: 0 }),
    );
  });

  vatmarkData.forEach((item) => {
    const region = item.key[0];
    const typ = item.key[1];
    const year = item.key[2];

    if (typ === "TOT" && combinedData[region]) {
      combinedData[region][year].vatmark = Number(item.values[1]);
    }
  });

  befolkData.forEach((item) => {
    const region = item.key[0];
    const year = item.key.find((k) => years.includes(k));

    if (combinedData[region] && year) {
      combinedData[region][year].befolkning = Number(item.values[0]);
    }
  });

  function getPerCapitaData(regionCode) {
    return years.map((year) => {
      const v = combinedData[regionCode][year].vatmark;
      const b = combinedData[regionCode][year].befolkning;
      if (b === 0) return 0;
      return (v / b) * 100000;
    });
  }

  const dropdown = document.getElementById("regionDropdown");
  Object.entries(regionCodeMap).forEach(([code, name]) => {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = name;
    dropdown.appendChild(option);
  });

  dropdown.value = "01";

  const ctx = document.getElementById("dropdowndiagram").getContext("2d");
  let myChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: years,
      datasets: [
        {
          label: `Hektar per 100 000 inv. (${regionCodeMap["01"]})`,
          data: getPerCapitaData("01"),
          borderColor: "#FAFFE0",
          backgroundColor: "rgba(250, 255, 224, 0.2)",
          borderWidth: 3,
          pointBackgroundColor: "#173505",
          pointBorderColor: "#FAFFE0",
          pointRadius: 5,
          fill: true,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: "#FAFFE0", font: { size: 14 } },
        },
      },
      scales: {
        x: {
          ticks: { color: "#FAFFE0" },
          grid: { color: "rgba(255,255,255,0.1)" },
        },
        y: {
          ticks: { color: "#FAFFE0" },
          grid: { color: "rgba(255,255,255,0.1)" },
          title: { display: true, text: "Hektar", color: "#FAFFE0" },
        },
      },
    },
  });

  dropdown.addEventListener("change", (e) => {
    const selectedRegion = e.target.value;
    myChart.data.datasets[0].data = getPerCapitaData(selectedRegion);
    myChart.data.datasets[0].label = `Hektar per 100 000 inv. (${regionCodeMap[selectedRegion]})`;
    myChart.update();
  });
}

/* LADDA ALLA DIAGRAM */
window.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("sverigekarta")) {
    displayVatmarkMap();
  }
  if (document.getElementById("stapeldiagram")) {
    displayStapeldiagram();
  }
  if (document.getElementById("cirkeldiagram")) {
    displayCirkeldiagram();
  }
  if (document.getElementById("linjediagram")) {
    displayLinjeDiagram();
  }
  if (document.getElementById("dropdowndiagram")) {
    displayDropdownDiagram();
  }
});

/* SIDOMENY SCROLLSPY*/
window.addEventListener("DOMContentLoaded", () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          document
            .querySelectorAll(".nav-lank")
            .forEach((lank) => lank.classList.remove("active"));

          const rattLank = document.querySelector(
            `.nav-lank[href="#${entry.target.id}"]`,
          );
          if (rattLank) rattLank.classList.add("active");
        }
      });
    },
    { rootMargin: "-30% 0px -50% 0px" },
  );

  document
    .querySelectorAll(".statistik-sektion")
    .forEach((graf) => observer.observe(graf));
});

/* PRICKAR UNDER KORT */
window.addEventListener("DOMContentLoaded", () => {
  const karusell = document.querySelector(".karusell");
  const kort = document.querySelectorAll(".fakta-kort");
  const dots = document.querySelectorAll(".dot");

  if (!karusell) return;

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      const scrollPos = kort[i].offsetLeft - karusell.offsetLeft;

      karusell.scrollTo({
        left: scrollPos,
        behavior: "smooth",
      });
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Array.from(kort).indexOf(entry.target);

          document.querySelector(".dot.active")?.classList.remove("active");
          if (dots[index]) {
            dots[index].classList.add("active");
          }
        }
      });
    },
    {
      root: karusell,
      threshold: 0.5,
    },
  );

  kort.forEach((k) => observer.observe(k));
});
