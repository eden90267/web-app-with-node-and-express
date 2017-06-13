/**
 * Created by eden90267 on 2017/6/12.
 */
var mongoose = require('mongoose');

var attractionSchema = mongoose.Schema({
    name: String,
    description: String,
    location: {lat: Number, lng: Number},
    history: {
        event: String,
        notes: String,
        email: String,
        date: Date,
    },
    updateId: String,
    approved: Boolean,
});
var Attraction = mongoose.model('Attraction', attractionSchema);
module.exports = Attraction;