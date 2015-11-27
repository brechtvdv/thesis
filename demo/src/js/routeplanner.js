$(function(){
	// Activate dropdownlists
  $('.chosen-select').chosen();
  $('.chosen-select-deselect').chosen({ allow_single_deselect: true });

	var map = L.map('map').setView([50.893, 5.702], 7);
	var mapMarkers = [];
	var mapLines = [];

	// L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
	//     attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	// }).addTo(map);
	L.tileLayer('http://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

	var handleClick = function (departureStopId, arrivalStopId) {
		var start = new Date().getTime();

		var countRequests = 0;
		var countTotalConnections = 0;
		var countMobConnections = 0;
		$('.amounttime').text("0");

   	var planner = new window.lc.Client({"entrypoints" : ["http://belgianrail.linkedconnections.org/"]});

		planner.query({
			"departureStop": departureStopId.toString(), // Must be a string (URI)
			"arrivalStop": arrivalStopId.toString(),
			"departureTime": new Date("2015-10-05T10:00")
			}, function (stream) {
				stream.on('result', function (path) {
          var currentTrip = path[0]['gtfs:trip']['@id'];
          $('.resulttable').find('tbody:last').append('<tr><th scope="row">'+'Vertrekdatum: '+path[0].departureTime.getFullYear()+'-'+(path[0].departureTime.getMonth()+1).toString()+'-'+path[0].departureTime.getDate()+'</th></tr>');          
          $.each(path, function(key, value) {
            if (value['gtfs:trip']['@id'] != currentTrip) {
          		$('.resulttable').find('tbody:last').append('<tr style="color: blue;"><th scope="row" class="list-group-item-info">'+'OVERSTAP'+'</th></tr>');          
              currentTrip = value['gtfs:trip']['@id'];
            }
            if (stops[value.departureStop] && stops[value.arrivalStop]) {
              $('.resulttable').find('tbody:last').append('<tr><th scope="row">'+stops[value.departureStop].stop_name+'</th><td>'+('0'+value.departureTime.getHours()).slice(-2)+':'+('0'+value.departureTime.getMinutes()).slice(-2)+'</td><td>'+stops[value.arrivalStop].stop_name+'</td><td>'+('0'+value.arrivalTime.getHours()).slice(-2)+':'+('0'+value.arrivalTime.getMinutes()).slice(-2)+'</td></tr>');          
            } else if (stops[value.departureStop]) {
              $('.resulttable').find('tbody:last').append('<tr><th scope="row">'+stops[value.departureStop].stop_name+'</th><td>'+('0'+value.departureTime.getHours()).slice(-2)+':'+('0'+value.departureTime.getMinutes()).slice(-2)+'</td><td>'+value.arrivalStop+'</td><td>'+('0'+value.arrivalTime.getHours()).slice(-2)+':'+('0'+value.arrivalTime.getMinutes()).slice(-2)+'</td></tr>');          
            } else if (stops[value.arrivalStop]) {
              $('.resulttable').find('tbody:last').append('<tr><th scope="row">'+value.departureStop+'</th><td>'+('0'+value.departureTime.getHours()).slice(-2)+':'+('0'+value.departureTime.getMinutes()).slice(-2)+'</td><td>'+stops[value.arrivalStop].stop_name+'</td><td>'+('0'+value.arrivalTime.getHours()).slice(-2)+':'+('0'+value.arrivalTime.getMinutes()).slice(-2)+'</td></tr>');          
            } else {
              $('.resulttable').find('tbody:last').append('<tr><th scope="row">'+value.departureStop+'</th><td>'+('0'+value.departureTime.getHours()).slice(-2)+':'+('0'+value.departureTime.getMinutes()).slice(-2)+'</td><td>'+value.arrivalStop+'</td><td>'+('0'+value.arrivalTime.getHours()).slice(-2)+':'+('0'+value.arrivalTime.getMinutes()).slice(-2)+'</td></tr>');          
            }
          });
				});
			 	stream.on('data', function (connection) {
			 		countMobConnections++;
			 		$('.mobconnections').text(countMobConnections);

			 		var arrStop = stops[connection.arrivalStop];
			 		var depStop = stops[connection.departureStop];
			 		if (typeof arrStop !== 'undefined' && typeof depStop !== 'undefined') {
				 		var pointDep = new L.LatLng(depStop.loc.coordinates[1], depStop.loc.coordinates[0]);
				 		var pointArr = new L.LatLng(arrStop.loc.coordinates[1], arrStop.loc.coordinates[0]);
		        var polyline = new L.Polyline([pointDep, pointArr], {
		          color: '#3b6790',
		          weight: 6,
		          smoothFactor: 4
		        });
						mapLines.push(polyline);
						polyline.addTo(map);
			    }
			 	});
			 	stream.on('error', function (error) {
		      console.error(error);
		    });
		    stream.on('request', function() {
		    	countRequests++;
		    	$('.amountrequests').text(countRequests);
		    });
		    stream.on('scan', function() {
		    	countTotalConnections++;
	    		$('.totalamountconnections').text(countTotalConnections);
	    		// Update time
			 		var end = new Date().getTime();
					var time = end - start;
					$('.amounttime').text(time/1000); // Seconds
		    });
		    stream.on('end', function () {
    			var end = new Date().getTime();
					var time = end - start;
					$('.amounttime').text(time/1000); // Seconds
      		console.log('end of stream');
		    });
			});
		};

	var cleanMap = function() {
		for(var i = 0; i < mapMarkers.length; i++){
    	map.removeLayer(mapMarkers[i]);
		}
		for(var j = 0; j < mapLines.length; j++){
    	map.removeLayer(mapLines[j]);
		}

		mapMarkers = [];
		mapLines = [];
	};

	var cleanTable = function() {
		$('.resulttable tbody tr').remove();
	};

	$("#zoek").on("click", function () {
		cleanMap();

		cleanTable();

		var departureStopId = $('.stopvan option:selected').val();
		var arrivalStopId = $('.stopnaar option:selected').val();

		if (departureStopId === "") {
			departureStopId = "8400526"; // Default: ROOSENDAAL
		}
		if (arrivalStopId === "") {
			arrivalStopId = "8892007"; // Default: GENT-SINT-PIETERS
		}
		var departureStop = stops[departureStopId];
		var arrivalStop = stops[arrivalStopId];

		var markerGeoJSON = new L.geoJson(departureStop.loc);
		mapMarkers.push(markerGeoJSON);
		markerGeoJSON.addTo(map)
		.bindPopup("Stop ID: " + departureStopId + "\nName: " + departureStop.stop_name + "\nLatitude: " + departureStop.loc.coordinates[0] + "\nLongitude: " + departureStop.loc.coordinates[1]);

		markerGeoJSON = L.geoJson(arrivalStop.loc);
  	mapMarkers.push(markerGeoJSON);
		markerGeoJSON.addTo(map)
		.bindPopup("Stop ID: " + arrivalStopId + "\nName: " + arrivalStop.stop_name + "\nLatitude: " + arrivalStop.loc.coordinates[0] + "\nLongitude: " + arrivalStop.loc.coordinates[1]);

		var departureConnectionStopId = departureStop.connection_stop_id;
		var arrivalConnectionStopId = arrivalStop.connection_stop_id;

  	handleClick(departureConnectionStopId, arrivalConnectionStopId);
	});
	
});
