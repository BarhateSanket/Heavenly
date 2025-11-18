const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");


const listingSchema = new Schema({
    title: {type: String, required: true},
    description: {type: String, required: true},
    image: {type: String, required: true,
        default: "https://unsplash.com/photos/a-woman-standing-on-top-of-a-snow-covered-slope-1yqA4OyC6gQ",
        set: (v) => v === "" ? "https://unsplash.com/photos/a-woman-standing-on-top-of-a-snow-covered-slope-1yqA4OyC6gQ": v},
    price: {type: Number, required: true},
    location: {type: String, required: true},
    country: {type: String, required: true},
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: "Review"
    }],
    owner:{
        type: Schema.Types.ObjectId,
        ref:"user",
    },
});

listingSchema.post("findOneAndDelete", async function(listing){
    if(listing){
        await Review.deleteMany({_id: {$in: listing.reviews}});
    }
});

const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;