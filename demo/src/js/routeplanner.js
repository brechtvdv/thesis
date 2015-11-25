$(function(){
	// Activate dropdownlists
  $('.chosen-select').chosen();
  $('.chosen-select-deselect').chosen({ allow_single_deselect: true });

	var map = L.map('map').setView([50.893, 5.702], 7);
	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
	    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(map);
	// L.tileLayer('http://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png', {
 //    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
 //  }).addTo(map);

	var planner = new window.lc.Client({"entrypoints" : ["http://belgianrail.linkedconnections.org/"]});

	var handleClick = function (departureStopId, arrivalStopId) {
		console.dir(departureStopId);
		console.dir(arrivalStopId);
		var start = new Date().getTime();

		var countRequests = 0;
		var countTotalConnections = 0;
		var countMobConnections = 0;
		$('.amounttime').text("0");
    
		planner.query({
			"departureStop": departureStopId,
			"arrivalStop": arrivalStopId,
			"departureTime": new Date("2015-10-05T10:00")
			}, function (stream) {
				stream.on('result', function (path) {
					console.dir(path);
          alert("STOOOOP");
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
				        }).addTo(map);
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

	$("#zoek").on("click", function () {
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

		L.geoJson(departureStop.loc).addTo(map)
		.bindPopup("Stop ID: " + departureStopId + "\nName: " + departureStop.stop_name + "\nLatitude: " + departureStop.loc.coordinates[0] + "\nLongitude: " + departureStop.loc.coordinates[1]);

		L.geoJson(arrivalStop.loc).addTo(map)
		.bindPopup("Stop ID: " + arrivalStopId + "\nName: " + arrivalStop.stop_name + "\nLatitude: " + arrivalStop.loc.coordinates[0] + "\nLongitude: " + arrivalStop.loc.coordinates[1]);
  	
		var departureConnectionStopId = departureStop.connection_stop_id;
		var arrivalConnectionStopId = arrivalStop.connection_stop_id;

  	handleClick(departureConnectionStopId, arrivalConnectionStopId);
	});

	
});
