let map;

function initMap() {
  // Define the starting coordinates (latitude and longitude)
  const startLocation = { lat: 43.65107, lng: -79.347015 }; // Toronto, Canada

  // Initialize the map
  map = new google.maps.Map(document.getElementById("map"), {
    center: startLocation,
    zoom: 13,
  });

  // Create a PlacesService instance
  const service = new google.maps.places.PlacesService(map);

  // Search for EV charging stations nearby
  const request = {
    location: startLocation,
    radius: 5000, // Search within 5km
    keyword: "EV charging station",
  };

  service.nearbySearch(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      results.forEach((place) => {
        // Add a marker for each charging station
        new google.maps.Marker({
          position: place.geometry.location,
          map: map,
          title: place.name,
        });
      });
    } else {
      console.error("Error fetching places: " + status);
    }
  });
}

//TODO: make the markers popups so that you can get the info and report, geolocation, search bar, change logos