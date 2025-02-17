require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { getTravelRecommendations, getPlacesRecommendations } = require("./gptService");

const app = express();
const PORT = process.env.PORT || 5000;

// Sicherheitseinstellungen
app.use(helmet());  // Setzt sichere HTTP-Header

// CORS-Konfiguration
const allowedOrigins = [
    "http://localhost:5173",
    "https://ai-travel-buddy-mu.vercel.app", // Vercel-Frontend
    "https://ai-travel-buddy.com", // Hauptdomain (ohne www)
    "https://www.ai-travel-buddy.com", // 🔥 Füge `www.`-Version hinzu!
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));

app.use(express.json()); // JSON-Parsing 

// Rate Limiting 
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});
app.use(limiter);

// Middleware zur API-Key-Validierung
const apiKeyMiddleware = (req, res, next) => {
    const clientApiKey = req.headers["authorization"];
    if (clientApiKey !== `Bearer ${process.env.API_KEY}`) {
        return res.status(403).json({ error: "Unauthorized" });
    }
    next();
};

// API-Route für Empfehlungen
app.post("/api/recommendations", apiKeyMiddleware, async (req, res) => {
    const { preferences, budget, location } = req.body;

    if (!preferences || !budget) {
        return res.status(400).json({ error: "Missing preferences or budget" });
    }

    try {
        const recommendations = await getTravelRecommendations(preferences, budget);
        res.json({ recommendations });
    } catch (error) {
        console.error("Fehler bei der Empfehlungsgenerierung:", error);
        res.status(500).json({ error: "Fehler bei der Empfehlungsgenerierung" });
    }
});

// API-Route für mehr Empfehlungen
app.post("/api/loadMoreResults", apiKeyMiddleware, async (req, res) => {
    const { preferences, budget, location, previousCountries } = req.body;

    if (!preferences || !budget || !location || !previousCountries) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const recommendations = await getTravelRecommendations(preferences, budget, location, previousCountries);
        res.json({ recommendations });
    } catch (error) {
        console.error("Fehler bei der zusätzlichen Empfehlungsgenerierung:", error);
        res.status(500).json({ error: "Fehler bei der zusätzlichen Empfehlungsgenerierung" });
    }
});


// API-Route für Orte
app.post("/api/places", async (req, res) => {
    const { preferences, budget, country } = req.body;

    if (!preferences || !budget || !country) {
        return res.status(400).json({ error: "Missing preferences, budget, or country" });
    }

    try {
        const recommendations = await getPlacesRecommendations(preferences, budget, country);
        res.json({ recommendations });
    } catch (error) {
        console.error("Fehler bei der Empfehlungsgenerierung:", error);
        res.status(500).json({ error: "Fehler bei der Empfehlungsgenerierung" });
    }
});

// Server starten
app.listen(PORT, () => console.log(`Server läuft auf http://localhost:${PORT}`));
