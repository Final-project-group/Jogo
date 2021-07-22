const { Schema, model } = require("mongoose");

const eventSchema = new Schema({
  userId: String,
  location: String,
  date: { type: String },
  sport: String,
  level: String,
  age: String,
  members: Array,
  memberIds: [{type: Schema.Types.ObjectId, ref: 'User'}],
  spots: Number,
  creator: Object,
  image: String,
  eventName: String,
  description: String,
});

module.exports = model("Event", eventSchema);
