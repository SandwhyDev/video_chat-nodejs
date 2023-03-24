const express = require("express");
const ImageChat = require("../libs/Multer");
const uid = require("../libs/uuid");
const { ChatModels } = require("../models/ChatModels");
const PhotoChatModels = require("../models/PhotoChatModels");

const ChatControllers = express.Router();

ChatControllers.post("/chat/create", ImageChat.single("foto"), async (req, res) => {
  try {
    const data = await req.body;
    const file = await req.file;

    console.log(file);

    const create = await ChatModels.create({
      data: {
        user: data.user,
        message: data.message,
        room_id: data.room_id,
      },
    });

    if (file != undefined) {
      await PhotoChatModels.create({
        data: {
          chat_id: create.id,
          filename: file.filename,
          mimetype: file.mimetype,
          size: file.size,
          image_path: `http://localhost:3030/images/${file.filename}`,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "berhasil",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

ChatControllers.post("/chat/read", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = await req.query;
    const skip = (page - 1) * limit;
    const { filter } = await req.body;
    const readUser = await ChatModels.findMany({
      where: filter,
      include: {
        photo: true,
      },
    });

    const cn = await ChatModels.count();
    res.status(200).json({
      currentPage: parseInt(page),
      total_page: Math.ceil(cn / limit),
      total_data: cn,
      query: readUser,
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = ChatControllers;
