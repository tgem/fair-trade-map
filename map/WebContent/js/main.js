var map;    
var bounds;
var infoWindow;

// creates the map once map script from Google is loaded
function initializeMap() {

  var mapOptions = {
    center: {lat: 54.133553712309435, lng: 12.050403683870421},
    zoom: 11
  };  

  map = new google.maps.Map(document.querySelector('#map'), mapOptions);
  
  // only query for locations once map has been initialized
  $.ajax({url: "https://geo.sv.rostock.de/download/opendata/fair-trade/fair-trade.json", success: locationsLoaded, error:noLocationsAvailable});
 
}

window.addEventListener('load', initializeMap);

// on successful call to OpenData api, add loaded locations to list
function locationsLoaded(result) {
    addLocations(result.features);
}

// on unsuccessfull call to OpenData api, add default locations to list and display warning
function noLocationsAvailable(result) {
	defaultLocations = {
			"type": "FeatureCollection",
			"features": [
			{ "type": "Feature", "properties": { "strasse_name": "Kopenhagener Str.", "hausnummer": "3", "bezeichnung": "Erasmus-Gymnasium", "website": "http:\/\/www.erasmus-ganztagsgymnasium.de\/" }, "geometry": { "type": "Point", "coordinates": [ 12.050403683870421, 54.133553712309435 ] } },
			{ "type": "Feature", "properties": { "strasse_name": "Am Kabutzenhof", "hausnummer": "20", "bezeichnung": "Volkshochschule", "website": "http:\/\/www.vhs-hro.de\/index.php" }, "geometry": { "type": "Point", "coordinates": [ 12.113237982237299, 54.093489226767893 ] } },
			{ "type": "Feature", "properties": { "strasse_name": "Albert-Einstein-Str.", "hausnummer": "6", "bezeichnung": "Mensa Sued - Mensa", "website": "https:\/\/www.stw-rw.de\/de\/mensen-und-cafeterien.html" }, "geometry": { "type": "Point", "coordinates": [ 12.105008556462877, 54.076037774654552 ] } },
			{ "type": "Feature", "properties": { "strasse_name": "Albert-Einstein-Str.", "hausnummer": "6", "bezeichnung": "Mensa Sued - Cafe Treff", "website": "https:\/\/www.stw-rw.de\/de\/mensen-und-cafeterien.html" }, "geometry": { "type": "Point", "coordinates": [ 12.104734715885874, 54.075698533669609 ] } },
			{ "type": "Feature", "properties": { "strasse_name": "Ulmenstr.", "hausnummer": "69", "bezeichnung": "Mensa Ulme 69", "website": "http:\/\/www.studentenwerk-rostock.de\/index.php?lang=de&mainmenue=4&submenue=49&type=details&detail=8" }, "geometry": { "type": "Point", "coordinates": [ 12.10960076040195, 54.086595455613711 ] } }
			]};
	addLocations(defaultLocations.features);
	alert("We have been unable to load data from the open data portal of the city of Rostock. Therefore, our list of locations may be incomplete or outdated. Please consider reloading the page at a later time.");
}

// event handler function for click on marker
function markerClicked(marker, loc, i) {
	viewModel.selectedId(i);
	selectMarker(marker, loc);
}

// helper function to realize closure
function returnMarkerClickListener(marker, locInfo, i) {
	return function() {
		markerClicked(this, locInfo, i);
	}
}

// function to add a single location to the list
function addLocation(loc,i) {	
	// OpenHRO API provides latitude/longitude in wrong order
	loc.position = {};
	loc.position['lat'] = loc.geometry.coordinates[1];
	loc.position['lng'] = loc.geometry.coordinates[0];
	
    var marker = new google.maps.Marker({
        map: map,
        position: loc.position,
        title: loc.properties.bezeichnung,
        visible: true
      });
    
    locInfo = {
    		description: loc.properties.bezeichnung,
    		street: loc.properties.strasse_name,
    		number: loc.properties.hausnummer,
    		website: loc.properties.website,
    		i: i,
    		marker: marker,
    		filtered: false
    	};
    
    marker.addListener('click', returnMarkerClickListener(this, locInfo, i));
    
	bounds.extend(loc.position);
	
	viewModel.locations.push(locInfo);
}

// function to add mupltiple locations to the list
function addLocations(locs) {
	viewModel.locations.removeAll();	
    bounds = new google.maps.LatLngBounds();
    var i = 0;

    for(var id in locs) {
    	var loc = locs[id];
    	addLocation(loc,i);
    	i = i+1;
    }
    
    map.fitBounds(bounds);

	$("#filter").keyup(function(event) {
	    if (event.keyCode === 13) {
	       filter($("#filter").val());
	    }
	});

}

// function for selecting a marker
// called both from handling a click on the marker and from handling a click on the respective list entry 
function selectMarker(marker, loc) {
	marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function(){ marker.setAnimation(null); }, 750);
    if(infoWindow!=null)
    	infoWindow.close();
    var content = "<div><h4>" + loc.description + "</h4>" + "<div>" + loc.street + " " + loc.number + "</div>";
    if((loc.website!=null) && (loc.website!=undefined)) {
        content = content + '<div><a href="' + loc.website + '" target="_blank">Visit website</a></div>';    	
    }
    content = content + "</div>";
    infoWindow = new google.maps.InfoWindow({
        content: content
      });
    infoWindow.open(map,marker);
}

// event handler for clicking on a list entry
function selectListEntry(location) {
	viewModel.selectedId(location.i);
	selectMarker(location.marker, location);
}

// event handler for a confirmed change in the filter string
function filter(filterstring) {
	filterstring = filterstring.toLowerCase();
	var i, loc, newLoc;
	for(i=0;i<viewModel.locations().length;i++) {
		loc = viewModel.locations()[i];
		newLoc = {
		    		description: loc.description,
		    		street: loc.street,
		    		number: loc.number,
		    		website: loc.website,
		    		i: loc.i,
		    		marker: loc.marker,
		    		filtered: loc.filtered
		};
		if((filterstring==null) || (filterstring=="") || (loc.description.toLowerCase().includes(filterstring))) {
			newLoc.filtered = false;
		}
		else {
			newLoc.filtered = true;
			if(viewModel.selectedId()==loc.i) {
				viewModel.selectedId(-1);
				if(infoWindow!=null)
					infoWindow.close();
			}
		}
		if(loc.filtered!=newLoc.filtered) {
			viewModel.locations.replace(loc, newLoc);
			if(newLoc.filtered) {
				newLoc.marker.setMap(null);
			}	
			else {
				newLoc.marker.setMap(map);
			}
		}
	}
}

// initialize view model
var viewModel = {
	    selectedId: ko.observable(-1),
	    locations: ko.observableArray(),
	    selectListEntry: selectListEntry
	};

ko.applyBindings(viewModel);


