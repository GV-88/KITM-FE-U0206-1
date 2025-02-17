const Reservation = require("../models/reservationModel");
const Room = require("../models/roomModel");
const { generateCode } = require("../utilities/helpers");

// use this output formatter to present data in nested form, or use subdocuments in db???
// and there must be a smarter way to rearrange properties hierarchy
// this is probably a bad way to do it...
const formatReservationResponse = (reservationData) => {
	const res = Object.assign({ id: reservationData._id.toString() }, reservationData._doc);
	res.reservation_information = {
		id: reservationData._id.toString(),
		checkin: reservationData.checkin,
		checkout: reservationData.checkout,
		room: Object.assign({ id: reservationData.room._id.toString() }, reservationData.room._doc),
	};
	delete res._id;
	delete res.__v;
	delete res.checkin;
	delete res.checkout;
	delete res.room;
	delete res.reservation_information.room._id;
	return res;
};

exports.checkCredentials = async (req, res, next) => {
	if (req.body?.name && req.body?.code) {
		next();
	} else {
		res.status(401).json({
			error: "Unauthorized",
		});
	}
};

exports.checkRoom = async (req, res, next) => {
	//this throws CastError if id is not in perfect format
	const room = await Room.findById(req.params["room_id"]).select({ _id: 1 }).lean();
	if (room) {
		next();
	} else {
		res.status(404).json({
			error: "A room with this ID does not exist",
		});
	}
};

exports.getReservations = async (req, res) => {
	const name = req.body?.name;
	const code = req.body?.code;
	try {
		// seems that code is required, according to API spec
		// but not exactly clear if the code should be used for filtering,
		//  or any matching code is enough to access all reservations with the same name?
		// the latter seems illogical because the name can coincide for different clients;
		// but then again, what would be the point of listing multiple reservations if only one code matches?
		/*
			API spec: "Users can specify their name and one of the reservation codes.
				If the name is correct, all reservation are returned."
			This would maybe make sense if name was unique,
				because otherwise with one of my own codes I could possibly access someone else's codes;
				But it cannot be unique because the listing wouldn't work
			HOW DOES IT WORK???
		*/
		let reservations = await Reservation.find({ name: name, code: code }).sort("checkin");
		reservations = reservations.map((reservation) => formatReservationResponse(reservation));
		res.status(200).json({ reservations: reservations });
	} catch (error) {
		res.status(400).json({
			error: error,
		});
	}
};

exports.createReservation = async (req, res) => {
	//TODO: run availability check before making reservation (middleware on route?)
	try {
		// better to run req.body validation first and then room lookup;
		// because otherwise lookup is needlessly performed when req.body is invalid anyway
		const validationErrors = new Reservation(req.body).validateSync(undefined, { pathsToSkip: ["room", "code"] });
		if (validationErrors) {
			throw validationErrors;
		}

		req.body.code = generateCode(10);
		req.body.room = req.params["room_id"];

		const newReservation = await Reservation.create(req.body);
		res.status(201).json({ reservations: [formatReservationResponse(newReservation)] });
	} catch (error) {
		if (error?.errors) {
			let validationErrors = {};
			for (val of Object.values(error.errors)) {
				if (["ValidatorError", "CastError"].includes(val?.name)) {
					validationErrors[val?.path] = val?.message;
				}
			}

			if (Object.keys(validationErrors).length) {
				res.status(422).json({
					error: "Validation failed",
					fields: validationErrors,
				});
				return;
			}
		}

		res.status(400).json({
			error: error,
		});
	}
};

exports.cancelReservation = async (req, res) => {
	const name = req.body?.name;
	const code = req.body?.code;
	const reservationId = req.params["reservation_id"];

	try {
		const deletedRes = await Reservation.findOneAndDelete({ _id: reservationId, name: name, code: code });
		if (deletedRes) {
			//why does this end up in 400???
			res.status(204).json({ message: success });
			return;
		} else {
			res.status(404).json({
				error: "A reservation with this ID does not exist", //or possibly, exists but does not match credentials
			});
		}
	} catch (error) {
		res.status(400).json({
			error: error,
		});
	}
};
