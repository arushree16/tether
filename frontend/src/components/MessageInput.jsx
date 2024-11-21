import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [voiceNote, setVoiceNote] = useState(null);
  const fileInputRef = useRef(null);
  const voiceNoteInputRef = useRef(null);
  const { sendMessage } = useChatStore();

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle message submission
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) {
      toast.error("Please add text or an image.");
      return;
    }

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });

      // Clear input fields
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message. Please try again.");
    }
  };

  // Handle voice note upload
  const handleVoiceNoteUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      toast.error("Please select an audio file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error("Audio file size should be less than 10MB.");
      return;
    }

    setVoiceNote(file);
  };

  const sendVoiceNote = async () => {
    if (!voiceNote) {
      toast.error("No voice note selected.");
      return;
    }

    const formData = new FormData();
    formData.append("voiceNote", voiceNote);

    try {
      await axios.post("/messages/send", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Voice note sent successfully!");
      setVoiceNote(null); // Reset voice note
      if (voiceNoteInputRef.current) voiceNoteInputRef.current.value = "";
    } catch (error) {
      console.error("Error sending voice note:", error);
      toast.error("Failed to send voice note. Please try again.");
    }
  };

  return (
    <div className="p-4 w-full">
      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="button"
            className="hidden sm:flex btn btn-circle text-zinc-400"
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imagePreview}
        >
          <Send size={22} />
        </button>
      </form>

      {/* Voice Note Upload */}
      <div className="mt-4 flex items-center space-x-4">
        <input
          type="file"
          accept="audio/*"
          ref={voiceNoteInputRef}
          onChange={handleVoiceNoteUpload}
          className="hidden"
          id="voiceNoteInput"
        />
        <label
          htmlFor="voiceNoteInput"
          className="cursor-pointer text-blue-500 underline"
        >
          🎙️ Upload Voice Note
        </label>
        {voiceNote && (
          <div className="flex items-center gap-2">
            <span className="text-sm">{voiceNote.name}</span>
            <button
              onClick={sendVoiceNote}
              className="btn btn-primary btn-sm"
            >
              Send Voice Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageInput;
