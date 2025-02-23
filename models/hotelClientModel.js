const mongoose = require("mongoose");

const required = (fieldName = "{PATH}") => {
	return [true, `${fieldName} is required`];
};

const hotelClientSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: required("client name"),
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
		created_at: {
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

const HotelClient = mongoose.model("HotelClient", hotelClientSchema);

module.exports = HotelClient;
