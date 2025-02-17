const mongoose = require("mongoose");
// const dayjs = require("dayjs");
const { generateCode } = require("../utilities/helpers");

const required = (fieldName = "{PATH}") => {
	return [true, `${fieldName} is required`];
};

const reservationSchema = new mongoose.Schema(
	{
		room: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Room",
			required: [true, "specify room for reservation"],
		},
		code: {
			type: String,
			required: required("reservation code"),
			unique: true,
			default: generateCode(10), //when will this function be called? //also, should we ensure unique in db with retry loop?
		},
		name: {
			type: String,
			required: required("reservation name"),
		},
		address: {
			type: String,
			required: required(),
			select: false,
		},
		city: {
			type: String,
			required: required(),
			select: false,
		},
		zip: {
			type: String,
			required: required("zip code"),
			select: false,
		},
		country: {
			type: String,
			required: required(),
			select: false,
		},
		checkin: {
			type: Date,
			required: required("checkin date"),
			cast: "The {PATH} must be a {KIND}",
			// might also validate for future dates, but who says you cannot log reservations retroactively?
		},
		checkout: {
			type: Date,
			required: required("checkout date"),
			cast: "The {PATH} must be a {KIND}",
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
			select: true,
		},
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
		// virtuals: {
		// 	reservation_information: {
		// 		get() {
		// 			return {
		// 				id: this._id,
		// 				checkin: this.checkin,
		// 				checkout: this.checkout,
		// 				room: this.room,
		// 			};
		// 		},
		// 	},
		// },
	}
);

// circular reference if attempting to populate both rooms and reservations
reservationSchema.pre(/^find/, function (next) {
	this.populate({
		path: "room",
		select: "number", // need _id field for populating, but not for display
	});
	next();
});

const Reservation = mongoose.model("Reservation", reservationSchema);

module.exports = Reservation;
