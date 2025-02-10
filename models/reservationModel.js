const mongoose = require("mongoose");

const today = () => {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const addDays = (days) => {
	return new Date(today.valueOf() + days * 1000 * 60 * 60 * 24);
};

//TODO: required fields
//TODO: validate date range
//TODO: auto-generate code?

const reservationSchema = new mongoose.Schema({
	room: {
		type: mongoose.Schema.ObjectId,
		ref: "Room",
		required: [true, "specify room for reservation"],
	},
	code: {
		type: String,
		required: [true, "required reservation code"],
		unique: true,
	},
	name: String,
	address: String,
	city: String,
	zip: String,
	country: String,
	checkin: Date,
	checkout: Date,
	created_at: {
		type: Date,
		default: Date.now(),
		select: false,
	},
});

reservationSchema.pre(/^find/, function (next) {
	this.populate({
		path: "room",
		select: "number",
	});
	next();
});

const Reservation = mongoose.model("Reservation", reservationSchema);

module.exports = Reservation;
