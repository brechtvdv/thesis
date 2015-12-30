$(function(){
  var csvData =  [];

  var q = 0;

  var runQuery = function(_hoeveelsteQuery, _queries) {
    var countRequests = 0;
    var countScanned = 0;
    var countTotalConnections = 0;
    var countMobConnections = 0;
    var countTime = 0;
    var countVertrekStoppen = 0;

    // var planner = new window.lc.Client({"entrypoints" : ["http://localhost:8080/"]});
    // var planner = new window.lc.SpeedUpClient({"entrypoints" : ["http://localhost:8080/"]});
    var planner = new window.lc.HeuristicClient({"entrypoints" : ["http://localhost:8080/"]});
    var start = new Date().getTime();

    var departureStopId = _queries[_hoeveelsteQuery].departureStop.toString();
    var arrivalStopId = _queries[_hoeveelsteQuery].arrivalStop.toString();
    console.log(departureStopId);
    console.log(arrivalStopId);

    var coordsStart = [stops[departureStopId].loc.coordinates[0], stops[departureStopId].loc.coordinates[1]];
    var coordsEnd = [stops[arrivalStopId].loc.coordinates[0], stops[arrivalStopId].loc.coordinates[1]];
    var distance = calcDistance(coordsStart, coordsEnd);
    console.log(distance);

    planner.query({
      "departureStop": departureStopId, // Must be a string (URI)
      "arrivalStop": arrivalStopId,
      "departureTime": new Date("2015-12-01T06:00")
    }, function (stream, source) {
        stream.on('result', function (path) {
          var end, time;

          end = new Date().getTime();
          time = end - start;
          countTime = time/1000;
          console.log(countTime);
          routeMinutes = ((path[path.length-1].arrivalTime.getTime() - path[0].departureTime.getTime())/60000 );
          amountOfStops = path.length;

          var result = [_queries[_hoeveelsteQuery].departureStop, _queries[_hoeveelsteQuery].arrivalStop, countTotalConnections, countScanned, countMobConnections, countRequests, countTime, amountOfStops, routeMinutes, distance];
          csvData.push(result);

          if (_hoeveelsteQuery < queriesNMBS.length) {
            // Volgende query
            _hoeveelsteQuery++;
            q++;
            console.log(q);
            // Recursie
            runQuery(_hoeveelsteQuery, _queries);
          } else {
            console.log("Klaar met benchmarking");
          }
        });
        stream.on('data', function (connection) {
          countMobConnections++;
        });
        stream.on('departureStop', function () {
          countVertrekStoppen++;
        });
        source.on('count', function (count) {
          countTotalConnections = count;
        });
        source.on('stop', function() {
          console.log("stop");
          routeMinutes = 9999;
          amountOfStops = 9999;
          var result = [_queries[_hoeveelsteQuery].departureStop, _queries[_hoeveelsteQuery].arrivalStop, countTotalConnections, countScanned, countMobConnections, countRequests, countTime, amountOfStops, routeMinutes, distance];
          csvData.push(result);
          _hoeveelsteQuery++;
          q++;
          console.log(q);
          // Recursie
          runQuery(_hoeveelsteQuery, _queries);
        });
        source.on('request', function(request) {
          countRequests++;
        });
        source.on('data', function() {
          countScanned++;
        });
        source.on('error', function () {
          console.log("query not found");
          // Recursie
          _hoeveelsteQuery++;
          runQuery(_hoeveelsteQuery, _queries);
        });
      });
  };

  function calcDistance(coords1, coords2) {
    function toRad(x) {
      return x * Math.PI / 180;
    }

    var lon1 = coords1[0];
    var lat1 = coords1[1];

    var lon2 = coords2[0];
    var lat2 = coords2[1];

    var R = 6371; // km

    var x1 = lat2 - lat1;
    var dLat = toRad(x1);
    var x2 = lon2 - lon1;
    var dLon = toRad(x2);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;

    return d;
  }

	$('#queryNMBS').on('click', function() {
    csvData = [['start_stop_id','end_stop_id','count','scan','mob','request','tijd','stops','routeduur', 'afstand']];
    runQuery(0, queriesNMBS); // queriesNMBS zit in queries/queriesNMBS.js
	});

  // Download CSV
	$('#download').on('click', function() {
		csvGenerator = new CsvGenerator(csvData, 'basicCSA.csv');
    csvGenerator.download(true);
	});
});
