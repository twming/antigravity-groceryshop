const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const expressLayouts = require('express-ejs-layouts');
const { body, validationResult } = require('express-validator');

const app = express();
const port = 3000;

// Middleware
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout'); // default layout at views/layout.ejs
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'grocery-secret',
    resave: false,
    saveUninitialized: true
}));

// Multer setup for product image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
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
    res.render('login', { error: null, layout: false }); // Login page doesn't use the main layout
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

app.get('/products', isAuthenticated, (req, res) => {
    const imagesDir = path.join(__dirname, 'public/images');
    // Ensure directory exists
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
    }
    fs.readdir(imagesDir, (err, files) => {
        if (err) {
            return res.status(500).send('Unable to scan directory: ' + err);
        }
        const products = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));
        res.render('products', { products });
    });
});

app.get('/add-product', isAuthenticated, (req, res) => {
    res.render('add-product');
});

app.post('/add-product', isAuthenticated, upload.single('productImage'), (req, res) => {
    res.redirect('/products');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
