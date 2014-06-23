var app = angular.module('dragon', ['filters']);

app.controller('dragonRoar', function($scope, dragonBreath, $timeout) {
	$scope.places = [];
	$scope.markers = [];

	$scope.retrack = function () {
		if (Modernizr.geolocation) {
			navigator.geolocation.getCurrentPosition(function (position) {
				$scope.coords = new google.maps.LatLng(position.coords.latitude-(Math.floor(Math.random() * 7) + 1),position.coords.longitude-(Math.floor(Math.random() * 7) + 1));
				$scope.maps.setCenter($scope.coords);
				$scope.maps.setZoom(13);
				removeAllMarkers();
				addYouMarker();
				dragonBreath.callMaps($scope.maps, $scope.coords, 2000, []);
				$timeout(function(){
					asyncTest();
				}, 1000);
			});
		}	
	};

	$scope.centerOnMap = function (id, toTop) {
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

	var asyncTest = function () {
		$scope.places = dragonBreath.getPlaces();
		if ($scope.places.error) {
			removeAllMarkers();
			addYouMarker();
			$scope.$apply();
		} else if ($scope.places.length === 0) {
			$timeout(function(){
				asyncTest();
			}, 1000);
		} else {
			$scope.$apply();
			addMarkers();
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
				addYouMarker();
				dragonBreath.callMaps($scope.maps, $scope.coords, 2000, []);
				$timeout(function(){
					asyncTest();
				}, 1000);
			});
		}	
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
			$scope.markers.push(marker);
		}
	};

	var removeAllMarkers = function () {
		for (var i = 0; i < $scope.markers.length; i++) {
			$scope.markers[i].setMap(null);
		}
		$scope.markers = [];
	};

	var addYouMarker = function () {
		var marker = new google.maps.Marker({
		    position: $scope.maps.getCenter(),
		    map: $scope.maps,
		    title: 'You'
		});
		$scope.markers.push(marker);
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