


var map, mapleft, mapright, markers, marker, icon;

var mapleftLayers;
var maprightLayers;

var mousepositionleft;
var mousepositionright;

// The parameters for the British National Grid - EPSG:27700

 proj4.defs("EPSG:27700", "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs");




// From http://www.movable-type.co.uk/scripts/latlong-gridref.html NT261732
    function gridrefNumToLet(e, n, digits) {
        // get the 100km-grid indices
        var e100k = Math.floor(e / 100000),
        n100k = Math.floor(n / 100000);

        if (e100k < 0 || e100k > 6 || n100k < 0 || n100k > 12) return '';

        // translate those into numeric equivalents of the grid letters
        var l1 = (19 - n100k) - (19 - n100k) % 5 + Math.floor((e100k + 10) / 5);
        var l2 = (19 - n100k) * 5 % 25 + e100k % 5;

        // compensate for skipped 'I' and build grid letter-pairs
        if (l1 > 7) l1++;
        if (l2 > 7) l2++;
        var letPair = String.fromCharCode(l1 + 'A'.charCodeAt(0), l2 + 'A'.charCodeAt(0));

        // strip 100km-grid indices from easting & northing, and reduce precision
        e = Math.floor((e % 100000) / Math.pow(10, 5 - digits / 2));
        n = Math.floor((n % 100000) / Math.pow(10, 5 - digits / 2));

        Number.prototype.padLZ = function(w) {
            var n = this.toString();
            while (n.length < w) n = '0' + n;
            return n;
        }

        var gridRef = letPair + e.padLZ(digits / 2) + n.padLZ(digits / 2);

        return gridRef;
    }
	function gridrefLetToNum(gridref) {
	  // get numeric values of letter references, mapping A->0, B->1, C->2, etc:
	  var l1 = gridref.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
	  var l2 = gridref.toUpperCase().charCodeAt(1) - 'A'.charCodeAt(0);
	  // shuffle down letters after 'I' since 'I' is not used in grid:
	  if (l1 > 7) l1--;
	  if (l2 > 7) l2--;

	  // convert grid letters into 100km-square indexes from false origin (grid square SV):
	  var e = ((l1-2)%5)*5 + (l2%5);
	  var n = (19-Math.floor(l1/5)*5) - Math.floor(l2/5);

	  // skip grid letters to get numeric part of ref, stripping any spaces:
	  gridref = gridref.slice(2).replace(/ /g,'');

	  // append numeric part of references to grid index:
	  e += gridref.slice(0, gridref.length/2);
	  n += gridref.slice(gridref.length/2);

	  // normalise to 1m grid, rounding up to centre of grid square:
	  switch (gridref.length) {
		case 2: e += '5000'; n += '5000'; break;
	    case 4: e += '500'; n += '500'; break;
	    case 6: e += '50'; n += '50'; break;
	    case 8: e += '5'; n += '5'; break;
	    // 10-digit refs are already 1m
	  }

	  return [e, n];
	}



// a generic attribution variable for NLS historic map tilesets
	
	var NLS_attribution = new ol.Attribution({
	  html: 'Historic Map Layer courtesy of the <a href="http://maps.nls.uk/">National Library of Scotland</a>' 
	});

// NLS historic map overlay layers

    var oneinch2nd = new ol.layer.Tile({
	title: "Great Britain - OS One Inch, 1885-1900",
	source: new ol.source.XYZ({
				url: "http://geo.nls.uk/maps/os/1inch_2nd_ed/{z}/{x}/{-y}.png",
				attributions: [NLS_attribution],
				minZoom: 3,
		              	maxZoom: 15
		  }),
        type: 'overlay', 
        visible: false
    });

    var bartgreatbritain = new ol.layer.Tile({
	title: "Great Britain  - Bartholomew Half Inch, 1897-1907",
	source: new ol.source.XYZ({
				url: "http://geo.nls.uk/mapdata2/bartholomew/great_britain/{z}/{x}/{-y}.png",
				attributions: [NLS_attribution],
				minZoom: 3,
				maxZoom: 15
		  }),
        type: 'overlay', 
        visible: false
    });

     var quarterinchscotland = new ol.layer.Tile({
	title: "Scotland - OS Quarter Inch, 1921-1923",
	source: new ol.source.XYZ({
				url: "http://geo.nls.uk/maps/os/quarter/{z}/{x}/{-y}.png",
				attributions: [NLS_attribution],
				minZoom: 4,
				maxZoom: 12
		  }),
        type: 'overlay', 
	visible: false
    });


	mapleftLayers = [oneinch2nd, bartgreatbritain, quarterinchscotland];

	oneinch2nd.setVisible(true);

