import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMessages, getUsersForSidebar, sendMessage } from "../controllers/message.controller.js";
import multer from "multer";

const router = express.Router();

// Multer configuration for storing voice notes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/voiceNotes"); // Folder to store voice notes
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit: 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type, only audio files are allowed!"));
    }
  },
});

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);

router.post("/send", upload.single("voiceNote"), async (req, res) => {
  const { sender, receiver, text } = req.body;

  try {
    const newMessage = new Message({
      sender,
      receiver,
      text,
      voiceNote: req.file ? `/uploads/voiceNotes/${req.file.filename}` : undefined,
    });

    const savedMessage = await newMessage.save();
    res.status(201).json(savedMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;