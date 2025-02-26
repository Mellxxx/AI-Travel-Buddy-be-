import express from "express";
import User from "../models/userModel.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { nanoid } from "nanoid"; // 🔹 Für eindeutige IDs

const favoritesRouter = express.Router();

// ** Favoriten speichern **
favoritesRouter.post("/add", authMiddleware, async (req, res) => {
    try {
        const { country, description, ...placesData } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        // Prüfen, ob das Land bereits gespeichert wurde
        if (user.favorites.some(fav => fav.country === country)) {
            return res.status(400).json({ error: "Destination already saved" });
        }

        // **Finde das richtige `places_` Property**
        const placesKey = `places_${country}`;
        const places = placesData[placesKey] || [];

        // **Eindeutige URL generieren**
        const uniqueId = nanoid(10);

        user.favorites.push({ id: uniqueId, country, description, places });
        await user.save();

        res.json({ success: true, message: "Destination saved successfully", id: uniqueId });
    } catch (error) {
        console.error("Fehler beim Speichern:", error);
        res.status(500).json({ error: "Fehler beim Speichern" });
    }
});

// ** Alle Favoriten des Nutzers abrufen **
favoritesRouter.get("/", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        // Formatierte Favoriten zurückgeben
        const formattedFavorites = user.favorites.map(fav => ({
            id: fav.id,
            country: fav.country,
            description: fav.description,
            places: fav.places,
        }));

        res.json({ success: true, favorites: formattedFavorites });
    } catch (error) {
        console.error("Fehler beim Abrufen:", error);
        res.status(500).json({ error: "Fehler beim Abrufen der Favoriten" });
    }
});

// ** single Favorite-Objekt ( for `FavoriteDetail.jsx`) **
favoritesRouter.get("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findOne({ "favorites._id": id }, { "favorites.$": 1 });

        if (!user || !user.favorites.length) {
            return res.status(404).json({ error: "Favorite not found" });
        }

        res.json({ success: true, favorite: user.favorites[0] });
    } catch (error) {
        console.error("Fehler beim Abrufen des Favoriten:", error);
        res.status(500).json({ error: "Fehler beim Abrufen des Favoriten" });
    }
});

// ** remove from List **
favoritesRouter.delete("/remove/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        user.favorites = user.favorites.filter(fav => fav.id !== id);
        await user.save();

        res.json({ success: true, message: "Destination removed" });
    } catch (error) {
        console.error("Fehler beim Löschen:", error);
        res.status(500).json({ error: "Fehler beim Löschen" });
    }
});

export default favoritesRouter;
