const Room = require("../models/roomModel");

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
	//really this should be defined in model statics (but I cannot get it to work)
	async function populateReservations(obj) {
		return obj.populate({
			path: "reservations",
			select: "_id checkin checkout -created_at -room",
		});
	}

	try {
		let rooms = [];
		const roomId = req.params["room_id"];
		if (roomId) {
			rooms = [await populateReservations(Room.findById(roomId))];
			if (rooms && rooms[0] === null) {
				throw Error("A room with this ID does not exist");
			}
		} else {
			rooms = await populateReservations(Room.find()).sort("number"); //API spec says sort by name, there is no such field???
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
exports.checkAvailability = async (req, res, next) => {
	try {
		// objective: find rooms that do not have reservations with intersecting dates
		// rooms without any reservations are clear
		// will need at some point to populate reservations to then be able to filter rooms by dates
		// mongoose docs: "Paths are populated after the query executes and a response is received"
		// so it seems the narrowing won't be done entirely on db end, will have to download intermediary results

		throw new Error("not implemented yet");
		if (typeof next === "function") {
			next();
		}
	} catch (error) {
		res.status(400).json({
			error: error.message,
		});
	}
};
