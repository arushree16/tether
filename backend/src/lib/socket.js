import { Server } from "socket.io";
import http from "http";
import express from "express";
import cloudinary from "cloudinary";
import fs from "fs";
import path from "path";

// MongoDB connection (optional for metadata storage)
import { MongoClient, GridFSBucket } from "mongodb";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"], // Adjust to your client’s URL
  },
});

// Cloudinary configuration
cloudinary.config({
  cloud_name: "your-cloud-name", // Replace with your Cloudinary cloud name
  api_key: "your-api-key", // Replace with your API key
  api_secret: "your-api-secret", // Replace with your API secret
});

// Used to store online users
const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // Emit online users list to everyone
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Handle voice note send event
  socket.on("sendVoiceNote", (voiceNoteData) => {
    const { receiverId, fileUrl, fileName } = voiceNoteData;

    // Find the socket ID of the receiver
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      // Emit the voice note metadata (fileUrl and filename) to the receiver
      io.to(receiverSocketId).emit("receiveVoiceNote", { fileUrl, fileName });
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// Endpoint for uploading voice notes to Cloudinary
app.post("/uploadVoiceNote", express.raw({ limit: "10mb", type: "audio/*" }), (req, res) => {
  if (!req.body) {
    return res.status(400).send("No audio file received.");
  }

  try {
    // Create a file path to temporarily save the file
    const filePath = path.join(__dirname, "temp_audio_file");
    fs.writeFileSync(filePath, req.body); // Save the raw file temporarily

    // Upload the file to Cloudinary
    cloudinary.v2.uploader.upload(filePath, { resource_type: "auto" }, (error, result) => {
      // Delete the temporary file after upload
      fs.unlinkSync(filePath);

      if (error) {
        console.error("Error uploading voice note to Cloudinary", error);
        return res.status(500).send("Error uploading voice note to Cloudinary.");
      }

      // Send back the URL of the uploaded voice note
      const fileUrl = result.secure_url; // This is the public URL of the uploaded file
      const fileName = result.public_id; // The unique Cloudinary identifier for the file

      // You could optionally save this URL and metadata to MongoDB here

      res.json({ fileUrl, fileName });
    });
  } catch (error) {
    console.error("Error processing voice note upload", error);
    res.status(500).send("Error processing voice note upload.");
  }
});

// Endpoint to stream the voice note from Cloudinary (if needed)
app.get("/voiceNote/:fileName", (req, res) => {
  const { fileName } = req.params;
  const fileUrl = cloudinary.url(fileName, { resource_type: "audio" });
  res.redirect(fileUrl); // Redirect to Cloudinary URL
});

export { io, app, server };
