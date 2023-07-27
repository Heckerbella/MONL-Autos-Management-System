import express from "express"
import appController from "../controllers/AppController";
import auth from "../controllers/AuthController"
import userController from "../controllers/UserController"


const router = express.Router();

// Start
router.get('/', (req, res) => {
  res.send('Hello ');
});

router.get('/status', appController.getStatus)

router.post('/login', auth.login)

router.post('/user', auth.auth, userController.createUser)


export default router
