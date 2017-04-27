var tuevStations = require('./tuevstations_coded.json');
var math = require('mathjs');
var closestIndex;


module.exports.getClosestStation =getClosestStation;


function getClosestStation(standort, callback) {
    var lat = standort.point.coordinates[0];
    var lng = standort.point.coordinates[1];
            
            //var closestDist;
            for(var i = 0; i < tuevStations.length; i++) {
                var tmp = tuevStations[i].point;
                var tmp2 = tuevStations[i];
                    var latDelta = tuevStations[i].point.coordinates[0] - lat;
                    var lngDelta = tuevStations[i].point.coordinates[1] - lng;
                    var dist = math.sqrt(latDelta*latDelta + lngDelta*lngDelta);
                    tuevStations[i].dist = dist;
            }
            tuevStations.sort(compare);

            callback(tuevStations);
            //session.send("Die folgende TÜV Station ist am nächsten zu dem Standort: " + tuevStations["stations"][closestIndex].address);

  //      } else {
            //console.log(err);
   //     }
//        }
 //   );
}


function compare(a,b) {
  if (a.dist < b.dist)
    return 1;
  if (a.dist > b.dist)
    return -+1;
  return 0;
}