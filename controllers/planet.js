// Load required packages
var Planet = require('../models/planet');
var User = require('../models/user');
if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  var client = require("redis").createClient(rtg.port, rtg.hostname);
  client.auth(rtg.auth.split(":")[1]);
} else {
    var client = require("redis").createClient();
}

exports.createNewPlanet = function(req, res, next) {
  var planet = new Planet({
    name: req.body.name,
    description: req.body.description,
    image: req.body.image,
    owner: req.user._id,
    followers: [req.user._id]
  });
  planet.save(function(err) {
    if(err) return next(err);
    res.json({ message: 'New planet added' });
  });
};
exports.updateProfileImage = function(req, res, next) {
  var planet_id = req.body.planet;
  var cloudinary_id = req.body.cloudinary_id;
  Planet.findByIdAndUpdate(planet_id, {
    $set: {"image": cloudinary_id}
  }, function(err, user) {
    if(err) return next(err);
    res.json({"message": "Planet profile picture updated!"});
  });
}
exports.updateDescription = function(req, res, next) {
  var planet_id = req.body.planet;
  var bio_text = req.body.bio;
  Planet.findByIdAndUpdate(planet_id, {
    $set: {"description": bio_text}
  }, function(err, user) {
    if(err) return next(err);
    res.json({"message": "Planet bio updated!"});
  });
}
exports.getById = function(req, res, next) {
  var planet_id = req.params.id;
  Planet.findOne({_id: planet_id}, function(err, planet) {
    if(err) return next(err);
    res.json(planet);
  })
};
exports.deletePlanet = function(req, res, next) {
  var planet_id = req.params.id;
  Planet.remove({_id: planet_id}, function(err, planet) {
    if(err) return next(err);
    res.json({message: "Planet deleted OK!"});
  })
};

exports.startFollowing = function(req, res, next) {
  var user_id = req.user._id;
  var planet_id = req.body.id;
  Planet.findByIdAndUpdate(
    planet_id,
    {$addToSet: {followers: user_id}},
    {safe: false, upsert: true},
    function(err, model) {
      if(err) return next(err);
      res.json({message: "Started following OK!"});
    }
  );
};
exports.stopFollowing = function(req, res, next) {
  var userId = req.user._id;
  var planet_id = req.params.id;
  Planet.findByIdAndUpdate(planet_id, {
    $pull: {followers: userId}
  }, function(err, user) {
    if(err) return next(err);
    res.json({"message": "Stopped following OK!"});
  });
}
exports.getFollowers = function(req, res, next) {
  var planet_id = req.params.id;
  Planet.findOne({ _id: planet_id })
  .populate('followers')
  .exec(function (err, planet) {
    if (err) next(err);
    res.json(planet);
  });
}
exports.getPlanets = function(req, res, next) {
  Planet.find(function(err, planets) {
    if(err) return next(err);
    res.json(planets);
  });
};
exports.getLatestById = function(req, res, next) {
  var planet_id = req.params.id;
  client.lrange(planet_id+"_planet_latest", 0, -1, function(err, reply) {
    res.json(reply);
  });
}
