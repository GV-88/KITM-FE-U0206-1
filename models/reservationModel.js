const mongoose = require("mongoose");
// const dayjs = require("dayjs");
const { generateCode } = require("../utilities/helpers");

const required = (fieldName = "{PATH}") => {
	return [true, `${fieldName} is required`];
};

const populateRoomInfo = (obj) => {
	//returns obj (chainable when wrapped with "this")
	return obj.populate({
		path: "room",
		select: "number",
	});
};

const populateClientInfo = (obj) => {
	//returns obj (chainable when wrapped with "this")
	return obj.populate({
		path: "client",
		select: "name",
	});
};

// there is reason to store reservations as subdocs within HotelClient;
// that would prevent anomalous orphan reservations, like SQL cascade does;
// on the other hand, there is need to query reservations independently from clients;
const reservationSchema = new mongoose.Schema(
	{
		client: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "HotelClient",
			required: [true, "reservation must be connected to a client"],
			select: false,
		},
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
		// methods can be used on a document object
		methods: {
			populateRoomInfo() {
				return populateRoomInfo(this);
			},
			populateClientInfo() {
				return populateClientInfo(this);
			},
		},
		// query helpers can be used on a query chain
		query: {
			populateRoomInfo() {
				return populateRoomInfo(this);
			},
			populateClientInfo() {
				return populateClientInfo(this);
			},
		},
	}
);

const Reservation = mongoose.model("Reservation", reservationSchema);

module.exports = Reservation;
