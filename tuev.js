var tuevStations = require('./tuevstations.json');
var math = require('mathjs');
var closestIndex;


module.exports.getClosestStation =getClosestStation;


function getClosestStation(ort, callback) {
    // setup Google Maps
    var googleMapsClient = require('@google/maps').createClient({
        key: 'AIzaSyBn6M9Sl3K4tRn0QbkqN5QPSdHoNMIvndw'
    });
    googleMapsClient.geocode({
        address: ort
        }, function(err, response) {
        if (!err) {
            for(var i = 0; i < response.json.results.length; i++) {
                if (response.json.results[i].geometry) {
                    var lat = response.json.results[i].geometry.location.lat;
                    var lng = response.json.results[i].geometry.location.lng;
                 }
            }
            
            var closestDist;
            for(var i = 0; i < tuevStations["stations"].length; i++) {
                    var latDelta = tuevStations["stations"][i].lat - lat;
                    var lngDelta = tuevStations["stations"][i].lng - lng;
                    var dist = math.sqrt(latDelta*latDelta + lngDelta*lngDelta);
                    var test;
                    if(!closestDist || dist < closestDist) {
                        closestDist = dist;
                        closestIndex = i;
                    }
            }
            callback(tuevStations["stations"][closestIndex]);;
            //session.send("Die folgende TÜV Station ist am nächsten zu dem Standort: " + tuevStations["stations"][closestIndex].address);

        } else {
            //console.log(err);
        }
        }
    );
}