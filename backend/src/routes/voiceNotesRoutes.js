import express from "express";
import cloudinary from "cloudinary";
import fs from "fs";
import path from "path";

const router = express.Router();

// Cloudinary configuration
cloudinary.config({
  cloud_name: "your-cloud-name", // Replace with your Cloudinary cloud name
  api_key: "your-api-key", // Replace with your Cloudinary API key
  api_secret: "your-api-secret", // Replace with your Cloudinary API secret
});

// Endpoint for uploading voice note
router.post("/uploadVoiceNote", express.raw({ limit: "10mb", type: "audio/*" }), (req, res) => {
  if (!req.body) {
    return res.status(400).send("No audio file received.");
  }

  try {
    // Temporarily save the voice note file
    const filePath = path.join(__dirname, "../temp_audio_file");
    fs.writeFileSync(filePath, req.body); // Save the raw file temporarily

    // Upload to Cloudinary
    cloudinary.v2.uploader.upload(filePath, { resource_type: "auto" }, (error, result) => {
      // Delete the temporary file after upload
      fs.unlinkSync(filePath);

      if (error) {
        console.error("Error uploading voice note", error);
        return res.status(500).send("Error uploading voice note.");
      }

      // Return the file URL and other relevant info
      const fileUrl = result.secure_url;
      const fileName = result.public_id;

      // Optionally, you can save the file URL and metadata to MongoDB here

      res.json({ fileUrl, fileName });
    });
  } catch (error) {
    console.error("Error processing upload", error);
    res.status(500).send("Error processing upload.");
  }
});

export default router;
