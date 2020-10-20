CONFIRMED_URL =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv";
XAXIS_MULTIPLIER = 0.7;
YAXIS_MULTIPLIER = 0.00025;

COIN_X_INTERVAL = 60.0;

FIRST_DATA_DATE = "1/22/20";

load_covid_level = function (xmoto_ref, callback) {
  return $.get(CONFIRMED_URL, function (confirmed_csv) {
    return load_covid_level_helper(confirmed_csv, xmoto_ref, callback);
  });
};

load_covid_level_helper = function (confirmed_csv, xmoto_ref, callback) {
  var country_confirmed_map = parse_csv_data(confirmed_csv);
  var new_cases_data = convert_to_new_cases_map(country_confirmed_map);
  var country_new_cases_map = new_cases_data[0];
  var day_max = new_cases_data[1];
  var level_json = initial_level_json(day_max);

  for (var n = 0; n < VALID_COUNTRIES.length; n++) {
    var country = VALID_COUNTRIES[n];
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
        country_timeseries_map[country].push(0);
      }
    }
    // Append the results
    for (var j = 4; j < columns.length; j++) {
      var day_val = Math.max(0, parseFloat(columns[j]));
      country_timeseries_map[country][j - 4] += day_val;
    }
  }
  return country_timeseries_map;
};

convert_to_new_cases_map = function (country_confirmed_map) {
  var country_new_cases_map = {};
  for (var country of Object.keys(country_confirmed_map)) {
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
  var days_max = new Array(
    country_new_cases_map[Object.keys(country_new_cases_map)[0]].length
  ).fill(0);
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
      averaged_new_cases.push(mean);
      // Update the day_max if necessary
      days_max[i] = Math.max(days_max[i], mean);
    }
    // Add the remaining cases
    for (var i = new_cases.length - 2; i < new_cases.length; i++) {
      if (new_cases[i] > 0) {
        averaged_new_cases.push(new_cases[i]);
        // Update the day_max if necessary
        days_max[i] = Math.max(days_max[i], new_cases[i]);
      }
    }
    country_new_cases_map[country] = averaged_new_cases;
  }
  return [country_new_cases_map, days_max];
};

initial_level_json = function (day_max) {
  var num_days = day_max.length;
  // Determine the highest point so we can set our top bound
  // also determine our largest final point so we can set our Finish
  var max_height = Math.max.apply(null, day_max);
  var max_last_day = day_max[day_max.length - 1];
  level_json = {
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
          x: "17.0",
          y: "1.5",
        },
        id: "Outbreak",
        typeid: "Wrecker",
      },
      {
        size: {
          r: "0.50000",
        },
        position: {
          x: "56.0",
          y: "9.0",
        },
        id: "Wave1",
        typeid: "Wrecker",
      },
      {
        size: {
          r: "0.50000",
        },
        position: {
          x: "169.1",
          y: "21.7",
        },
        id: "Wave2",
        typeid: "Wrecker",
      },
      {
        size: {
          r: "0.50000",
        },
        position: {
          x: num_days * XAXIS_MULTIPLIER - 2,
          y: max_last_day * YAXIS_MULTIPLIER + 2.5,
        },
        id: "Finish",
        typeid: "Finish",
      },
    ],
  };
  for (
    var i = COIN_X_INTERVAL;
    i < num_days - COIN_X_INTERVAL;
    i += COIN_X_INTERVAL
  ) {
    level_json.entities.push({
      size: {
        r: "0.50000",
      },
      position: {
        x: i * XAXIS_MULTIPLIER,
        y: day_max[i] * YAXIS_MULTIPLIER + 2.0,
      },
      id: "Coin" + i,
      typeid: "Coin",
    });
  }
  return level_json;
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
    var y_val = counry_timeseries[day] * YAXIS_MULTIPLIER;
    // Do some _slight_ modifications where it gets too hard.
    if (country === "india" && day === 213) {
      y_val += 1;
    }
    // Add a vertex based on that day's data
    block.vertices.push({
      x: (day + 1) * XAXIS_MULTIPLIER,
      y: y_val,
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
