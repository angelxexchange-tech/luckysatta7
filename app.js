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

app.use(async (req, res, next) => {
    try {
        let pagePath = req.path;
        if (pagePath === '/') {
            pagePath = '/home';
        }
        
        const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api';
        const site = 'lucky-satta7.com';
        
        const seoRes = await fetch(`${API_BASE_URL}/seo/get?page=${encodeURIComponent(pagePath)}&site=${encodeURIComponent(site)}`);
        if (seoRes.ok) {
            res.locals.seo = await seoRes.json();
        } else {
            res.locals.seo = null;
        }
    } catch (err) {
        console.error("SEO fetch error:", err);
        res.locals.seo = null;
    }
    next();
});

const pageRoutes = [
    'blogs',
    'contact',
    'disclaimer',
    'login',
    'privacy-policy',
    'terms-and-conditions'
];

app.get('/mostfrequent', async (req, res) => {
    try {
        const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api';
        const gameParam = req.query.game ? `?game=${encodeURIComponent(req.query.game)}` : '';
        const freqRes = await fetch(`${API_BASE_URL}/charts/frequent/current${gameParam}`);
        const freqData = freqRes.ok ? await freqRes.json() : { frequentNumbers: [] };
        
        res.render('mostfrequent', { 
            frequentNumbers: freqData.frequentNumbers || [],
            game: req.query.game || null
        });
    } catch (err) {
        console.error("Error fetching frequent numbers:", err);
        res.render('mostfrequent', { frequentNumbers: [] });
    }
});

app.get('/yearsChart', async (req, res) => {
    try {
        const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api';
        const gamesRes = await fetch(`${API_BASE_URL}/games`);
        const allGames = gamesRes.ok ? await gamesRes.json() : [];
        res.render('yearsChart', { allGames, currentYear: new Date().getFullYear() });
    } catch (err) {
        console.error("Error fetching games for yearsChart:", err);
        res.render('yearsChart', { allGames: [], currentYear: new Date().getFullYear() });
    }
});

app.get('/', async (req, res) => {
    try {
        const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api';
        
        const [upcomingRes, gr1Res, gr2Res, gamesRes, gr1MonthlyRes, gr2MonthlyRes, adsRes, kalyanKingRes] = await Promise.all([
            fetch(`${API_BASE_URL}/upcoming`),
            fetch(`${API_BASE_URL}/group/name/gr1`),
            fetch(`${API_BASE_URL}/group/name/gr2`),
            fetch(`${API_BASE_URL}/games`),
            fetch(`${API_BASE_URL}/group/name/gr1/monthly`),
            fetch(`${API_BASE_URL}/group/name/gr2/monthly`),
            fetch(`${API_BASE_URL}/ads?site=lucky-satta7.com`),
            fetch(`${API_BASE_URL}/result/KALYAN%20KING`)
        ]);
        
        const upcomingData = upcomingRes.ok ? await upcomingRes.json() : { cards: [] };
        const gr1Data = gr1Res.ok ? await gr1Res.json() : { games: [] };
        const gr2Data = gr2Res.ok ? await gr2Res.json() : { games: [] };
        const allGames = gamesRes.ok ? await gamesRes.json() : [];
        const gr1MonthlyData = gr1MonthlyRes.ok ? await gr1MonthlyRes.json() : { tableData: [] };
        const gr2MonthlyData = gr2MonthlyRes.ok ? await gr2MonthlyRes.json() : { tableData: [] };
        const adsData = adsRes.ok ? await adsRes.json() : [];
        const kalyanKingData = kalyanKingRes.ok ? await kalyanKingRes.json() : null;

        res.render('index', {
            upcomingCards: upcomingData.cards || [],
            gr1Games: gr1Data.games || [],
            gr2Games: gr2Data.games || [],
            allGames: allGames || [],
            gr1MonthlyData: gr1MonthlyData || { tableData: [] },
            gr2MonthlyData: gr2MonthlyData || { tableData: [] },
            ads: adsData || [],
            kalyanKing: kalyanKingData
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
        
        const currentYear = req.query.year || new Date().getFullYear();
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

    const target = `/chart-2026/${game}${year ? `?year=${year}` : ''}`;
    return res.redirect(target);
});


const blogsData = {
    'lucky-satta7-guide-2026-how-it-works-important-facts': {
        title: "lucky satta7 Guide 2026: How It Works & Important Facts",
        date: "9 May 2026",
        tags: "lucky satta7 guide 2026, LUCKY-SATTA 7",
        image: "/assets/images/blogImages/blog_lucky_satta7_guide.png",
        content: "<p>There are thousands of visitors online every day looking for live results, charts, number trends. In this guide, we will dive deep into how Lucky Satta 7 works, the crucial patterns you must know, and important facts about playing safely and smartly.</p><p>Understanding the fundamental mechanisms is key. Always do your own research and look at historical charts to find trends before making decisions.</p>"
    },
    'delhi-bazar-satta-charts-2026-understanding-number-trends-market-updates': {
        title: "Delhi Bazar Satta Charts 2026: Understanding Number Trends & Market Updates",
        date: "9 May 2026",
        tags: "Delhi Bazar satta, Delhi Satta",
        image: "/assets/images/blogImages/blog_delhi_bazar_charts.png",
        content: "<p>In 2026, Delhi Bazar Satta is once again making waves online. The Delhi Bazar charts provide a clear picture of market trends.</p><p>Discover the latest numbers and patterns in this market update. We break down the most frequent numbers, the monthly shifts, and what you should watch out for this season.</p>"
    },
    'the-truth-behind-faridabad-satta-king-payout-discussions-and-internet-claims': {
        title: "The Truth Behind Faridabad LUCKY-SATTA 7 Payout Discussions and Internet Claims",
        date: "10 May 2026",
        tags: "faridabad satta, faridabad LUCKY-SATTA 7",
        image: "/assets/images/blogImages/blog_faridabad_truth.png",
        content: "<p>Faridabad LUCKY-SATTA 7 Payout Discussions and Internet Claims. Let me tell you what happens every day when players discuss their strategies online.</p><p>We are debunking the most common myths and confirming the truth about internet claims. Remember to only trust verified sources and avoid falling for online scams.</p>"
    }
};

app.get('/blog/:slug', (req, res) => {
    const slug = req.params.slug.toLowerCase();
    const blog = blogsData[slug];
    
    if (!blog) {
        return res.status(404).send('Blog not found');
    }
    
    res.render('blogDetail', { blog });
});

app.use((req, res) => {
    res.status(404).send('Page not found');
});

app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});
