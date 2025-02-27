const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
	{
		// id is int in API specification, but I guess mongodb string will be ok?
		number: {
			type: Number,
			required: [true, "room number is required"],
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
			min: [0, "room price cannot be negative"],
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

//WHY doesn't it work the same when put in schema declaration???

roomSchema.virtual("reservations", { ref: "Reservation", foreignField: "room", localField: "_id" });

roomSchema.query.populateReservations = function () {
	//returns self (chainable)
	return this.populate({
		path: "reservations",
		select: "_id checkin checkout -created_at -room",
	});
};

const Room = mongoose.model("Room", roomSchema);

//seems like Mongoose automatically pluralizes db collection name

module.exports = Room;
