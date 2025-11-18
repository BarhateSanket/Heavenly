const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../Models/listing.js"); // Fixed casing to match existing import

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  await Listing.deleteMany({});
  initData.data.map((obj)=>({...obj, owner:"67bee8ba26b3202f85582816"}));
  // Transform the data to use only the image URL
  const transformedData = initData.data.map(item => ({
    ...item,
    image: item.image.url // Extract just the URL from the image object
  }));
  await Listing.insertMany(transformedData);
  console.log("data was initialized");
};

initDB();