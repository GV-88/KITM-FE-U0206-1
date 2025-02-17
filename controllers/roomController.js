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
	try {
		let rooms = [];
		const roomId = req.params["room_id"];
		if (roomId) {
			rooms = [await Room.findById(roomId)];
			if (rooms && rooms[0] === null) {
				throw Error("A room with this ID does not exist");
			}
		} else {
			rooms = await Room.find().sort("number"); //API spec says sort by name, there is no such field???
		}
		rooms = rooms.map((room) => formatRoomResponse(room));
		res.status(200).json({ rooms });
	} catch (error) {
		res.status(404).json({
			error: error.message,
		});
	}
};
