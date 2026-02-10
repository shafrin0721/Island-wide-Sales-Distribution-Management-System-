// Delivery Routes with JWT Authentication
const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');

// Get delivery staff profile
router.get('/profile', verifyToken, checkRole('DELIVERY'), (req, res) => {
  try {
    // In production, fetch from database
    // For demo, return mock data
    const deliveryProfile = {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      vehicle: req.user.vehicle,
      licensePlate: req.user.licensePlate,
      status: req.user.status || 'available',
      rating: req.user.rating || 0,
      completedDeliveries: req.user.completedDeliveries || 0,
      totalDeliveries: req.user.totalDeliveries || 0,
      locationSharing: req.user.locationSharing !== false
    };

    res.json(deliveryProfile);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Unable to load profile' });
  }
});

// Update delivery staff profile
router.put('/profile', verifyToken, checkRole('DELIVERY'), (req, res) => {
  try {
    const { name, phone, vehicle, licensePlate, status, locationSharing } = req.body;

    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required' });
    }

    // In production, update database
    const updatedProfile = {
      id: req.user.id,
      name,
      email: req.user.email,
      phone,
      vehicle: vehicle || '',
      licensePlate: licensePlate || '',
      status: status || 'available',
      locationSharing: locationSharing !== false
    };

    res.json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Unable to update profile' });
  }
});

// Get delivery assignments
router.get('/deliveries', verifyToken, checkRole('DELIVERY'), (req, res) => {
  try {
    // In production, fetch from database filtered by delivery staff ID
    const deliveries = [
      {
        id: 1,
        orderId: 'ORD-001',
        customer: 'John Doe',
        address: '123 Main St',
        status: 'pending',
        distance: 5.2,
        estimatedTime: '30 min'
      }
    ];

    res.json(deliveries);
  } catch (error) {
    console.error('Deliveries fetch error:', error);
    res.status(500).json({ message: 'Unable to load deliveries' });
  }
});

// Update delivery status
router.put('/deliveries/:id', verifyToken, checkRole('DELIVERY'), (req, res) => {
  try {
    const { status } = req.body;
    const deliveryId = req.params.id;

    if (!['pending', 'in_transit', 'delivered', 'failed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // In production, update database
    res.json({
      message: 'Delivery status updated',
      deliveryId,
      status
    });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ message: 'Unable to update status' });
  }
});

module.exports = router;
