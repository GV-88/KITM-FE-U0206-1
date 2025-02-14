const Room = require("../models/roomModel");

const formatRoomResponse = (roomData) => {
	const res = Object.assign({ id: roomData._id.toString() }, roomData._doc);
	delete res._id;
	res.capacity = `${roomData.capacity} bed${roomData.capacity > 1 ? "s" : ""}`;
	res.price = `${roomData.price} Eur`;
	return res;
};

exports.getAllRooms = async (req, res) => {
	try {
		let rooms = await Room.find();
		rooms = rooms.map((room) => formatRoomResponse(room));
		res.status(200).json({ rooms });
	} catch (error) {
		res.status(404).json({
			message: error,
		});
	}
};

//API spec describes single room response body in array form, is that by design?

exports.getSingleRoom = async (req, res) => {
	try {
		let room = await Room.findById(req.params.id);
		room = formatRoomResponse(room);
		res.status(200).json({ room });
	} catch (error) {
		res.status(404).json({
			message: error,
		});
	}
};
