// =====================================================
// ROUTE OPTIMIZATION SERVICE
// Vehicle routing and delivery optimization using nearest neighbor algorithm
// =====================================================

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Optimize delivery route using Nearest Neighbor algorithm
 * @param {Array} deliveries - Array of delivery stops with coordinates
 * @param {Object} depot - Starting location (warehouse/RDC)
 * @returns {Object} Optimized route with sequence and metrics
 */
function optimizeRoute(deliveries, depot) {
    if (!deliveries || deliveries.length === 0) {
        return {
            sequence: [],
            totalDistance: 0,
            estimatedTime: 0,
            route: []
        };
    }

    const unvisited = deliveries.map((d, idx) => ({ ...d, originalIndex: idx }));
    const route = [];
    let currentLocation = depot;
    let totalDistance = 0;

    // Start from depot
    route.push({
        location: 'DEPOT',
        address: depot.address,
        latitude: depot.latitude,
        longitude: depot.longitude,
        distance: 0,
        cumulativeDistance: 0,
        order: 0
    });

    // Nearest neighbor algorithm
    let order = 1;
    while (unvisited.length > 0) {
        let nearestIdx = 0;
        let nearestDistance = Infinity;

        // Find nearest unvisited stop
        unvisited.forEach((stop, idx) => {
            const distance = haversineDistance(
                currentLocation.latitude,
                currentLocation.longitude,
                stop.latitude,
                stop.longitude
            );
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIdx = idx;
            }
        });

        const nextStop = unvisited[nearestIdx];
        totalDistance += nearestDistance;

        route.push({
            deliveryId: nextStop.id,
            orderId: nextStop.order_id,
            address: nextStop.delivery_address,
            latitude: nextStop.latitude,
            longitude: nextStop.longitude,
            distance: nearestDistance,
            cumulativeDistance: totalDistance,
            order: order++,
            stopTime: 5, // minutes
            notes: nextStop.special_instructions
        });

        currentLocation = nextStop;
        unvisited.splice(nearestIdx, 1);
    }

    // Return to depot
    const returnDistance = haversineDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        depot.latitude,
        depot.longitude
    );
    totalDistance += returnDistance;

    route.push({
        location: 'DEPOT_RETURN',
        address: depot.address,
        latitude: depot.latitude,
        longitude: depot.longitude,
        distance: returnDistance,
        cumulativeDistance: totalDistance,
        order: order
    });

    // Calculate estimated time (assuming average speed of 40 km/h + 5 min per stop)
    const stopTime = (deliveries.length * 5); // 5 minutes per stop
    const travelTime = (totalDistance / 40) * 60; // time in minutes
    const estimatedTime = Math.round(travelTime + stopTime);

    return {
        sequence: route.map(r => r.deliveryId).filter(id => id),
        totalDistance: Math.round(totalDistance * 100) / 100,
        totalTime: estimatedTime,
        stops: route.length,
        route: route,
        optimization: {
            algorithm: 'Nearest Neighbor',
            timestamp: new Date()
        }
    };
}

/**
 * Optimize multiple routes for multiple vehicles
 * @param {Array} deliveries - All deliveries to assign
 * @param {Array} vehicles - Available vehicles with capacity
 * @param {Object} depot - Starting depot location
 * @returns {Object} Assignment of deliveries to vehicles with optimized routes
 */
function optimizeMultiVehicleRoute(deliveries, vehicles, depot) {
    if (!deliveries || deliveries.length === 0) {
        return {
            assignments: [],
            totalDistance: 0,
            vehiclesUsed: 0
        };
    }

    const assignments = [];
    let remainingDeliveries = [...deliveries];
    let totalDistance = 0;

    // Sort vehicles by capacity (largest first)
    const sortedVehicles = [...vehicles].sort((a, b) => b.capacity - a.capacity);

    sortedVehicles.forEach((vehicle, vIdx) => {
        if (remainingDeliveries.length === 0) return;

        // Assign deliveries to this vehicle based on capacity
        const vehicleDeliveries = [];
        let weight = 0;

        for (let i = remainingDeliveries.length - 1; i >= 0; i--) {
            const delivery = remainingDeliveries[i];
            const itemWeight = delivery.estimated_weight || 1; // kg

            if (weight + itemWeight <= vehicle.capacity) {
                vehicleDeliveries.push(delivery);
                weight += itemWeight;
                remainingDeliveries.splice(i, 1);
            }
        }

        if (vehicleDeliveries.length > 0) {
            const route = optimizeRoute(vehicleDeliveries, depot);
            totalDistance += route.totalDistance;

            assignments.push({
                vehicleId: vehicle.id,
                vehicleRegistration: vehicle.registration,
                driverId: vehicle.driver_id,
                capacity: vehicle.capacity,
                weightAssigned: weight,
                deliveries: vehicleDeliveries.length,
                route: route
            });
        }
    });

    // Assign remaining deliveries to new routes if needed
    if (remainingDeliveries.length > 0) {
        const route = optimizeRoute(remainingDeliveries, depot);
        totalDistance += route.totalDistance;

        assignments.push({
            vehicleId: null,
            vehicleRegistration: 'PENDING_ASSIGNMENT',
            driverId: null,
            capacity: null,
            weightAssigned: remainingDeliveries.reduce((sum, d) => sum + (d.estimated_weight || 1), 0),
            deliveries: remainingDeliveries.length,
            route: route,
            status: 'PENDING'
        });
    }

    return {
        assignments: assignments,
        totalDistance: Math.round(totalDistance * 100) / 100,
        vehiclesUsed: assignments.filter(a => a.vehicleId).length,
        totalDeliveries: deliveries.length,
        summary: {
            timestamp: new Date(),
            algorithm: 'Multi-Vehicle Nearest Neighbor',
            optimization_level: 'medium'
        }
    };
}

/**
 * Calculate estimated delivery time based on distance and time of day
 * @param {number} distance - Distance in kilometers
 * @param {Date} startTime - When delivery starts
 * @returns {Object} Estimated arrival time and delivery window
 */
function calculateEstimatedDeliveryTime(distance, startTime = new Date()) {
    // Base speed: 40 km/h in traffic
    // Adjusted for time of day
    const hour = startTime.getHours();
    let speedKmh = 40;

    // Rush hour adjustments
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
        speedKmh = 25; // Slower in rush hour
    } else if (hour >= 22 || hour <= 6) {
        speedKmh = 60; // Faster at night
    }

    const travelTimeMinutes = Math.round((distance / speedKmh) * 60);
    const deliveryTime = 15; // minutes per stop
    const totalMinutes = travelTimeMinutes + deliveryTime;

    const estimatedArrival = new Date(startTime.getTime() + totalMinutes * 60000);
    
    return {
        distance: distance,
        travelTimeMinutes: travelTimeMinutes,
        deliveryTimeMinutes: deliveryTime,
        totalTimeMinutes: totalMinutes,
        estimatedArrival: estimatedArrival,
        deliveryWindow: {
            earliest: new Date(startTime.getTime() + (totalMinutes - 30) * 60000),
            latest: new Date(startTime.getTime() + (totalMinutes + 30) * 60000)
        }
    };
}

module.exports = {
    haversineDistance,
    optimizeRoute,
    optimizeMultiVehicleRoute,
    calculateEstimatedDeliveryTime
};
