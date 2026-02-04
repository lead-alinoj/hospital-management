const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicine.controller');
const { protect } = require('../middleware/auth');

router.post('/', medicineController.createMedicine);

router.get('/search', medicineController.searchMedicines);
router.get('/low-stock', medicineController.getLowStockMedicines);
router.get('/available', medicineController.getAvailableMedicines);

router.get('/billable-items', protect, medicineController.getBillableItems);
router.get('/reception-ip', medicineController.getBillableItems);

// ✅ FIXED ORDER
router.get('/doctor/medicines', medicineController.getDoctorMedicines);
router.get('/all-for-ip', medicineController.getAllItemsForIP);

router.get('/', medicineController.getMedicines);

// ✅ ALWAYS LAST
router.get('/:id', medicineController.getMedicineById);

router.put('/:id', medicineController.updateMedicine);
router.patch('/:id/stock', medicineController.updateStock);
router.delete('/:id', medicineController.deleteMedicine);

module.exports = router;
