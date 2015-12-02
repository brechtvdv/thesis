$(function(){
  var csvData =  [];
  var ITERATIONS = 1; // iterations per query

  var runQuery = function(_teller, _iteraties, _gemiddeldeTijd, _hoeveelsteQuery, _queries) {
    console.log("Benchmarking iteratie " + _teller + "/" + _iteraties);

    var planner = new window.lc.Client({"entrypoints" : ["http://belgianrail.linkedconnections.org/"]});
    var countRequests = 0;
    var countTotalConnections = 0;
    var countMobConnections = 0;

    var start = new Date().getTime();

    planner.query({
      "departureStop": _queries[_hoeveelsteQuery].departureStop.toString(), // Must be a string (URI)
      "arrivalStop": _queries[_hoeveelsteQuery].arrivalStop.toString(),
      "departureTime": new Date(_queries[_hoeveelsteQuery].departureTime)
      }, function (stream) {
        stream.on('result', function (path) {
          // Save result in CSV
          var end = new Date().getTime();
          var time = end - start;
          var countTime = time/1000;
          var duur = ((path[path.length-1].arrivalTime.getTime() - path[0].departureTime.getTime())/60000 );
          if (countTime > 2*_gemiddeldeTijd && _gemiddeldeTijd !== 0) {
            countTime = _gemiddeldeTijd;
          }
          _gemiddeldeTijd += countTime;
          console.log(countTime);
          if (_teller == _iteraties) {
            var result = [_queries[_hoeveelsteQuery].departureStop, _queries[_hoeveelsteQuery].arrivalStop, countTotalConnections, countMobConnections, countRequests+1, _gemiddeldeTijd/_iteraties, path.length, duur];
            csvData.push(result);
            // Volgende query
            _hoeveelsteQuery++;
            if (_hoeveelsteQuery < _queries.length) {
              // Recursie
              _teller = 1;
              _gemiddeldeTijd = 0;
              runQuery(_teller, _iteraties, _gemiddeldeTijd, _hoeveelsteQuery, _queries);
            } else {
              console.log("Klaar met benchmarking");
            }
          } else {
            // Recursie
            _teller++;
            runQuery(_teller, _iteraties, _gemiddeldeTijd, _hoeveelsteQuery, _queries);
          }
        });
        stream.on('data', function (connection) {
          countMobConnections++;
        });
        stream.on('error', function (error) {
          // console.error(error);
        });
        stream.on('request', function() {
          countRequests++;
        });
        stream.on('scan', function() {
          countTotalConnections++;
        });
        stream.on('end', function() {
          // console.error("end");
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
