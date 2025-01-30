const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/college_events', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Schema Definitions
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['student', 'coordinator'] },
    createdAt: { type: Date, default: Date.now }
});

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    venue: { type: String, required: true },
    category: { 
        type: String, 
        required: true,
        enum: ['academic', 'cultural', 'sports', 'technical']
    },
    coordinator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    maxParticipants: { type: Number, required: true },
    registrations: [{
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        registrationDate: { type: Date, default: Date.now },
        attended: { type: Boolean, default: false }
    }],
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed'],
        default: 'upcoming'
    },
    createdAt: { type: Date, default: Date.now }
});

// Models
const User = mongoose.model('User', userSchema);
const Event = mongoose.model('Event', eventSchema);

// JWT Middleware
const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Routes

// Login Route
app.post('/api/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Find user
        let user = await User.findOne({ email });

        // If user doesn't exist, create new user
        if (!user) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user = await User.create({
                email,
                password: hashedPassword,
                role
            });
        } else {
            // Verify password for existing user
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Invalid credentials' 
                });
            }

            // Verify role matches
            if (user.role !== role) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Invalid role for this account' 
                });
            }
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '24h' }
        );

        res.json({ 
            success: true, 
            token,
            userId: user._id,
            role: user.role
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Get Events Route
app.get('/api/events', authMiddleware, async (req, res) => {
    try {
        const events = await Event.find({
            date: { $gte: new Date() }
        }).sort({ date: 1 });
        
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Error fetching events' });
    }
});

// Create Event Route
app.post('/api/events', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'coordinator') {
            return res.status(403).json({ message: 'Only coordinators can create events' });
        }

        const event = await Event.create({
            ...req.body,
            coordinator: req.user.userId
        });

        res.json({ success: true, event });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ message: 'Error creating event' });
    }
});

// Register for Event Route
app.post('/api/events/:eventId/register', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: 'Only students can register for events' });
        }

        const event = await Event.findById(req.params.eventId);
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if event is full
        if (event.registrations.length >= event.maxParticipants) {
            return res.status(400).json({ message: 'Event is full' });
        }

        // Check if student is already registered
        const alreadyRegistered = event.registrations.some(
            reg => reg.student.toString() === req.user.userId
        );

        if (alreadyRegistered) {
            return res.status(400).json({ message: 'Already registered for this event' });
        }

        // Add registration
        event.registrations.push({
            student: req.user.userId,
            registrationDate: new Date()
        });

        await event.save();
        res.json({ success: true, message: 'Successfully registered for event' });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Error registering for event' });
    }
});

// Get Events by Category
app.get('/api/events/category/:category', authMiddleware, async (req, res) => {
    try {
        const events = await Event.find({ 
            category: req.params.category,
            date: { $gte: new Date() }
        }).sort({ date: 1 });
        
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching events' });
    }
});

// Search Events
app.get('/api/events/search', authMiddleware, async (req, res) => {
    try {
        const searchTerm = req.query.q;
        const events = await Event.find({
            $and: [
                {
                    $or: [
                        { title: { $regex: searchTerm, $options: 'i' } },
                        { description: { $regex: searchTerm, $options: 'i' } }
                    ]
                },
                { date: { $gte: new Date() } }
            ]
        }).sort({ date: 1 });
        
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Error searching events' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});