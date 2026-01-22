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
  dashboardController
} from '../controllers';

const router = express.Router();


// Start
router.get('/', (req, res) => {
  res.send('Hello, and welcome to MONL Autos Management System Backend API.');
});
router.get('/status', appController.getStatus)


// Auth Section
router.post('/auth/login', auth.login)
router.post('/auth/token/refresh', auth.refresh)


// Dashboard Section
router.get('/dashboard', auth.auth, dashboardController.getDashboardData)

// User Section
const userRouter = express.Router();
router.use('/users', userRouter);
userRouter.post('/', auth.auth, userController.createUser)
userRouter.post('/v2', userController.createUserV2) //NEW ROUTE
userRouter.get('/', auth.auth, userController.getUsers)
userRouter.get('/me', auth.auth, userController.getMe)
userRouter.get('/roles', auth.auth, userController.getUserRoles)
userRouter.get('/:id', auth.auth, userController.getUser)


// Customer Section
const customerRouter = express.Router();
router.use('/customers', customerRouter);
customerRouter.post('/', auth.auth, customerController.createCustomer)
customerRouter.get('/', auth.auth, customerController.getCustomers)
customerRouter.post('/report', auth.auth, customerController.getCustomers)
customerRouter.get('/types', auth.auth, customerController.getCustomerTypes)
customerRouter.get('/:id', auth.auth, customerController.getCustomer)
customerRouter.put('/:id', auth.auth, customerController.updateCustomer)
customerRouter.delete('/:id', auth.auth, customerController.deleteCustomer)


// Vehicle Section
const vehicleRouter = express.Router();
router.use('/vehicles', vehicleRouter);
vehicleRouter.post('/', auth.auth, vehicleController.vehicle.createVehicle)
vehicleRouter.get('/', auth.auth, vehicleController.vehicle.getVehicles)
vehicleRouter.post('/report', auth.auth, vehicleController.vehicle.getVehicles)
vehicleRouter.post('/types', auth.auth, vehicleController.vehicleType.createType)
vehicleRouter.get('/types', auth.auth, vehicleController.vehicleType.getTypes)
vehicleRouter.get('/types/:id', auth.auth, vehicleController.vehicleType.getType)
vehicleRouter.put('/types/:id', auth.auth, vehicleController.vehicleType.updateType)
vehicleRouter.delete('/types/:id', auth.auth, vehicleController.vehicleType.deleteType)
vehicleRouter.get('/:id', auth.auth, vehicleController.vehicle.getVehicle)
vehicleRouter.put('/:id/new-owner/:customerID', auth.auth, vehicleController.vehicle.transferVehicleOwnership)
customerRouter.get('/:customerID/vehicles', auth.auth, vehicleController.vehicle.getCustomerVehicles)
customerRouter.get('/:customerID/vehicles/:vehicleID', auth.auth, vehicleController.vehicle.getCustomerVehicle)
customerRouter.put('/:customerID/vehicles/:vehicleID', auth.auth, vehicleController.vehicle.updateCustomerVehicle)
customerRouter.delete('/:customerID/vehicles/:vehicleID', auth.auth, vehicleController.vehicle.deleteCustomerVehicle)
customerRouter.get('/:customerID/jobs', auth.auth, jobController.job.getJobs)


// Job Section
const jobRouter = express.Router();
router.use('/jobs', jobRouter);
jobRouter.post('/', auth.auth, jobController.job.createJob)
jobRouter.get('/', auth.auth, jobController.job.getJobs)
jobRouter.post('/report', auth.auth, jobController.job.getJobs)
jobRouter.get('/types', auth.auth, jobController.job.getJobTypes)
jobRouter.post('/types', auth.auth, jobController.job.createJobType)
jobRouter.patch('/batch-status-update', jobController.job.batchUpdateJobStatus)
jobRouter.get('/report-with-materials', jobController.job.getJobsWithMaterials)
jobRouter.get('/:id', auth.auth, jobController.job.getJob)
jobRouter.put('/:id', auth.auth, jobController.job.updateJob)
jobRouter.delete('/:id', auth.auth, jobController.job.deleteJob)



// Job Type Section (NEW SECTION)
const jobTypeRouter = express.Router();
router.use('/job-types', jobTypeRouter);
jobTypeRouter.post('/', auth.auth, jobController.job.createJobType)
jobTypeRouter.get('/', auth.auth, jobController.job.getJobTypes)
jobTypeRouter.get('/:id', auth.auth, jobController.job.getJobTypeById) // Requires new controller method
jobTypeRouter.put('/:id', auth.auth, jobController.job.updateJobType) // Requires new controller method
jobTypeRouter.delete('/:id', auth.auth, jobController.job.deleteJobType) // Requires new controller method

// Invoice Section
const invoiceRouter = express.Router();
router.use('/invoices', invoiceRouter);
invoiceRouter.post('/', auth.auth, invoiceController.createInvoice)
invoiceRouter.get('/', auth.auth, invoiceController.getInvoices)
invoiceRouter.get('/:id', auth.auth, invoiceController.getInvoice)
invoiceRouter.put('/:id', auth.auth, invoiceController.updateInvoice)
invoiceRouter.delete('/:id', auth.auth, invoiceController.deleteInvoice)
invoiceRouter.patch('/batch-paid', auth.auth, invoiceController.markBatchAsPaid)


// Invoice Section
const estimateRouter = express.Router();
router.use('/estimates', estimateRouter);
estimateRouter.post('/', auth.auth, estimateController.createEstimate)
estimateRouter.get('/', auth.auth, estimateController.getEstimates)
estimateRouter.get('/:id', auth.auth, estimateController.getEstimate)
estimateRouter.put('/:id', auth.auth, estimateController.updateEstimate)
estimateRouter.delete('/:id', auth.auth, estimateController.deleteEstimate)


// Job Material Section
const jobMaterialRouter = express.Router();
router.use('/job-materials', jobMaterialRouter);
jobMaterialRouter.post('/', auth.auth, jobController.jobMaterial.createMaterial)
jobMaterialRouter.get('/', auth.auth, jobController.jobMaterial.getMaterials)
jobMaterialRouter.get('/:id', auth.auth, jobController.jobMaterial.getMaterial)
jobMaterialRouter.put('/:id', auth.auth, jobController.jobMaterial.updateMaterial)
jobMaterialRouter.delete('/:id', auth.auth, jobController.jobMaterial.deleteMaterial)


export default router
