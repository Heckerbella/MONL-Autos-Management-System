import express from "express"
import { 
  appController, 
  auth, 
  userController, 
  customerController,
  vehicleController,
  jobController,
  invoiceController,
  estimateController,
} from '../controllers';

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
userRouter.get('/roles', auth.auth, userController.getUserRoles)
userRouter.get('/:id', auth.auth, userController.getUser)


// Customer Section
const customerRouter = express.Router();
router.use('/customers', customerRouter);
customerRouter.post('/', auth.auth, customerController.createCustomer)
customerRouter.get('/', auth.auth, customerController.getCustomers)
customerRouter.get('/types', auth.auth, customerController.getCustomerTypes)
customerRouter.get('/:id', auth.auth, customerController.getCustomer)
customerRouter.patch('/:id', auth.auth, customerController.updateCustomer)
customerRouter.delete('/:id', auth.auth, customerController.deleteCustomer)


// Vehicle Section
const vehicleRouter = express.Router();
router.use('/vehicles', vehicleRouter);
vehicleRouter.post('/', auth.auth, vehicleController.createVehicle)
vehicleRouter.get('/', auth.auth, vehicleController.getVehicles)
vehicleRouter.get('/types', auth.auth, vehicleController.getVehicleTypes)
vehicleRouter.get('/:id', auth.auth, vehicleController.getVehicle)
customerRouter.get('/:customerID/vehicles', auth.auth, vehicleController.getCustomerVehicles)
customerRouter.get('/:customerID/vehicles/:vehicleID', auth.auth, vehicleController.getCustomerVehicle)
customerRouter.patch('/:customerID/vehicles/:vehicleID', auth.auth, vehicleController.updateCustomerVehicle)
customerRouter.delete('/:customerID/vehicles/:vehicleID', auth.auth, vehicleController.deleteCustomerVehicle)


// Job Section
const jobRouter = express.Router();
router.use('/jobs', jobRouter);
jobRouter.post('/', auth.auth, jobController.job.createJob)
jobRouter.get('/', auth.auth, jobController.job.getJobs)
jobRouter.get('/types', auth.auth, jobController.job.getJobTypes)
jobRouter.get('/:id', auth.auth, jobController.job.getJob)
jobRouter.patch('/:id', auth.auth, jobController.job.updateJob)
jobRouter.delete('/:id', auth.auth, jobController.job.deleteJob)


// Invoice Section
const invoiceRouter = express.Router();
router.use('/invoices', invoiceRouter);
invoiceRouter.post('/', auth.auth, invoiceController.createInvoice)
invoiceRouter.get('/', auth.auth, invoiceController.getInvoices)
invoiceRouter.get('/:id', auth.auth, invoiceController.getInvoice)
invoiceRouter.patch('/:id', auth.auth, invoiceController.updateInvoice)
invoiceRouter.delete('/:id', auth.auth, invoiceController.deleteInvoice)


// Invoice Section
const estimateRouter = express.Router();
router.use('/estimates', estimateRouter);
estimateRouter.post('/', auth.auth, estimateController.createEstimate)
estimateRouter.get('/', auth.auth, estimateController.getEstimates)
estimateRouter.get('/:id', auth.auth, estimateController.getEstimate)
estimateRouter.patch('/:id', auth.auth, estimateController.updateEstimate)
estimateRouter.delete('/:id', auth.auth, estimateController.deleteEstimate)


// Job Material Section
const jobMaterialRouter = express.Router();
router.use('/job-materials', jobMaterialRouter);
jobMaterialRouter.post('/', auth.auth, jobController.jobMaterial.createMaterial)
jobMaterialRouter.get('/', auth.auth, jobController.jobMaterial.getMaterials)
jobMaterialRouter.get('/:id', auth.auth, jobController.jobMaterial.getMaterial)
jobMaterialRouter.patch('/:id', auth.auth, jobController.jobMaterial.updateMaterial)
jobMaterialRouter.delete('/:id', auth.auth, jobController.jobMaterial.deleteMaterial)


export default router
