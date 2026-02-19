const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const destinationController = require('../controllers/destinationController');
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Trips
 *   description: Trip management endpoints
 */

// All trip routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /trips:
 *   get:
 *     summary: Get all trips for authenticated user
 *     tags: [Trips]
 *     responses:
 *       200:
 *         description: List of trips
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Trip'
 */
router.get('/', tripController.getAllTrips);

/**
 * @swagger
 * /trips/public:
 *   get:
 *     summary: Get all public trips (excluding current user's trips)
 *     tags: [Trips]
 *     responses:
 *       200:
 *         description: List of public trips
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Trip'
 */
router.get('/public', tripController.getPublicTrips);

/**
 * @swagger
 * /trips/{id}:
 *   get:
 *     summary: Get a single trip by ID
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID
 *     responses:
 *       200:
 *         description: Trip details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trip'
 *       404:
 *         description: Trip not found
 */
router.get('/:id', tripController.getTrip);

/**
 * @swagger
 * /trips:
 *   post:
 *     summary: Create a new trip
 *     tags: [Trips]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - startDate
 *               - endDate
 *             properties:
 *               title:
 *                 type: string
 *                 example: Nepal Adventure
 *               destination:
 *                 type: string
 *                 example: Kathmandu
 *               country:
 *                 type: string
 *                 example: Nepal
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: 2024-03-15
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: 2024-03-25
 *               imageUrl:
 *                 type: string
 *                 example: https://example.com/image.jpg
 *               isPublic:
 *                 type: boolean
 *                 example: false
 *               budget:
 *                 type: number
 *                 example: 2500
 *     responses:
 *       201:
 *         description: Trip created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trip'
 */
router.post('/', tripController.createTrip);

/**
 * @swagger
 * /trips/{id}:
 *   put:
 *     summary: Update a trip
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [planning, traveling, completed]
 *               budget:
 *                 type: number
 *     responses:
 *       200:
 *         description: Trip updated successfully
 */
router.patch('/:id', tripController.updateTrip);
router.put('/:id', tripController.updateTrip);

/**
 * @swagger
 * /trips/{id}:
 *   delete:
 *     summary: Delete a trip
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trip deleted successfully
 */
router.delete('/:id', tripController.deleteTrip);

/**
 * @swagger
 * /trips/{id}/share:
 *   post:
 *     summary: Toggle trip public sharing
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sharing status updated
 */
router.post('/:id/share', tripController.shareTrip);

/**
 * @swagger
 * /trips/{id}/itinerary:
 *   get:
 *     summary: Get trip itinerary
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of itinerary stops
 */
router.get('/:id/itinerary', destinationController.getDestinations);

/**
 * @swagger
 * /trips/{id}/itinerary:
 *   post:
 *     summary: Add itinerary stop
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               activity:
 *                 type: string
 *               time:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Itinerary stop added
 */
router.post('/:id/itinerary', destinationController.createDestination);

// Update and delete individual itinerary stops
router.patch('/destinations/:id', destinationController.updateDestination);
router.delete('/destinations/:id', destinationController.deleteDestination);

/**
 * @swagger
 * /trips/{id}/expenses:
 *   get:
 *     summary: Get trip expenses
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of expenses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Expense'
 */
router.get('/:id/expenses', expenseController.getExpenses);

/**
 * @swagger
 * /trips/{id}/expenses:
 *   post:
 *     summary: Add expense to trip
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - item
 *               - amount
 *               - category
 *             properties:
 *               item:
 *                 type: string
 *                 example: Hotel Booking
 *               amount:
 *                 type: number
 *                 example: 150.50
 *               category:
 *                 type: string
 *                 enum: [accommodation, food, transportation, activities, shopping, other]
 *                 example: accommodation
 *     responses:
 *       201:
 *         description: Expense added successfully
 */
router.post('/:id/expenses', expenseController.createExpense);

/**
 * @swagger
 * /trips/{id}/invite:
 *   post:
 *     summary: Invite user to collaborate on trip
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [editor, viewer]
 *     responses:
 *       200:
 *         description: User invited successfully
 */
router.post('/:id/invite', tripController.inviteUser);

router.post('/:id/request-join', tripController.requestJoinTrip);
router.post('/:id/accept-request/:userId', tripController.acceptJoinRequest);
router.post('/:id/reject-request/:userId', tripController.rejectJoinRequest);
router.delete('/:id/collaborators/:userId', tripController.removeCollaborator);
router.get('/:id/activities', tripController.getActivities);
router.get('/search/users', tripController.searchUsers);

module.exports = router;