// sets up the left-hand map layers as a drop-down list

	var layerSelectLeft = document.getElementById('SelectLeft');
	   for (var x = 0; x < mapleftLayers.length; x++) {
	       var option = document.createElement('option');
	       option.appendChild(document.createTextNode(mapleftLayers[x].get('title')));
	       option.setAttribute('value', x);
	       option.setAttribute('id', 'baseOption' + mapleftLayers[x].get('title'));
	       layerSelectLeft.appendChild(option);
	   }

// Change left-hand map layer

	var changemapleft = function(index) {
	  mapleft.getLayers().getArray()[0].setVisible(false);
	  mapleft.getLayers().removeAt(0);
	  mapleft.getLayers().insertAt(0,mapleftLayers[index]);
	  mapleft.getLayers().getArray()[0].setVisible(true);
	}

	// OpenStreetMap
	var osm = new ol.layer.Tile({
	        title: 'OpenStreetMap',
	  	source: new ol.source.OSM({
	    		// attributions: [ol.source.OSM.DATA_ATTRIBUTION],
	    	url: 'http://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'
	  		})
	});

// Bing API key - please generate your own

var BingapiKey = "AgS4SIQqnI-GRV-wKAQLwnRJVcCXvDKiOzf9I1QpUQfFcnuV82wf1Aw6uw5GJPRz";
      
	var BingSatellite =   new ol.layer.Tile({
		title: 'Bing Satellite',
	        source: new ol.source.BingMaps({
			key: BingapiKey,
			imagerySet: 'Aerial'
		    })
	});

	var BingRoad = new ol.layer.Tile({
	         title: 'Bing Road',
	         source: new ol.source.BingMaps({
		      key: BingapiKey,
		      imagerySet: 'Road'
		    })
	});

	var BingAerialWithLabels = new ol.layer.Tile({
	          title: 'Bing Hybrid',
	          source: new ol.source.BingMaps({
			key: BingapiKey,
			imagerySet: 'AerialWithLabels'
		})
	});

	var StamenWatercolor =  new ol.layer.Tile({
	           title: 'Stamen Water color',
	           source: new ol.source.Stamen({
	                  layer: 'watercolor'
	           })
	});

	var stamenterrain = new ol.layer.Tile({
	title: 'Stamen Terrain',
	       source: new ol.source.Stamen({
	       layer: 'terrain'
	     })
	   });

// an array of the world layers listed above

	var maprightLayers = [ BingAerialWithLabels, BingSatellite, BingRoad, osm, StamenWatercolor, stamenterrain ];

// sets up the right-hand map layers as a drop-down list

	var layerSelectRight = document.getElementById('SelectRight');
	   for (var x = 0; x < maprightLayers.length; x++) {
	       var option = document.createElement('option');
	       option.appendChild(document.createTextNode(maprightLayers[x].get('title')));
	       option.setAttribute('value', x);
	       option.setAttribute('id', 'baseOption' + maprightLayers[x].get('title'));
	       layerSelectRight.appendChild(option);
	   }

// Change right-hand map layer

	var changemapright = function(index) {
	  mapright.getLayers().removeAt(0);
	  mapright.getLayers().insertAt(0,maprightLayers[index]);
	}

// the main ol left-hand map class, with the OS one-inch layer and defaulting to a specific view

	var mapleft = new ol.Map({
		  target: 'mapleft',
		  renderer: 'canvas',
		  controls: ol.control.defaults().extend([ new ol.control.ScaleLine({ units:'metric' }) ]),
		  layers: [oneinch2nd],
		  logo: false,
		  view: new ol.View({
		    center: ol.proj.transform([-4.0, 56.0], 'EPSG:4326', 'EPSG:3857'),
		    zoom: 5
		  })
	});


       var mouseposition = new ol.control.MousePosition({
            projection: 'EPSG:4326',
            coordinateFormat: function(coordinate) {
	    // BNG: ol.extent.applyTransform([x, y], ol.proj.getTransform("EPSG:4326", "EPSG:27700"), 
		var coord27700 = ol.proj.transform(coordinate, 'EPSG:4326', 'EPSG:27700');
		var templatex = '{x}';
		var outx = ol.coordinate.format(coord27700, templatex, 0);
		var templatey = '{y}';
		var outy = ol.coordinate.format(coord27700, templatey, 0);
		NGR = gridrefNumToLet(outx, outy, 6);
		var hdms = ol.coordinate.toStringHDMS(coordinate);
		if ((outx  < 0) || (outx > 700000 ) || (outy < 0) || (outy > 1300000 )) {
	        return '<strong>' + ol.coordinate.format(coordinate, '{x}, {y}', 4) + '&nbsp; <br/>&nbsp;' + hdms + ' &nbsp;'; 
		}
		else 
                { return '<strong>' + NGR + '</strong>&nbsp; <br/>' + ol.coordinate.format(coord27700, '{x}, {y}', 0) + 
			'&nbsp; <br/>' + ol.coordinate.format(coordinate, '{y}, {x}', 4) + '&nbsp; <br/>&nbsp;' + hdms + ' &nbsp;'; }
            	}
    });

    mapleft.addControl(mouseposition);


