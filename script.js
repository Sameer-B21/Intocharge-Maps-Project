let map;
let autocomplete;
let markers = [];  // Array to hold the markers
let userLocation; // Store the user's location
let directionsService;
let directionsRenderer;



function initMap() {
  // Get the user's current position
  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      // Initialize the map with the user's location
      map = new google.maps.Map(document.getElementById("map"), {
        center: userLocation,
        zoom: 15,
        styles: [
          {
            // Sets the base color for all map features like land, water, and roads.
            "elementType": "geometry",
            "stylers": [{ "color": "#E8E8E8" }] // light gray base color for the map background.
          },
          {
            // Controls the visibility of icons like place markers (e.g., restaurants, businesses).
            "elementType": "labels.icon",
            "stylers": [{ "visibility": "off" }, { "color": "#aaaaaa" }] // Hides all icons on the map for a cleaner appearance.
          },
          {
            // Sets the color for text labels, such as road names and place names.
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#757575" }] // gray text color for a subtle appearance.
          },
          {
            // Sets the color for text labels, such as country names.
            "featureType": "administrative.country",
            "elementType": "labels.text.fill",
            "stylers": [
              { "color": "#000000" }, // Black color for country names
              { "weight": 3 }         // Bold effect by increasing weight
            ]
          },
          //province labels
          {
            "featureType": "administrative.province",
            "elementType": "labels.text.fill",
            "stylers": [
              { "color": "#757575" }, // Gray color for province/state names
              { "weight": 1 }         // Normal weight for text
            ]
          },
          {
            // Defines the stroke color around text labels (outlines of letters).
            "elementType": "labels.text.stroke",
            "stylers": [{ "weight": 0 }] // Light gray stroke to minimize boldness and blend with the map background.
          },
          {
            // Controls the appearance of administrative boundaries (e.g., country, state borders).
            "featureType": "administrative",
            "elementType": "geometry",
            "stylers": [{ "color": "#000000" }] // Black boundary lines for clear but subtle visibility.
          },
          {
            // Specifies the appearance of standard roads (non-highways).
            "featureType": "road",
            "elementType": "geometry.fill",
            "stylers": [{ "color": "#D3D3D3" }] // A bit darker than #E8E8E8 for roads to make them stand out against the base background.
          },
          // {
          //   // Defines the appearance of highways specifically.
          //   "featureType": "road.highway",
          //   "elementType": "geometry",
          //   "stylers": [{ "color": "#D3D3D3" }] // Slightly lighter gray for highways to distinguish them from regular roads.
          // },
          {
            // Specifies the appearance of water bodies like lakes, rivers, and oceans.
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{ "color": "#D3D3D3" }] // A bit darker than #E8E8E8. PERFECT
          },
          // {
          //   // Customizes the appearance of natural features like parks and forests.
          //   "featureType": "poi.park",
          //   "elementType": "geometry",
          //   "stylers": [{ "color": "#E8E8E8" }] // light gray to represent parks and forests clearly.
          // }
          {
            "featureType": "administrative.land_parcel",
            "elementType": "geometry.fill",
            "stylers": [{ "visibility": "off" }]
          }
        ],
      });

      // Create the Places service
      const service = new google.maps.places.PlacesService(map);

      // Create a search box and link it to the input field
      const input = document.getElementById("search-box");
      autocomplete = new google.maps.places.Autocomplete(input);

      // Bias the search results to the user's current location
      autocomplete.setBounds(map.getBounds());

      // Listen for when the user selects a place from the autocomplete suggestions
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();

        //setting the user location to the searched location
        userLocation = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        if (!place.geometry) {
          return;
        }

        // Center the map on the selected place and add a marker
        map.setCenter(place.geometry.location);
        map.setZoom(15); // Zoom in to the place

        // Add a marker for the selected place
        new google.maps.Marker({
          position: place.geometry.location,
          map: map,
          title: place.name,
        });

        // Search for EV charging stations near the selected place
        searchEVStations(place.geometry.location, service);
      });

      // Initially display EV stations around the user's location
      searchEVStations(userLocation, service);


      //Event listener for recentering the map
      const recenterButton = document.getElementById("recenter-btn");
      recenterButton.addEventListener("click", () => {
        recenterMap(userLocation);
      });

      directionsService = new google.maps.DirectionsService(); // Handles route calculations
      directionsRenderer = new google.maps.DirectionsRenderer({
        map,
        polylineOptions: {
          strokeColor: "#000000", // Black color for the route
          strokeWeight: 5, // Adjust thickness of the route line
        },
      }); // Renders routes on the map

      directionsRenderer.setMap(map); // Attach the renderer to the map

    },
    () => { //the case when geolocation is not available
      const defaultLocation = { lat: 43.65107, lng: -79.347015 }; // Default Location: Toronto
      initializeMap(defaultLocation);
      alert("Using default location as geolocation is unavailable.");
    }
  );
}



// Function to recenter the map
function recenterMap(location) {
  map.setCenter(location);
  map.setZoom(15);
}

