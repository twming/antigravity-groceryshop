const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const expressLayouts = require('express-ejs-layouts');
const { body, validationResult } = require('express-validator');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Supabase Setup
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Middleware
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout'); // default layout at views/layout.ejs
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Increased limit for Base64
app.use(session({
    secret: 'grocery-secret',
    resave: false,
    saveUninitialized: true
}));

// Multer setup (keeping it for temporary upload processing)
const storage = multer.memoryStorage(); // Use memory storage
const upload = multer({ storage: storage });

// Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.loggedin) {
        return next();
    }
    res.redirect('/login');
};

// Routes
app.get('/login', (req, res) => {
    res.render('login', { error: null, layout: false });
});

app.post('/login', [
    body('email').isEmail().withMessage('Enter a valid email address')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('login', { error: errors.array()[0].msg, layout: false });
    }

    const { email, password } = req.body;
    if (email === 'test@test.com' && password === 'test') {
        req.session.loggedin = true;
        res.redirect('/');
    } else {
        res.render('login', { error: 'Invalid email or password', layout: false });
    }
});

app.get('/', isAuthenticated, (req, res) => {
    res.render('welcome');
});

app.get('/products', isAuthenticated, async (req, res) => {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching products:', error);
            return res.status(500).send('Error fetching products from Supabase');
        }

        res.render('products', { products });
    } catch (err) {
        console.error('Unexpected error:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/add-product', isAuthenticated, (req, res) => {
    res.render('add-product');
});

app.post('/add-product', isAuthenticated, upload.single('productImage'), async (req, res) => {
    try {
        const { productName } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).send('No image uploaded');
        }

        const base64Data = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

        const { error } = await supabase
            .from('products')
            .insert([{ name: productName || file.originalname, image_data: base64Data }]);

        if (error) {
            console.error('Error saving product:', error);
            return res.status(500).send('Error saving product to Supabase');
        }

        res.redirect('/products');
    } catch (err) {
        console.error('Unexpected error:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
