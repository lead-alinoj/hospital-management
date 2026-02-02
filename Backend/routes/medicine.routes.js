const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicine.controller');

router.post('/', medicineController.createMedicine);

router.get('/search', medicineController.searchMedicines);
router.get('/low-stock', medicineController.getLowStockMedicines);
router.get('/available', medicineController.getAvailableMedicines);

router.get('/', medicineController.getMedicines);
router.get('/:id', medicineController.getMedicineById);
router.get('/doctor/medicines', medicineController.getDoctorMedicines);
// Add this route
router.get('/all-for-ip', medicineController.getAllItemsForIP);
router.put('/:id', medicineController.updateMedicine);
router.patch('/:id/stock', medicineController.updateStock);
router.delete('/:id', medicineController.deleteMedicine);


module.exports = router;