// the main ol right-hand map class, with Bing Hybrid layer and defaulting to the mapleft view

	var mapright = new ol.Map({
		  target: 'mapright',
		  renderer: 'canvas',
		  controls: ol.control.defaults().extend([ new ol.control.ScaleLine({ units:'metric' }) ]),
		  layers: [BingAerialWithLabels],
		  logo: false,
		  view: mapleft.getView()
	});


    var mousepositionright = new ol.control.MousePosition({
            projection: 'EPSG:4326',
            coordinateFormat: function(coordinate) {
	    // BNG: ol.extent.applyTransform([x, y], ol.proj.getTransform("EPSG:4326", "EPSG:27700"), 
		var coord27700 = ol.proj.transform(coordinate, 'EPSG:4326', 'EPSG:27700');
		var templatex = '{x}';
		var outx = ol.coordinate.format(coord27700, templatex, 0);
		var templatey = '{y}';
		var outy = ol.coordinate.format(coord27700, templatey, 0);
		NGR = gridrefNumToLet(outx, outy, 6);
		var hdms = ol.coordinate.toStringHDMS(coordinate);
		if ((outx  < 0) || (outx > 700000 ) || (outy < 0) || (outy > 1300000 )) {
	        return '<strong>' + ol.coordinate.format(coordinate, '{x}, {y}', 4) + '&nbsp; <br/>&nbsp;' + hdms + ' &nbsp;'; 
		}
		else 
                { return '<strong>' + NGR + '</strong>&nbsp; <br/>' + ol.coordinate.format(coord27700, '{x}, {y}', 0) + 
			'&nbsp; <br/>' + ol.coordinate.format(coordinate, '{y}, {x}', 4) + '&nbsp; <br/>&nbsp;' + hdms + ' &nbsp;'; }
            	}
    });

    mapright.addControl(mousepositionright);

// sets up a cross as a feature, places it in a vector layer, and adds the vector layer to the left-hand map

	var iconFeature = new ol.Feature();
		
		var iconStyle = new ol.style.Style({
		  image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
		    anchor: [10, 10],
		    anchorXUnits: 'pixels',
		    anchorYUnits: 'pixels',
		    src: 'http://maps.nls.uk/geo/img/cross.png'
		  }))
		});
		
	
		iconFeature.setStyle(iconStyle);
	
		var vectorSource = new ol.source.Vector({
		  features: [iconFeature]
		});
		
		var vectorLayerMouseCross = new ol.layer.Vector({
		  source: vectorSource,
		  title: 'vectorMouseCross'
		});
	
	
		var mapleftlayerlength = mapleft.getLayers().getLength();
	    	mapleft.getLayers().insertAt(mapleftlayerlength,vectorLayerMouseCross);


// sets up a cross as a feature, places it in a vector layer, and adds the vector layer to the right-hand map

		var RiconFeature = new ol.Feature();
		
		var iconStyle = new ol.style.Style({
		  image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
		    anchor: [10, 10],
		    anchorXUnits: 'pixels',
		    anchorYUnits: 'pixels',
		    src: 'http://maps.nls.uk/geo/img/cross.png'
		  }))
		});
		
	
		RiconFeature.setStyle(iconStyle);
	
		var RvectorSource = new ol.source.Vector({
		  features: [RiconFeature]
		});
		
		var RvectorLayerMouseCross = new ol.layer.Vector({
		  source: RvectorSource,
		  title: 'RvectorMouseCross'
		});
	
		mapleft.addOverlay(vectorLayerMouseCross);
	
		var maprightlayerlength = mapright.getLayers().getLength();
	    	mapright.getLayers().insertAt(maprightlayerlength,RvectorLayerMouseCross);

// event handler to display cross position based on pointer location

 	mapright.on('pointermove', function(event) {

		RiconFeature.setGeometry(null);
                var coord3857 = event.coordinate;
		iconFeature.setGeometry( new ol.geom.Point(coord3857) );

	});

 	mapleft.on('pointermove', function(event) {
		iconFeature.setGeometry(null);
                var Rcoord3857 = event.coordinate;
		RiconFeature.setGeometry( new ol.geom.Point(Rcoord3857) );

	});

// removes the cross when mouse enters the header div

	jQuery("#header").on("mouseenter", function(event) {
		iconFeature.setGeometry(null);
		RiconFeature.setGeometry(null);
	});   






