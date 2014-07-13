var app = angular.module('dragon', ['ngRoute', 'filters']);

app.config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/', {
		templateUrl: 'views/mapSearch.html', 
    	controller: 'dragonRoar'
	}).otherwise({redirectTo:'/'});
}]);

app.controller('dragonRoar', function($scope, dragonBreath, dragonHeart, dragonBrain, $timeout) {
	$scope.markersListeners = [];
	$scope.places = [];
	$scope.markers = [];
	$scope.searchConfig = { display : false };
	$scope.placeDetails = { display : false, loading : false };

	$scope.retrack = function (normal) {
		var randomLat, randomLon;
		if (Modernizr.geolocation) {
			navigator.geolocation.getCurrentPosition(function (position) {
				if ($scope.placeDetails.display === true) {
					$scope.placeDetails = { display : false, loading : false };
				}
				$scope.searchConfig.display = false;
				if (!normal) {
					randomLat = Math.floor(Math.random() * 7) + 1;
					randomLon = Math.floor(Math.random() * 7) + 1;
				} else {
					randomLat = 0;
					randomLon = 0;
				}
				$scope.coords = new google.maps.LatLng(position.coords.latitude-randomLat,position.coords.longitude-randomLon);
				$scope.maps.setCenter($scope.coords);
				$scope.maps.setZoom(13);
				removeAllMarkers();
				addYouMarker();
				showLoading();
				dragonBreath.callMaps($scope.maps, $scope.coords, $scope.searchConfig.configuration.radius * 1609.34, $scope.searchConfig.configuration.currentSet);
				$timeout(function(){
					asyncPlacesReceiver();
				}, 1000);
			});
		}	
	};

	$scope.showConfigs = function () {
		if($scope.searchConfig.display === false) {
			$scope.searchConfig.display = true;	
			$scope.placeDetails.display = false;		
		} else {
			$scope.searchConfig.display = false;
		}
	};

	$scope.showDetails = function (index, placeId) {
		$scope.placeDetails.loading = true;
		if($scope.placeDetails.display === false) {
			$scope.placeDetails.display = true;
			$scope.searchConfig.display = false;
		}
		centerOnMap(index);
		dragonHeart.callToDetails($scope.maps, placeId);
		$timeout(function(){
			asyncDetailsReceiver();
		}, 1000);
	};

	$scope.showImageOverlay = function (image) {
		$scope.placeDetails.overlayImage = image;
		if (window.innerWidth > 767) {
			window.scrollTo(0, 42);
		} else {
			window.scrollTo(0, 235);
		}
		
	};

	$scope.hideImageOverlay = function () {
		$scope.placeDetails.overlayImage = false;
	};

	$scope.showRatingOverlay = function (image) {
		$scope.placeDetails.overlayRatings = true;
		if (window.innerWidth > 767) {
			window.scrollTo(0, 42);
		} else {
			window.scrollTo(0, 235);
		}
		
	};

	$scope.hideRatingOverlay = function () {
		$scope.placeDetails.overlayRatings = false;
	};

	$scope.processConfigChange = function (index) {
		$scope.searchConfig.configuration.currentSet = [];
		for (var i = 0; i < $scope.searchConfig.configuration.places.length; i++) {
			if($scope.searchConfig.configuration.places[i].active === true) {
				for (var j = 0; j < $scope.searchConfig.configuration.places[i].list.length; j++) {
					$scope.searchConfig.configuration.currentSet.push($scope.searchConfig.configuration.places[i].list[j]);
				}
			}
		}
	};

	// not proud
	var asyncPlacesReceiver = function () {
		$scope.places = dragonBreath.getPlaces();
		if ($scope.places.error) {
			removeAllMarkers();
			addYouMarker();
		} else if ($scope.places.length === 0) {
			$timeout(function(){
				asyncPlacesReceiver();
			}, 1000);
		} else {
			addMarkers();
		}
		$scope.$digest();
	};

	var asyncDetailsReceiver = function () {
		$scope.placeDetails.info = dragonHeart.getPlaceDetail();
		if ($scope.placeDetails.info === false) {
			$timeout(function(){
				asyncDetailsReceiver();
			}, 1000);
		} else if ($scope.placeDetails.info.error) {
			$scope.placeDetails.loading = false;
			$scope.$digest();
		} else {
			$scope.placeDetails.loading = false;
			$scope.$digest();
		}
	};
	// end of not proud
	var centerOnMap = function (id, toTop) {
		if (typeof id === "number") {
			if (id <= $scope.markers.length){
				$scope.maps.setCenter(
					$scope.markers[id].position
				);
				window.scrollTo(0, 0);
				$scope.maps.setZoom(16);
			}
		}
	};

	var track = function () {
		if (Modernizr.geolocation) {
			navigator.geolocation.getCurrentPosition(function (position) {
				$scope.coords = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
				$scope.maps = new google.maps.Map(document.getElementById('maps'), {
			    	center: $scope.coords,
			    	zoom: 13
			    });
			    $scope.$watch('searchConfig.display', function() {
					resizeMap();
				});
			    $scope.$watch('placeDetails.display', function() {
					resizeMap();
				});
			    google.maps.event.addDomListener(window, "resize", function() {
					resizeMap();
				});
				addYouMarker();
				showLoading();
				dragonBrain.callConfigurations().then(function(d){
					$scope.searchConfig.configuration = d;
					$scope.processConfigChange();
					initialPlacesLoad();
				});
			});
		}	
	};

	var initialPlacesLoad = function () {
		dragonBreath.callMaps($scope.maps, $scope.coords, $scope.searchConfig.configuration.radius * 1609.34, $scope.searchConfig.configuration.currentSet);
		$timeout(function(){
			asyncPlacesReceiver();
		}, 1000);
	};

	var showLoading = function () {
		$scope.places = { loading : true };
		$scope.$digest();
	};

	var addMarkers = function () {
		for (var i = 0; i < $scope.places.length; i++) {
			var marker = new google.maps.Marker({
				map: $scope.maps,
				animation: google.maps.Animation.DROP,
				icon: new google.maps.MarkerImage(
        			'http://maps.google.com/mapfiles/kml/paddle/' + String.fromCharCode(i + 65) + '.png',
        			new google.maps.Size(30, 30),
        			new google.maps.Point(0, 0),
        			new google.maps.Point(15, 15),
        			new google.maps.Size(30, 30)
			    ),
				position: $scope.places[i].geometry.location,
				title: $scope.places[i].name
			});
			var markerClickEvent = google.maps.event.addListener(marker, 'click', function(id, index) {
				return function() {$scope.showDetails(index, id);$scope.$digest();}
			}($scope.places[i].place_id, i+1));
			$scope.markers.push(marker);
			$scope.markersListeners.push(markerClickEvent);
		}
	};

	var removeAllMarkers = function () {
		for (var i = 0; i < $scope.markers.length; i++) {
			$scope.markers[i].setMap(null);
		}
		$scope.markers = [];
		for (var i = 0; i < $scope.markersListeners.length; i++) {
			google.maps.event.removeListener($scope.markersListeners[i]);
		}
		$scope.markersListeners = [];
	};

	var addYouMarker = function () {
		var marker = new google.maps.Marker({
		    position: $scope.maps.getCenter(),
		    map: $scope.maps,
		    title: 'You'
		});
		$scope.markers.push(marker);
	};

	var resizeMap = function () {
		var center = $scope.maps.getCenter();
		google.maps.event.trigger($scope.maps, "resize");
		$scope.maps.setCenter(center);
	};

	track();

});

