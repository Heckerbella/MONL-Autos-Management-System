import express from "express"
import appController from "../controllers/AppController";
import auth from "../controllers/AuthController"
import userController from "../controllers/UserController"
import customerController from "../controllers/CustomerController";


const router = express.Router();

// Start
router.get('/', (req, res) => {
  res.send('Hello, and welcome to MONL Autos Management System Backend API.');
});

router.get('/status', appController.getStatus)

// Auth Section
router.post('/auth/login', auth.login)

// Users Section
router.post('/users', auth.auth, userController.createUser)
router.get('/users', auth.auth, userController.getUsers)
router.get('/users/me', auth.auth, userController.getMe)
router.get('/users/:id', auth.auth, userController.getUser)

// Customers Section
router.post('/customers', auth.auth, customerController.createCustomer)
router.get('/customers', auth.auth, customerController.getCustomers)
router.get('/customers/:id', auth.auth, customerController.getCustomer)
router.patch('/customers/:id', auth.auth, customerController.updateCustomer)
router.delete('/customers/:id', auth.auth, customerController.deleteCustomer)


export default router
