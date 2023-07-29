import express from "express"
import appController from "../controllers/AppController";
import auth from "../controllers/AuthController"
import userController from "../controllers/UserController"
import customerController from "../controllers/CustomerController";
import vehicleController from "../controllers/VehicleController";


const router = express.Router();

// Start
router.get('/', (req, res) => {
  res.send('Hello, and welcome to MONL Autos Management System Backend API.');
});

router.get('/status', appController.getStatus)

// Auth Section
router.post('/auth/login', auth.login)

// User Section
const userRouter = express.Router();
router.use('/users', userRouter);
userRouter.post('/', auth.auth, userController.createUser)
userRouter.get('/', auth.auth, userController.getUsers)
userRouter.get('/me', auth.auth, userController.getMe)
userRouter.get('/:id', auth.auth, userController.getUser)

// Customer Section
const customerRouter = express.Router();
router.use('/customers', customerRouter);
customerRouter.post('/', auth.auth, customerController.createCustomer)
customerRouter.get('/', auth.auth, customerController.getCustomers)
customerRouter.get('/:id', auth.auth, customerController.getCustomer)
customerRouter.patch('/:id', auth.auth, customerController.updateCustomer)
customerRouter.delete('/:id', auth.auth, customerController.deleteCustomer)

// Vehicle Section
const vehicleRouter = express.Router();
router.use('/vehicles', vehicleRouter);
vehicleRouter.post('/', auth.auth, vehicleController.createVehicle)
vehicleRouter.get('/', auth.auth, vehicleController.getVehicles)
vehicleRouter.get('/:id', auth.auth, vehicleController.getVehicle)
customerRouter.get('/:customerID/vehicles', auth.auth, vehicleController.getCustomerVehicles)
customerRouter.get('/:customerID/vehicles/:vehicleID', auth.auth, vehicleController.getCustomerVehicle)
customerRouter.patch('/:customerID/vehicles/:vehicleID', auth.auth, vehicleController.updateCustomerVehicle)
customerRouter.delete('/:customerID/vehicles/:vehicleID', auth.auth, vehicleController.deleteCustomerVehicle)


export default router
