const path = require('path');
const fs = require('fs');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname)));
app.use(express.urlencoded({ extended: true }));

// Configure express-ejs-layouts for template inheritance
const expressEjsLayouts = require('express-ejs-layouts');
app.use(expressEjsLayouts);
app.set('layout', 'layout');

const pageRoutes = [
    'blogs',
    'contact',
    'disclaimer',
    'login',
    'privacy-policy',
    'terms-and-conditions',
    'yearsChart'
];

app.get('/', (req, res) => {
    res.render('index');
});

pageRoutes.forEach((page) => {
    app.get(`/${page}`, (req, res) => {
        res.render(page);
    });
});

app.get('/chart-2026/:chartPage', (req, res) => {
    const chartPage = req.params.chartPage;
    const chartPath = path.join(__dirname, 'views', 'chart-2026', `${chartPage}.ejs`);

    if (!fs.existsSync(chartPath)) {
        return res.status(404).send('Chart page not found');
    }

    res.render(path.join('chart-2026', chartPage));
});

app.post('/gameYearResults', (req, res) => {
    const game = req.body.gLinkName;
    const year = req.body.year;

    if (!game) {
        return res.redirect('/');
    }

    const target = `/chart-2026/${game}`;
    return res.redirect(target);
});

app.use((req, res) => {
    res.status(404).send('Page not found');
});

app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});
