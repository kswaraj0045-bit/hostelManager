import Message from '../models/Message.js';
import Digest from '../models/Digest.js';
import { askGemini } from '../config/gemini.js';
import { buildAIContext } from '../utils/buildAIContext.js';

const stripMarkdown = (text) => {
  if (!text) return '';
  return text
    .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/`{3}[\s\S]*?`{3}/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*+]\s/gm, '• ')
    .replace(/^\s*\d+\.\s/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const getChatHistory = async (req, res, next) => {
  try {
    const messages = await Message.find({ user_id: req.user._id, role: { $in: ['user', 'assistant'] } })
      .sort({ createdAt: 1 })
      .limit(50);
    res.json({ success: true, data: messages });
  } catch (err) {
    next(err);
  }
};

export const chat = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'Content required' });

    await Message.create({ user_id: req.user._id, role: 'user', content });

    const contextString = await buildAIContext(req.user._id);
    const assistantResponse = await askGemini(content, contextString);
    const cleanResponse = stripMarkdown(assistantResponse);

    await Message.create({ user_id: req.user._id, role: 'assistant', content: cleanResponse });

    res.json({ success: true, data: { content: cleanResponse } });
  } catch (err) {
    next(err);
  }
};

export const getDigest = async (req, res, next) => {
  try {
    const digest = await Digest.findOne({ user_id: req.user._id }).sort({ createdAt: -1 });
    if (!digest) return res.json({ success: true, data: null });
    res.json({ success: true, data: digest });
  } catch (err) {
    next(err);
  }
};
