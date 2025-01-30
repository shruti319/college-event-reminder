const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = express();

// Middleware
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
});

// Models
const User = mongoose.model('User', {
    email: String,
    password: String,
    role: String
});

// Auth Middleware - Define this BEFORE using it in routes
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, 'your_jwt_secret');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Routes
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

app.post('/api/login', async (req, res) => {
    try {
        // Find the user
        let user = await User.findOne({ email: req.body.email });
        if (!user) {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            user = await User.create({
                email: req.body.email,
                password: hashedPassword,
                role: req.body.role
            });
        } else {
            const validPassword = await bcrypt.compare(req.body.password, user.password);
            if (!validPassword) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
        }
        app.post('/api/events', authMiddleware, async (req, res) => {
            try {
                if (req.user.role !== 'coordinator') {
                    return res.status(403).json({ message: 'Only coordinators can create events' });
                }
        
                const event = await Event.create({
                    title: req.body.title,
                    description: req.body.description,
                    date: req.body.date,
                    time: req.body.time,
                    coordinator: req.user.userId,
                    maxParticipants: req.body.maxParticipants,
                    venue: req.body.venue,
                    category: req.body.category
                });
        
                res.json({ success: true, event });
            } catch (error) {
                res.status(500).json({ message: 'Failed to create event' });
            }
        });

// server.js - Add registration route
app.post('/api/events/:eventId/register', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: 'Only students can register' });
        }

        const event = await Event.findById(req.params.eventId);
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.registrations.length >= event.maxParticipants) {
            return res.status(400).json({ message: 'Event is full' });
        }

        const alreadyRegistered = event.registrations.some(
            reg => reg.student.toString() === req.user.userId
        );

        if (alreadyRegistered) {
            return res.status(400).json({ message: 'Already registered' });
        }

        event.registrations.push({
            student: req.user.userId,
            registrationDate: new Date()
        });

        await event.save();
        res.json({ success: true, message: 'Registration successful' });
    } catch (error) {
        res.status(500).json({ message: 'Registration failed' });
    }
});
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            'your_jwt_secret',
            { expiresIn: '24h' }
        );

        res.json({ success: true, token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Protected route - uses authMiddleware
app.get('/api/events', authMiddleware, async (req, res) => {
    try {
        const eventsCount = await Event.countDocuments();
        if (eventsCount === 0) {
            await Event.create([
                {
                    title: 'Tech Seminar',
                    description: 'Learn about latest technologies',
                    date: new Date('2024-02-15'),
                    time: '14:00',
                },
                {
                    title: 'Cultural Fest',
                    description: 'Annual cultural festival',
                    date: new Date('2024-02-20'),
                    time: '10:00',
                }
            ]);
        }

        const events = await Event.find();
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

const Event = mongoose.model('Event', {
    title: String,
    description: String,
    date: Date,
    time: String,
    coordinator: mongoose.Schema.Types.ObjectId,
    venue: String,
    category: String,
    maxParticipants: Number,
    registrations: [{
        student: mongoose.Schema.Types.ObjectId,
        registrationDate: Date,
        attended: { type: Boolean, default: false }
    }],
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed'],
        default: 'upcoming'
    }
});

// Create a notification helper
const sendNotification = async (userId, title, message) => {
    try {
        await Notification.create({
            user: userId,
            title,
            message,
            createdAt: new Date()
        });
        
        // For web notifications
        const user = await User.findById(userId);
        // Implement WebSocket or Server-Sent Events here
    } catch (error) {
        console.error('Notification error:', error);
    }
};

// Schedule reminders for events
const scheduleEventReminder = async (event) => {
    const reminderTime = new Date(event.date);
    reminderTime.setHours(reminderTime.getHours() - 1);

    const currentTime = new Date();
    const timeUntilReminder = reminderTime - currentTime;

    if (timeUntilReminder > 0) {
        setTimeout(async () => {
            for (const registration of event.registrations) {
                await sendNotification(
                    registration.student,
                    'Event Reminder',
                    `${event.title} starts in 1 hour at ${event.venue}`
                );
            }
        }, timeUntilReminder);
    }
};