// Function to search for EV charging stations around a given location
function searchEVStations(location, service, r = 5) {
  const request = {
    location: location,
    radius: r * 1000, // Search within r km
    keyword: "EV charging station",
  };

  const customIcon = {
    url: "./images/Pin.png", // URL to your custom image
    scaledSize: new google.maps.Size(40, 40),  // Scales the image to desired dimensions
    origin: new google.maps.Point(0, 0),      // Origin of the image (top-left corner)
    anchor: new google.maps.Point(20, 40),    // Position to anchor the marker on the map
  };

  service.nearbySearch(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      // Clear existing markers
      clearMarkers();

      const distanceService = new google.maps.DistanceMatrixService(); //initializing for distance between locations

      // Add a marker for each EV charging station
      results.forEach((place) => {
        const marker = new google.maps.Marker({
          position: place.geometry.location,
          map: map,
          title: place.name,
          icon: customIcon, // Set the custom icon
        });


        // Get distance to the place
        distanceService.getDistanceMatrix(
          {
            origins: [location],
            destinations: [place.geometry.location],
            travelMode: 'DRIVING', // Other options: 'WALKING', 'BICYCLING', 'TRANSIT'
          },

          (response, status) => {
            const distance = response.rows[0].elements[0].distance.text; // Distance in text format 

            // Popup window
            const infoWindow = new google.maps.InfoWindow({
              content: `<div class="popup">
              <h3>${place.name}</h3>
              <p>${place.vicinity}</p>
              <p>${distance} away</p>

              <div class="charging-info">
                <span>"Charging info"</span>
                <span class="status">${place.business_status === "OPERATIONAL" ? "Currently Available" : "Unavailable"}</span>
              </div>
              
              <div class="price-and-book">
                <div class="price"><strong>Price:</strong> $/hr</div>
                <button class="book-btn" onclick="getDirections(${place.geometry.location.lat()}, ${place.geometry.location.lng()})">Get Directions</button>
              </div>

              <div class="report-btn-container">
                <button class="report-btn" id="report">Report Issue</button>
                </div>
              </div>`,
            });

            // Store the marker in the markers array
            markers.push(marker);

            marker.addListener("click", () => {
              infoWindow.open(map, marker);

            });
          });
      });
    } else {
      console.error("Error fetching places: " + status);
    }
  });
}

// Function to clear existing markers on the map
function clearMarkers() {
  // Remove each marker from the map and clear the array
  markers.forEach((marker) => marker.setMap(null));
  markers = [];
}



function getDirections(destLat, destLng) {
  const request = {
    origin: userLocation, // The user's current location
    destination: { lat: destLat, lng: destLng }, // Destination EV station
    travelMode: 'WALKING', // Other options: 'WALKING', 'BICYCLING', 'TRANSIT'
  };

  directionsService.route(request, (result, status) => {
    if (status === google.maps.DirectionsStatus.OK) {
      directionsRenderer.setDirections(result); // Display the route on the map
    } else {
      console.error("Directions request failed: " + status);
      alert("Unable to calculate route. Please try again.");
    }
  });
}



//Function for the case geolocation fails
function initializeMap(location) {
  map = new google.maps.Map(document.getElementById("map"), {
    center: location,
    zoom: 15,
    styles: [
      {
        // Sets the base color for all map features like land, water, and roads.
        "elementType": "geometry",
        "stylers": [{ "color": "#aaaaaa" }] // Medium gray base color for the map background.
      },
      {
        // Controls the visibility of icons like place markers (e.g., restaurants, businesses).
        "elementType": "labels.icon",
        "stylers": [{ "visibility": "off" }] // Hides all icons on the map for a cleaner appearance.
      },
      {
        // Sets the color for text labels, such as road names and place names.
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#555555" }] // Light gray text color for a subtle appearance.
      },
      {
        // Defines the stroke color around text labels (outlines of letters).
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#aaaaaa" }] // Light gray stroke to minimize boldness and blend with the map background.
      },
      {
        // Controls the appearance of administrative boundaries (e.g., country, state borders).
        "featureType": "administrative",
        "elementType": "geometry",
        "stylers": [{ "color": "#000000" }] // Black boundary lines for clear but subtle visibility.
      },
      {
        // Specifies the appearance of standard roads (non-highways).
        "featureType": "road",
        "elementType": "geometry.fill",
        "stylers": [{ "color": "#757575" }] // Dark gray for roads to make them stand out against the base background.
      },
      {
        // Defines the appearance of highways specifically.
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [{ "color": "#757575" }] // Slightly lighter gray for highways to distinguish them from regular roads.
      },
      {
        // Specifies the appearance of water bodies like lakes, rivers, and oceans.
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{ "color": "#ADD8E6" }] // Light blue color to mimic natural water tones.
      },
      {
        // Customizes the appearance of natural features like parks and forests.
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [{ "color": "#228B22" }] // Forest green to represent parks and forests clearly.
      }
    ],
  });
}


//TODO: call all ev stations, postion the recenter button, make the map into grid (like uber maps), design the site like the company site, report button should send an email

//Questions: database, design

//use the station info from google maps (type of charger): This isn't accessible through google