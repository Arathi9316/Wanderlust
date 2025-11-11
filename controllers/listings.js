const Listing = require("../models/listing");
const { listingSchema } = require("../schema.js");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  //   console.log(allListings);
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;

  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you are requesting for doesn't exist.");
    res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
  //let { title, description, price, image, location, country } = req.body;//make listing object in new.ejs listing[title]
  //----------------for server side validation ---------
  // if (!req.body.listing) {
  //   throw new ExpressError(400, "Enter valid data for listing");
  // }
  let response = await geocodingClient
    .forwardGeocode({
      query: req.body.listing.location,
      limit: 1,
    })
    .send();

  let url = req.file.path;
  let filename = req.file.filename;
  console.log(url, " ", filename);
  let result = listingSchema.validate(req.body);
  console.log(result);
  let listing = req.body.listing;
  const newListing = new Listing(listing);

  newListing.owner = req.user._id;
  newListing.image = { url, filename };

  newListing.geometry = response.body.features[0].geometry;
  await newListing.save();

  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;

  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you are requesting for doesn't exist.");
    res.redirect("/listings");
  }
  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/h_300/w_250");
  //   console.log(listing);
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  // if (!req.body.listing) {
  //   throw new ExpressError(404, "Enter valid data for listing");
  // }
  let { id } = req.params;

  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    // await listing.save();
  }
  let response = await geocodingClient
    .forwardGeocode({
      query: req.body.listing.location,
      limit: 1,
    })
    .send();

  if (response.body.features.length > 0) {
    listing.geometry = response.body.features[0].geometry; // { type: "Point", coordinates: [lng, lat] }
    listing.location = response.body.features[0].place_name; // formatted string
  }
  await listing.save();

  req.flash("success", "Listing Updated!");

  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing Deleted!");

  res.redirect("/listings");
};

//Map
module.exports.showListing = async (req, res) => {
  const listing = await Listing.findById(req.params.id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");
  // console.log(process.env.MAP_TOKEN);

  res.render("listings/show.ejs", {
    listing,
    mapToken: process.env.MAP_TOKEN,
  });
};

//for search
module.exports.searchListing = async (req, res, next) => {
  try {
    const { location } = req.body;
    if (!location || location.trim() === "") {
      req.flash("error", "Please enter a location to search!");
      return res.redirect("/listings");
    }

    console.log(location);

    // Geocode the entered location
    const response = await geocodingClient
      .forwardGeocode({
        query: location,
        limit: 1,
      })
      .send();

    if (!response.body.features.length) {
      req.flash("error", "Location not found!");
      return res.redirect("/listings");
    }
    const coordinates = response.body.features[0].geometry.coordinates;

    const listings = await Listing.find({
      geometry: {
        $near: {
          $geometry: { type: "Point", coordinates },
          $maxDistance: 25000, // 25km radius
        },
      },
    });
    res.render("listings/searchResults", {
      listings,
      location: response.body.features[0].place_name,
    });
  } catch (err) {
    console.error("Search error:", err);
    req.flash("error", "Something went wrong during search.");
    return res.redirect("/listings");
  }
};
