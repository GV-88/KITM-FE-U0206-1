const express = require("express");
const reservationController = require("../controllers/reservationController");

const router = express.Router();

router.route("/").post(reservationController.checkCredentials, reservationController.getReservations);
router.route("/:reservation_id/cancel").post(reservationController.checkCredentials, reservationController.cancelReservation);

module.exports = router;