app.factory('dragonBreath', function() {

	var factory = {};
	var places = [];

	factory.callMaps = function (map, coords, area, interests) {
		var service = new google.maps.places.PlacesService(map);
		service.nearbySearch({location : coords, radius : area, types : interests}, function(results, status) {
			if (status == google.maps.places.PlacesServiceStatus.OK) {
				places = results;
			} else if (status == google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
				places = {error : 'Nothing Found'};
			} else {
				places = {error : 'Service Unavailable'};
			}
			return places;			
		});
	};

	factory.getPlaces = function () {
		return places;
	};

	return factory;
});

app.factory('dragonHeart', function() {

	var factory = {};
	var placeDetail = false;

	factory.callToDetails = function (map, id) {
		var service = new google.maps.places.PlacesService(map);
		service.getDetails({placeId : id}, function(results, status) {
			if (status == google.maps.places.PlacesServiceStatus.OK) {
				if (results.photos) {
					for (var i = 0; results.photos.length > i; i++) {
						results.photos[i].photoSmall = results.photos[i].getUrl({'maxWidth': 100, 'maxHeight': 100});
						results.photos[i].photoBig = results.photos[i].getUrl({'maxWidth': 600, 'maxHeight': 600});
					}
				}
				results.overlayImage = false;
				results.overlayRatings = false;
				placeDetail = results;
			} else if (status == google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
				placeDetail = {error : 'Nothing Found'};
			} else {
				placeDetail = {error : 'Service Unavailable'};
			}
			return placeDetail;			
		});
	};

	factory.getPlaceDetail = function () {
		return placeDetail;
	};

	return factory;

});

app.factory('dragonBrain', function($http) {

	var factory = {};

	factory.callConfigurations = function() {
		var promise = $http.get('json/filters.json').then(function (results) {
			console.log(results);
			return results.data;
		});
		return promise;
	};

	return factory;
});

angular.module('filters', [])
	.filter('underscoreToSpace', function () {
		return function (input) {
			if (input) {
				return input.toLowerCase().replace(/_/g, ' ');
			}
		};
	}
).filter('toAZ', function () {
		return function (input) {
			if (input) {
				if (input <= 26 && input >= 1) {
					return String.fromCharCode(input + 64);
				} else {
					return input;
				}
			}
		};
	}
).filter('ratingToStar', function () {
		return function (input) {
			if (typeof input === "number") {
				if (input <= 5 && input >= 1) {
					var fullStar = Math.round(input),
						string = "";
					for (var i = 0; i < fullStar; i++)  {
						string = string + "&#xf005; "
					} 
					return string;
				} else {
					return input;
				}
			}
		};
	}
).filter('priceRating', function () {
		return function (input) {
			if (typeof input === "number") {
				if (input <= 4 && input >= 0) {
					var string = "";
					for (var i = 0; i <= input; i++)  {
						string = string + "&#xf155; "
					} 
					return string;
				} else {
					return input;
				}
			}
		};
	}
).filter('toHTML', ['$sce', function ($sce) {
		return function (input) {
			if (input) {
				return $sce.trustAsHtml(input);
			}
		};
	}]
);