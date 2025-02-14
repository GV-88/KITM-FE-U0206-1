const mongoose = require("mongoose");
// const dayjs = require("dayjs");
const { generateCode } = require("../utilities/helpers");

const reservationSchema = new mongoose.Schema({
	room: {
		type: mongoose.Schema.ObjectId,
		ref: "Room",
		required: [true, "specify room for reservation"],
	},
	code: {
		type: String,
		required: [true, "reservation code is required"],
		unique: true,
		default: generateCode(10), //when will this function be called? //also, should we ensure unique in db with retry loop?
	},
	name: {
		type: String,
		required: [true, "reservation name is required"],
	},
	address: {
		type: String,
		required: [true, "address is required"],
	},
	city: {
		type: String,
		required: [true, "city is required"],
	},
	zip: {
		type: String,
		required: [true, "zip code is required"],
	},
	country: {
		type: String,
		required: [true, "country is required"],
	},
	checkin: {
		type: Date,
		required: [true, "checkin date is required"],
		// might also validate for future dates, but who says you cannot log reservations retroactively?
	},
	checkout: {
		type: Date,
		required: [true, "checkout date is required"],
		validate: {
			validator: function (val) {
				return val >= this.checkin;
			},
			message: "checkout date cannot be before checkin",
		},
	},
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
