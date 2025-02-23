const Reservation = require("../models/reservationModel");
const Room = require("../models/roomModel");
const HotelClient = require("../models/hotelClientModel");
const { generateCode } = require("../utilities/helpers");

// use this output formatter to present data in nested form, or use subdocuments in db???
// and there must be a smarter way to rearrange properties hierarchy
// this is probably a bad way to do it...
const formatReservationResponse = (reservationData) => {
	//failed attempt at destructuring assignment
	/*
	const r = {};
	({
		_id: r.id,
		_doc: {
			code: r.code,
			created_at: r.created_at,
			checkin: r.reservation_information.checkin,
			checkout: r.reservation_information.checkout
		},
		client: {
			_doc: { name: r.name },
		},
		room: {
			_id: r.reservation_information.id,
			_doc: { number: r.reservation_information.room.number },
		},
	} = reservationData);
	return r;
	*/

	const res = Object.assign({ id: reservationData._id.toString() }, reservationData._doc);
	res.name = reservationData.client._doc.name;
	res.reservation_information = {
		id: reservationData._id.toString(),
		checkin: reservationData.checkin,
		checkout: reservationData.checkout,
		room: Object.assign({ id: reservationData.room._id.toString() }, reservationData.room._doc),
	};
	//"blacklist" way of picking out fields
	//TODO: switch to whitelist approach using destructuring assignment
	delete res.__v;
	delete res._id;
	delete res.checkin;
	delete res.checkout;
	delete res.client;
	delete res.room;
	delete res.reservation_information.room._id;
	return res;
};

/**
 * Middleware that simply checks for the presence of "name" and "code" in request body
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.checkCredentials = async (req, res, next) => {
	if (req.body?.name && req.body?.code) {
		next();
	} else {
		res.status(401).json({
			error: "Unauthorized",
		});
	}
};

/**
 * Checks if a room with provided ID exists in database
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
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
		/*
			API spec: "Users can specify their name and one of the reservation codes.
				If the name is correct, all reservation are returned."
		*/

		// first lookup reservation with code and check if owner of this reservation matches the name;
		// this populate with match is used to retrieve the client only if the name matches;
		// reservation code duplicates rare but theoretically possible (see code generation in createReservation)
		const resByClient = await Reservation.findOne({ code: code })
			.select("client")
			.populate({ path: "client", match: { name: name } });

		if (!resByClient?.client) {
			res.status(401).json({
				error: "Unauthorized",
			});
			return;
		}

		//finally query all reservations of the same client
		let reservations = await Reservation.find({ client: resByClient.client._id }).select("-__v").sort("checkin").populateRoomInfo().populateClientInfo();
		reservations = reservations.map((reservation) => formatReservationResponse(reservation));
		res.status(200).json({ reservations: reservations });
	} catch (error) {
		console.error(error);

		res.status(500).json({
			error: error,
		});
	}
};

exports.createReservation = async (req, res) => {
	//TODO: run availability check before making reservation (middleware on route?)
	try {
		// better to run req.body validation first and then room lookup;
		// because otherwise lookup is needlessly performed when req.body is invalid anyway
		const validationErrors = new HotelClient(req.body).validateSync();
		if (validationErrors) {
			throw validationErrors;
		}

		const code = req.body?.code;
		// if code is not provided, assume there is no existing identity and create a new client
		// otherwise try to findAndUpdate existing client and abort operation if not found
		// once we have client ID, create reservation
		let clientId;
		if (!code) {
			clientId = (await HotelClient.create(req.body))?._id;
		} else {
			clientId = (await Reservation.findOne({ code: code }).select("client"))?.client?._id;
			if (!clientId) {
				res.status(401).json({
					error: "Unauthorized",
				});
				return;
			}
			await HotelClient.findByIdAndUpdate(clientId, req.body);
		}

		req.body.client = clientId;
		req.body.code = generateCode(10); // could avoid duplicates with retry loop; but is there a need?
		req.body.room = req.params["room_id"];

		const newReservation = await Reservation.create(req.body);
		await newReservation.populateClientInfo();
		await newReservation.populateRoomInfo();
		res.status(201).json({ reservations: [formatReservationResponse(newReservation)] });
	} catch (error) {
		console.error(error);

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

		res.status(500).json({
			error: error,
		});
	}
};

exports.cancelReservation = async (req, res) => {
	const name = req.body?.name; //TODO: check name for extra verification
	const code = req.body?.code;
	const reservationId = req.params["reservation_id"];

	//TODO: rework this procedure to include name check and distinguish error reasons
	//TODO: delete client doc if it no longer has any reservations

	try {
		const deletedRes = await Reservation.findOneAndDelete({ _id: reservationId, code: code });
		if (deletedRes) {
			res.status(204).json({ message: "success" });
			return;
		} else {
			// due to single statement findOneAndDelete, impossible to tell what exactly was wrong
			res.status(404).json({
				error: "A reservation with this ID does not exist", //or possibly, exists but does not match credentials
			});
		}

		const res = await Reservation.findById(reservationId);
	} catch (error) {
		console.error(error);
		res.status(500).json({
			error: error,
		});
	}
};
