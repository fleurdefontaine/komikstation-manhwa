const express = require("express");
const router = express.Router();
const manhwaController = require("../controllers/manhwaController");

const handleRoute = (routeFn) => async (req, res) => {
  try {
    const result = await routeFn(req);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({ message: error.message });
  }
};

router.get("/popular", handleRoute(manhwaController.getPopular));
router.get("/new", handleRoute(manhwaController.getNew));
router.get("/genre/:genre", handleRoute(manhwaController.getByGenre));
router.get("/search/:query", handleRoute(manhwaController.search));
router.get('/manhwa-detail/:query', handleRoute(manhwaController.getManhwaDetail));
router.get('/manhwa-ongoing', handleRoute(manhwaController.getOngoing));

module.exports = router;