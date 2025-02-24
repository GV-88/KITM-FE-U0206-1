const Room = require("../models/roomModel");
const Reservation = require("../models/reservationModel");

const formatRoomResponse = (roomData) => {
	const res = Object.assign({ id: roomData._id.toString() }, roomData._doc);
	delete res._id;
	res.capacity = `${roomData.capacity} bed${roomData.capacity > 1 ? "s" : ""}`;
	res.price = `${roomData.price} Eur`;
	res.reservations = roomData.reservations.map((i) => Object.assign({ id: i._id.toString() }, i._doc));
	res.reservations.forEach((i) => {
		delete i._id;
	});
	return res;
};

exports.getRooms = async (req, res) => {
	try {
		let rooms = [];
		const roomId = req.params["room_id"];
		if (roomId) {
			rooms = [await Room.findById(roomId).populateReservations()];
			if (rooms && rooms[0] === null) {
				throw Error("A room with this ID does not exist");
			}
		} else {
			rooms = await Room.find().sort("number").populateReservations(); //API spec says sort by name, there is no such field???
		}
		rooms = rooms.map((room) => formatRoomResponse(room));
		res.status(200).json({ rooms });
	} catch (error) {
		res.status(404).json({
			error: error.message,
		});
	}
};

// this depends on room-reservation relation, cannot implement until virtuals are solved
exports.getAvailableRooms = async (req, res) => {
	const checkinDate = Date.parse(req.params["checkin_date"]);
	const checkoutDate = Date.parse(req.params["checkout_date"]);
	if (isNaN(checkinDate)) {
		res.status(404).json({
			error: "Bad checkin date format or date not provided",
		});
		return;
	}
	if (isNaN(checkoutDate)) {
		res.status(404).json({
			error: "Bad checkout date format or date not provided",
		});
		return;
	}
	if (isNaN(checkinDate) || isNaN(checkoutDate) || checkinDate > checkoutDate) {
		res.status(400).json({
			error: "invalid date range",
		});
		return;
	}

	try {
		// 1. get distinct room IDs of reservations that intersect given date range
		// 2. get all rooms and subtract those found previously
		// not scalable if hotel is large and densely occupied
		// maybe doable in single db request with lookup pipelines
		const occupiedRooms = await Reservation.find({
			$or: [{ checkin: { $gte: checkinDate, $lte: checkoutDate } }, { checkout: { $gte: checkinDate, $lte: checkoutDate } }],
		}).distinct("room");
		const availableRooms = await Room.find({ _id: { $nin: occupiedRooms } }).select("number");

		res.status(200).json({
			rooms: availableRooms.map((room) => ({ id: room.id, number: room.number, availability: true })),
		});
	} catch (error) {
		res.status(400).json({
			error: error.message,
		});
	}
};
