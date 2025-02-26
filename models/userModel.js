import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    favorites: [{
        country: { type: String, required: true },
        description: { type: String, required: true },
        places: [{
            place: String,
            description: String
        }],
        createdAt: { type: Date, default: Date.now }
    }]
}, { minimize: false });

const UserModel = mongoose.models.User || mongoose.model("User", userSchema);

export default UserModel;
