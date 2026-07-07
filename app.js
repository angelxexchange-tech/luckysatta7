const path = require('path');
const fs = require('fs');
const express = require('express');
require('dotenv').config();
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
    'yearsChart',
    'mostfrequent'
];

app.get('/', async (req, res) => {
    try {
        const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api';
        
        const [upcomingRes, gr1Res, gr2Res, gamesRes, gr1MonthlyRes, gr2MonthlyRes, adsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/upcoming`),
            fetch(`${API_BASE_URL}/group/name/gr1`),
            fetch(`${API_BASE_URL}/group/name/gr2`),
            fetch(`${API_BASE_URL}/games`),
            fetch(`${API_BASE_URL}/group/name/gr1/monthly`),
            fetch(`${API_BASE_URL}/group/name/gr2/monthly`),
            fetch(`${API_BASE_URL}/ads`)
        ]);
        
        const upcomingData = upcomingRes.ok ? await upcomingRes.json() : { cards: [] };
        const gr1Data = gr1Res.ok ? await gr1Res.json() : { games: [] };
        const gr2Data = gr2Res.ok ? await gr2Res.json() : { games: [] };
        const allGames = gamesRes.ok ? await gamesRes.json() : [];
        const gr1MonthlyData = gr1MonthlyRes.ok ? await gr1MonthlyRes.json() : { tableData: [] };
        const gr2MonthlyData = gr2MonthlyRes.ok ? await gr2MonthlyRes.json() : { tableData: [] };
        const adsData = adsRes.ok ? await adsRes.json() : [];

        res.render('index', {
            upcomingCards: upcomingData.cards || [],
            gr1Games: gr1Data.games || [],
            gr2Games: gr2Data.games || [],
            allGames: allGames || [],
            gr1MonthlyData: gr1MonthlyData || { tableData: [] },
            gr2MonthlyData: gr2MonthlyData || { tableData: [] },
            ads: adsData || []
        });
    } catch (err) {
        console.error("Error fetching data for index page:", err);
        // Fallback to empty data to not break the UI
        res.render('index', {
            upcomingCards: [],
            gr1Games: [],
            gr2Games: [],
            allGames: [],
            gr1MonthlyData: { tableData: [] },
            gr2MonthlyData: { tableData: [] },
            ads: []
        });
    }
});

pageRoutes.forEach((page) => {
    app.get(`/${page}`, (req, res) => {
        res.render(page);
    });
});

app.get('/chart-2026/:chartPage', async (req, res) => {
    const chartPage = req.params.chartPage;
    const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api';
    
    try {
        // Fetch all games to find the matching DB name
        const gamesRes = await fetch(`${API_BASE_URL}/games`);
        const gamesData = gamesRes.ok ? await gamesRes.json() : [];
        
        let targetGame = null;
        for (const game of gamesData) {
            const slug = game.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            if (`${slug}-satta-result` === chartPage) {
                targetGame = game.name;
                break;
            }
        }
        
        if (!targetGame) {
            return res.status(404).send('Chart page not found');
        }
        
        const currentYear = new Date().getFullYear();
        const chartRes = await fetch(`${API_BASE_URL}/charts/yearly/${encodeURIComponent(targetGame)}?year=${currentYear}`);
        const chartDataResponse = chartRes.ok ? await chartRes.json() : null;
        const chartData = chartDataResponse ? chartDataResponse.data : null;
        
        res.render('dynamicChart', { 
            gameName: targetGame,
            currentYear: currentYear,
            chartData: chartData 
        });
    } catch (err) {
        console.error("Error fetching chart data:", err);
        res.status(500).send('Internal Server Error');
    }
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
