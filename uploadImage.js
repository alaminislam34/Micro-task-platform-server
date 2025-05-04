const express = require("express");
const multer = require("multer");
const fs = require("fs");
const cloudinary = require("./cloudinary");

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // temp storage

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path);
    fs.unlinkSync(req.file.path); // delete temp file
    console.log(result.secure_url);
    res.status(200).json({ url: result.secure_url });
  } catch (error) {
    console.error("Upload failed:", error);
    res.status(500).json({ message: "Image upload failed" });
  }
});

module.exports = router;
