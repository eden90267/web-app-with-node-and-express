function addMarkers(map){
var markers = [];
var Marker = google.maps.Marker;
var LatLng = google.maps.LatLng;
markers.push(new Marker({
	position: new LatLng(undefined, undefined),
	map: map,
	title: 'Oregon Novelties',
}));
markers.push(new Marker({
	position: new LatLng(undefined, undefined),
	map: map,
	title: 'Bruce\\\s Bric-a-Brac',
}));
markers.push(new Marker({
	position: new LatLng(undefined, undefined),
	map: map,
	title: 'Aunt Beru\\\s Oregon Souveniers',
}));
markers.push(new Marker({
	position: new LatLng(undefined, undefined),
	map: map,
	title: 'Oregon Goodies',
}));
markers.push(new Marker({
	position: new LatLng(undefined, undefined),
	map: map,
	title: 'Oregon Grab-n-Fly',
}));
}