var app = angular.module('placeFinder', ['ngRoute', 'filters']);

app.config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/', {
		templateUrl: 'views/mapSearch.html', 
    	controller: 'mapController'
	}).otherwise({redirectTo:'/'});
}]);

app.controller('mapController', function($scope, mapPlaces, mapPlacesDetail, configurations, trackPosition, $timeout) {
	$scope.markersListeners = [];
	$scope.places = [];
	$scope.markers = [];
	$scope.searchConfig = { display : false };
	$scope.placeDetails = { display : false, loading : false };

	$scope.retrack = function (normal) {
		trackPosition.getCoords().then(function(d) {
			var randomLat, randomLon;
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
			$scope.coords = new google.maps.LatLng(d[0]-randomLat,d[1]-randomLon);
			$scope.maps.setCenter($scope.coords);
			$scope.maps.setZoom(13);
			removeAllMarkers();
			addYouMarker();
			showLoading();
			getPlaces();
		});
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
		mapPlacesDetail.getPlaceDetail($scope.maps, placeId).then(function(d){
			$scope.placeDetails.info = d;
			if ($scope.placeDetails.info.error) {
				$scope.placeDetails.loading = false;
			} else {
				$scope.placeDetails.loading = false;
			}	
		});
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
		trackPosition.getCoords().then(function(d) {
			$scope.coords = new google.maps.LatLng(d[0],d[1]);
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
			configurations.callConfigurations().then(function(d){
				$scope.searchConfig.configuration = d;
				$scope.processConfigChange();
				getPlaces();
			});
		});
	};

	var getPlaces = function () {
		mapPlaces.getPlaces($scope.maps, $scope.coords, $scope.searchConfig.configuration.radius * 1609.34, $scope.searchConfig.configuration.currentSet).then(function(d){
			$scope.places = d;
			if ($scope.places.error) {
				removeAllMarkers();
				addYouMarker();
			} else {
				addMarkers();
			}
		});
	};

	var showLoading = function () {
		$scope.places = { loading : true };
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

app.factory('mapPlaces', ['$q', '$rootScope', function ($q, $rootScope) {

	var factory = {};

	factory.getPlaces = function(map, coords, area, interests) {
		var deferred = $q.defer();
		var service = new google.maps.places.PlacesService(map);
		service.nearbySearch({location : coords, radius : area, types : interests}, function(results, status) {
			if (status == google.maps.places.PlacesServiceStatus.OK) {
                $rootScope.$apply(function() {
                    deferred.resolve(results);
                });
			} else if (status == google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
				deferred.reject('Nothing Found');
			} else {
				deferred.reject('Service Unavailable');
			}	
		});
		return deferred.promise;
	};

	return factory;
}]);

app.factory('mapPlacesDetail', ['$q', '$rootScope', function ($q, $rootScope) {

	var factory = {};

	factory.getPlaceDetail = function(map, id) {
		var deferred = $q.defer();
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
                $rootScope.$apply(function() {
                    deferred.resolve(results);
                });
			} else if (status == google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
				deferred.reject({error : 'Nothing Found'});
			} else {
				deferred.reject({error : 'Service Unavailable'});
			}
		});
		return deferred.promise;
	};

	return factory;

}]);

app.factory('configurations', function($http) {

	var factory = {};

	factory.callConfigurations = function() {
		var promise = $http.get('json/filters.json').then(function (results) {
			return results.data;
		});
		return promise;
	};

	return factory;
});

app.factory('trackPosition', ['$q', '$window', '$rootScope', function ($q, $window, $rootScope) {

	var factory = {};

	factory.getCoords = function() {
		var deferred = $q.defer();
		if (Modernizr.geolocation) {
            $window.navigator.geolocation.getCurrentPosition(function (position) {
                $rootScope.$apply(function() {
                    deferred.resolve([position.coords.latitude, position.coords.longitude]);
                });
            }, function (error) {
                $rootScope.$apply(function() {
                    deferred.reject(error);
                });
            });
		} else {
            $rootScope.$apply(function() {
                deferred.reject(new Error("Geolocation is not supported"));
            });
		}
		return deferred.promise;
	};

	return factory;

}]);

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