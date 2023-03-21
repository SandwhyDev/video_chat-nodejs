const express = require("express");
const { ChatModels } = require("../models/ChatModels");

const ChatControllers = express.Router();

ChatControllers.get("/chat/read", async (req, res) => {
  try {
    const find = await ChatModels.findMany();

    res.status(200).json({
      success: true,
      query: find,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = ChatControllers;
