const express = require("express");
const roomController = require("../controllers/roomController");
const reservationController = require("../controllers/reservationController");

const router = express.Router();

router.route("/").get(roomController.getAllRooms);
router.route("/:room_id").get(roomController.getSingleRoom);
router.route("/availability/checkin/:checkin_date/checkout/:checkout_date").get(reservationController.checkAvailability);
router.route("/:room_id/reservation").post(/*reservationController.checkAvailability,*/ reservationController.createReservation);

module.exports = router;
