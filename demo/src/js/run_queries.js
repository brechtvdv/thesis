$(function(){
  var csvData =  [];
  var ITERATIONS = 1; // iterations per query
  var totalTime = 0;
  var totalRequests = 0;
  var totalConnections = 0;
  var totalQueries = queriesNMBS.length;
  var q = 0;

  var runQuery = function(_teller, _iteraties, _gemiddeldeTijd, _hoeveelsteQuery, _queries) {
    console.log("Benchmarking iteratie " + _teller + "/" + _iteraties);

    var optimized; // from radio button in HTML
    if ($("input[name='radioBtn']:checked").val() == "regular") {
      optimized = false;
    } else {
      optimized = true;
    }
    if (optimized) {
      planner = new window.lc.OptimizedClient({"entrypoints" : ["http://localhost:8080/"]});
    } else {
      planner = new window.lc.Client({"entrypoints" : ["http://localhost:8080/"]});
    }
    
    var countRequests = 0;
    var countTotalConnections = 0;
    var countMobConnections = 0;

    var start = new Date().getTime();
    var departureStopId = _queries[_hoeveelsteQuery].departureStop.toString();
    var arrivalStopId = _queries[_hoeveelsteQuery].arrivalStop.toString();
    console.log(departureStopId);
    console.log(arrivalStopId);

    planner.query({
      "departureStop": departureStopId, // Must be a string (URI)
      "arrivalStop": arrivalStopId,
      "departureTime": new Date("2015-12-01T07:00"),
      "arrivalStopLongitude": stops[arrivalStopId].loc.coordinates[0],
      "arrivalStopLatitude": stops[arrivalStopId].loc.coordinates[1],
      "departureStopLongitude": stops[departureStopId].loc.coordinates[0],
      "departureStopLatitude": stops[departureStopId].loc.coordinates[1]
    }, function (stream, source) {
        stream.on('result', function (path) {
          // Save result in CSV
          var end = new Date().getTime();
          var time = end - start;
          var countTime = time/1000;
          // Add to total time
          totalTime += countTime;

          var duur = ((path[path.length-1].arrivalTime.getTime() - path[0].departureTime.getTime())/60000 );
          if (countTime > 2*_gemiddeldeTijd && _gemiddeldeTijd !== 0) {
            countTime = _gemiddeldeTijd;
          }
          _gemiddeldeTijd += countTime;
          console.log(countTime);
          if (_teller == _iteraties) {
            q++;
            console.log(q);
            var result = [_queries[_hoeveelsteQuery].departureStop, _queries[_hoeveelsteQuery].arrivalStop, countTotalConnections, countMobConnections, countRequests+1, _gemiddeldeTijd/_iteraties, path.length, duur];
            csvData.push(result);
            // Volgende query
            _hoeveelsteQuery++;
            // if (_hoeveelsteQuery < _queries.length) {
            if (_hoeveelsteQuery < 30) {
              // Recursie
              _teller = 1;
              _gemiddeldeTijd = 0;
              runQuery(_teller, _iteraties, _gemiddeldeTijd, _hoeveelsteQuery, _queries);
            } else {
              console.log("Klaar met benchmarking");
              var gemiddeldeSnelheidOverQueries = totalTime/_queries.length;
              console.log("Totale tijd van queries: " + totalTime);
              console.log("Totaal aantal queries uitgevoerd: " + q);
              console.log("Gemiddelde snelheid voor " + totalQueries + " queries is: " + gemiddeldeSnelheidOverQueries);
              console.log("Totaal aantal requests: " + totalRequests);
              console.log("Totaal aantal connecties: " + totalConnections);
            }
          } else {
            // Recursie
            _teller++;
            runQuery(_teller, _iteraties, _gemiddeldeTijd, _hoeveelsteQuery, _queries);
          }
        });
        stream.on('data', function (connection) {
          countMobConnections++;
          totalConnections++;
        });
        stream.on('error', function (error) {
          // console.error(error);
        });
        source.on('request', function() {
          countRequests++;
          totalRequests++;
        });
        source.on('data', function() {
          countTotalConnections++;
        });
        stream.on('end', function() {
          // Query not resolved
          // Recursie
          totalQueries--;
          q--;
          _teller = 1;
          _gemiddeldeTijd = 0;
          runQuery(_teller, _iteraties, _gemiddeldeTijd, _hoeveelsteQuery, _queries);
        });
      });
  };

	$('#queryNMBS').on('click', function() {
    csvData = [['start_stop_id','end_stop_id','scan','mob','request','tijd','stops','duur']];
    var gemiddeldeTijd = 0;
    var query = 0; // eerste query
    var iteratie = 1;
    runQuery(iteratie, ITERATIONS, gemiddeldeTijd, query, queriesNMBS); // queriesNMBS zit in queries/queriesNMBS.js
	});

  // Download CSV
	$('#download').on('click', function() {
		csvGenerator = new CsvGenerator(csvData, 'basicCSA.csv');
    csvGenerator.download(true);
	});
});
