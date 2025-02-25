import UserModel from '../models/userModel.js'
import validator from 'validator'
import bycrpt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '5d' })
}

// Route for User Login
const loginUser = async (req, res) => {

    try {

        const { email, password } = req.body

        const user = await UserModel.findOne({ email })

        if (!user) {
            return res.status(400).json({ success: false, message: "User not found. Please register first" })
        }

        const isMatch = await bycrpt.compare(password, user.password)

        if (isMatch) {
            const token = createToken(user._id)
            res.json({ success: true, token })

        } else {
            return res.status(400).json({ success: false, message: "Incorrect Password" })
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message })
    }
}

// Route for User Registration
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body

        console.log('Received data:', req.body);

        // Überprüfen, ob der Benutzer bereits existiert
        const exist = await UserModel.findOne({ email })
        if (exist) {
            console.log("User already exists:", email);
            return res.status(400).json({ success: false, message: "User already exists" })
        }

        // Validierung von E-Mail-Format
        if (!validator.isEmail(email)) {
            console.log("Invalid email format:", email);
            return res.status(400).json({ success: false, message: "Please enter a valid email" })
        }

        // Validierung von starkem Passwort
        if (!validator.isStrongPassword(password)) {
            console.log("Weak password:", password);
            return res.status(400).json({
                success: false,
                message: "Password is not strong enough. It should be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and symbols."
            })
        }

        // Hashing des Benutzerpassworts
        const salt = await bycrpt.genSalt(10)
        const hashedPassword = await bycrpt.hash(password, salt)

        const newUser = new UserModel({
            name,
            email,
            password: hashedPassword
        })

        const user = await newUser.save()

        const token = createToken(user._id)

        res.json({ success: true, token })

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message })
    }
}


export { loginUser, registerUser }