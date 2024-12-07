let map;
let autocomplete;
let markers = [];  // Array to hold the markers
let userLocation; // Store the user's location



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

        //setting the recentre location to the searched location
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
        // new google.maps.Marker({
        //   position: place.geometry.location,
        //   map: map,
        //   title: place.name,
        // });

        // Search for EV charging stations near the selected place
        searchEVStations(place.geometry.location, service);
      });

      // Initially display EV stations around the user's location
      searchEVStations(userLocation, service);


      // Hiding the search button
      // map.addListener("click", () => {
      //   searchBox.style.display =
      //     searchBox.style.display === "none" ? "block" : "none";
      // });


      //Event listener for recentering the map
      const recenterButton = document.getElementById("recenter-btn");
      recenterButton.addEventListener("click", () => {
        recenterMap(userLocation);
      });


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

      // Add a marker for each EV charging station
      results.forEach((place) => {
        const marker = new google.maps.Marker({
          position: place.geometry.location,
          map: map,
          title: place.name,
          icon: customIcon, // Set the custom icon
        });

        // Popup window
        const infoWindow = new google.maps.InfoWindow({
          content: `<div class="popup">
            <h3>${place.name}</h3>
            <p>${place.vicinity}</p>
            <button id="report">Report Issue</button>
          </div>`,
        });

        // Store the marker in the markers array
        markers.push(marker);

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
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


//TODO: call all ev stations, postion the recenter button, make the map into grid (like uber maps), design the site like the company site


//Questions: design, radius, size of the map, where to recenter