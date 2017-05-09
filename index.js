var prompt = require('prompt');
var request = require('request');

prompt.message = "";
prompt.start();
prompt.get({
  properties: {
    username: { required: true },
    password: { required: true, hidden: true },
    days:     { required: true, default: 30, type: 'integer' }
  },
}, function(err, res) {
  if ( err ) {
    console.log(err);
    process.exit(1);
  }

  fetch(res);
});

function fetch(opt) {
  request('https://telemetry.rancher.io/admin/history/value/install.version?days='+encodeURIComponent(opt.days), {
    'auth': {
      user: opt.username,
      pass: opt.password,
      sendImmediately: true
    }
  }, function(err, res, body) {
    if ( err ) {
      console.log(err);
      process.exit(1);
    }

    json = JSON.parse(body);
    process(json);
  });
}

function process(data) {
  let headers = [];
  let maps = {};

  Object.keys(data).forEach((date) => {
    let versions = data[date];
    let row = {
      date: date
    };

    Object.keys(versions).forEach((version) => {
      if ( version.indexOf('-rc') >= 0 || (version.substr(0,1) !== 'v' && version !== 'unknown') ) {
        return;
      }

      let key = version;
      var match = version.match(/^(v\d+\.\d+)/);
      if ( match ) {
        key = match[1];
      }

      row[key] = (row[key]||0) + versions[version];
      if ( !headers.includes(key) ) {
        headers.push(key);
      }
    });

    maps[date] = row;
  });

  headers = headers.sort();
  headers.unshift('date');

  console.log(headers.join(","));
  Object.keys(maps).forEach((date) => {
    let map = maps[date];
    let out = [];
    headers.forEach((header) => {
      out.push(map[header]||0);
    });

    console.log(out.join(","));
  });
}
