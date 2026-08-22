const mongoose = require("mongoose");

// One quiz attempt result, embedded per skill
const skillResultSchema = new mongoose.Schema(
  {
    skill: String,       // e.g. "JavaScript"
    score: Number,       // e.g. 80
    verified: Boolean,   // true if score >= 70
  },
  { _id: false }
);

const profileSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true }, // links to the login account
  name: String,
  education: String,
  branch: String,
  year: String,
  targetRole: String,
  skills: [String],              // self-reported skills
  quizResults: [skillResultSchema], // one entry per skill quizzed
  xp: { type: Number, default: 0 },
  badges: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Profile", profileSchema);