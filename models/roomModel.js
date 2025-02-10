const mongoose = require("mongoose");

// "capacity" and "price" fields should return formatted text

const roomSchema = new mongoose.Schema(
	{
		number: {
			type: number,
			required: [true, "required room number"],
			unique: true,
		},
		capacity: {
			type: Number,
			min: [1, "minimum room capacity is 1"],
			max: [5, "maximum room capacity is 5"],
		},
		room_image: {
			type: String,
		},
		price: {
			type: Number,
		},
		wifi: {
			type: Boolean,
		},
		parking: {
			type: Boolean,
		},
		breakfast: {
			type: Boolean,
		},
		createdAt: {
			type: Date,
			default: Date.now(),
			select: false,
		},
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

const Room = mongoose.model("Room", roomSchema);

module.exports = Room;
