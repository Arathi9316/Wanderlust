const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");

const { isLoggedin, isOwner, validateListing } = require("../middleware.js");

const listingController = require("../controllers/listings.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js"); // const upload = multer({ dest: "uploads/" });//multer save files on destination upload
const upload = multer({ storage });

/*
//Index route
router.get("/", wrapAsync(listingController.index));
//new route
router.get("/new", isLoggedin, listingController.renderNewForm);

//show route
router.get("/:id", wrapAsync(listingController.showListing));

//create route

router.post(
  "/",
  isLoggedin,
  validateListing,
  wrapAsync(listingController.createListing)
);

//edit route
router.get(
  "/:id/edit",
  isLoggedin,
  isOwner,
  wrapAsync(listingController.renderEditForm)
);

//update route
router.put(
  "/:id",
  isLoggedin,
  isOwner,
  validateListing,
  wrapAsync(listingController.updateListing)
);

//delete route
router.delete(
  "/:id",
  isLoggedin,
  isOwner,
  wrapAsync(listingController.destroyListing)
);
*/

//using router.route
router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedin,
    validateListing,
    upload.single("listing[image]"),
    wrapAsync(listingController.createListing)
  );

//new route
router.get("/new", isLoggedin, listingController.renderNewForm);
router
  .route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedin,
    isOwner,

    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  .delete(isLoggedin, isOwner, wrapAsync(listingController.destroyListing));

//edit route
router.get(
  "/:id/edit",
  isLoggedin,
  isOwner,
  wrapAsync(listingController.renderEditForm)
);
//for search
router.post("/search", listingController.searchListing);
module.exports = router;
