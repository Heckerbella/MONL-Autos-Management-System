import express from "express"


const router = express.Router();

// Start
router.get('/', (req, res) => {
  res.send('Hello ');
});


export default router
