const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Profile Image Storage (already working)
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "profileImages",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});
const uploadProfile = multer({ storage: profileStorage });

// Workspace Logo Storage (NEW)
const workspaceLogoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "workspace_logos", // folder alag
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});
const uploadWorkspaceLogo = multer({ storage: workspaceLogoStorage });

module.exports = {
  cloudinary,
  uploadProfile,
  uploadWorkspaceLogo,
};