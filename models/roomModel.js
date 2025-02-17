const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
	{
		// id is int in API specification, but I guess mongodb string will be ok?
		// _id: {
		// 	type: mongoose.ObjectId,
		// 	select: true,
		// 	alias: "id",
		// },
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
		virtuals: {
			// id: {
			// 	get() {
			// 		return this._id;
			// 	},
			// },
			reservations: { ref: "Reservation", foreignField: "room", localField: "_id" },
		},
	}
);

//why won't this work???
roomSchema.pre(/^find/, function (next) {
	// this.populate({
	// 	path: "reservations",
	// 	select: "room _id checkin checkout",
	// });
	next();
});

const Room = mongoose.model("Room", roomSchema);

//seems like Mongoose automatically pluralizes db collection name

module.exports = Room;
