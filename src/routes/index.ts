import express from "express"
import appController from "../controllers/AppController";
import auth from "../controllers/AuthController"
import userController from "../controllers/UserController"


const router = express.Router();

// Start
router.get('/', (req, res) => {
  res.send('Hello, and welcome to MONL Autos Management System Backend API.');
});

router.get('/status', appController.getStatus)

router.post('/auth/login', auth.login)

router.post('/users', auth.auth, userController.createUser)
router.get('/users', auth.auth, userController.getUsers)


export default router
