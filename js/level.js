CONFIRMED_URL =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv";
XAXIS_MULTIPLIER = 0.7;
YAXIS_MULTIPLIER = 0.00025;
// YAXIS_MULTIPLIER = 0.1;

load_covid_level = function (xmoto_ref, callback) {
  return $.get(CONFIRMED_URL, function (confirmed_csv) {
    return load_covid_level_helper(confirmed_csv, xmoto_ref, callback);
  });
};

load_covid_level_helper = function (confirmed_csv, xmoto_ref, callback) {
  var country_confirmed_map = parse_csv_data(confirmed_csv);
  var country_new_cases_map = convert_to_new_cases_map(country_confirmed_map);
  var us_timeseries =
    country_new_cases_map[Object.keys(country_new_cases_map)[0]];
  var num_days = us_timeseries.length;
  var level_json = initial_level_json(
    num_days,
    Math.max.apply(null, us_timeseries)
  );

  for (var country of Object.keys(country_confirmed_map)) {
    add_block_for_country(level_json, country_new_cases_map, country);
  }
  console.log(level_json);
  return callback(xmoto_ref, level_json);
};

parse_csv_data = function (timeseries_csv) {
  var country_timeseries_map = {};
  // Iterate over the lines, ignoring the first row (column names)
  var lines = timeseries_csv.split("\n");
  // The number of days in the timeseries is the number of columns we have,
  // minus the few header columns we have.
  for (var i = 1; i < lines.length - 1; i++) {
    var line = lines[i];
    var columns = line.split(",");
    var country = convert_to_country_code(columns[1]);
    if (country === "") {
      continue; // We aren't expecting this country, so skip it.
    }
    if (!(country in country_timeseries_map)) {
      country_timeseries_map[country] = [];
      for (var j = 4; j < columns.length; j++) {
        country_timeseries_map[country].push(Math.max(0, parseInt(columns[j])));
      }
    } else {
      // Some countries have multiple rows, so append the results
      for (var j = 4; j < columns.length; j++) {
        country_timeseries_map[country][j - 4] += Math.max(
          0,
          parseFloat(columns[j])
        );
      }
    }
  }
  return country_timeseries_map;
};

convert_to_new_cases_map = function (country_confirmed_map) {
  var country_new_cases_map = {};
  for (var n = VALID_COUNTRIES.length - 1; n >= 0; n--) {
    var country = VALID_COUNTRIES[n];
    country_new_cases_map[country] = [];
    var prev = 0;
    for (var day = 0; day < country_confirmed_map[country].length; day++) {
      // New cases is the current confirmed minus the previous day's confirmed.
      var new_cases = country_confirmed_map[country][day] - prev;
      country_new_cases_map[country].push(new_cases);
      prev = country_confirmed_map[country][day];
    }
  }
  // Perform a moving average to smooth out the mountain.
  // Otherwise it would be unplayable.
  for (var country of Object.keys(country_new_cases_map)) {
    var new_cases = country_new_cases_map[country];
    var averaged_new_cases = [];
    for (var i = 1; i < new_cases.length - 2; i++) {
      var mean =
        (new_cases[i] +
          new_cases[i - 1] +
          new_cases[i + 1] +
          new_cases[i + 2]) /
        4.0;
      averaged_new_cases.push([mean]);
    }
    country_new_cases_map[country] = averaged_new_cases;
  }
  return country_new_cases_map;
};

initial_level_json = function (num_days, max_height) {
  return {
    sky: "sky",
    limits: {
      left: "-1.0",
      right: num_days * XAXIS_MULTIPLIER - 1,
      top: max_height + 2.0,
      bottom: "0.0",
    },
    blocks: [],
    entities: [
      {
        size: {
          r: "0.400000",
        },
        position: {
          x: "0.0",
          y: "1.0",
        },
        id: "MyPlayerStart0",
        typeid: "PlayerStart",
      },
      {
        size: {
          r: "0.50000",
        },
        position: {
          x: "18.0",
          y: "1.0",
        },
        id: "MyEndOfLevel0",
        typeid: "EndOfLevel",
      },
    ],
  };
};

add_block_for_country = function (level_json, country_new_cases_map, country) {
  var counry_timeseries = country_new_cases_map[country];
  var num_days = counry_timeseries.length;
  block = {
    id: country,
    position: {
      x: -1.0,
      y: 0.0,
    },
    usetexture: {
      id: country,
    },
    vertices: [
      {
        x: -1.0,
        y: 0.0,
      },
    ],
  };
  for (var day = 0; day < num_days; day++) {
    // Add a vertex based on that day's data
    block.vertices.push({
      x: (day + 1) * XAXIS_MULTIPLIER,
      y: counry_timeseries[day] * YAXIS_MULTIPLIER,
      // edge: "darken",
    });
  }
  // Add the final vertex which drops the block to the ground
  block.vertices.push({
    x: num_days * XAXIS_MULTIPLIER,
    y: 0.0,
  });
  level_json.blocks.push(block);
};

convert_to_country_code = function (country) {
  // Most countries just work, but we need to do some substitutions
  var country_code = country.toLowerCase().replace(/ /g, "-");
  if (country_code === "burma") {
    country_code = "myanmar";
  } else if (country_code === "cabo-verde") {
    country_code = "cape-verde";
  } else if (country_code.startsWith("congo")) {
    country_code = "congo-democratic-republic-of-the";
  } else if (country_code === "cote-d'ivoire") {
    country_code = "cote-d-ivoire";
  } else if (country_code === "czechia") {
    country_code = "czech-republic";
  }
  if (!VALID_COUNTRIES.includes(country_code)) {
    return "";
  } else {
    return country_code;
  }
};
