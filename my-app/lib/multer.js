const multer = require("multer");
const cloudinary = require("./cloudinary");
const cloudinaryStorage = require("multer-storage-cloudinary");

const storage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "products",
  allowedFormats: ["jpg", "png", "jpeg"],
});

const upload = multer({ storage });

module.exports = upload;