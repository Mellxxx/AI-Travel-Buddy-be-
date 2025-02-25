import mongoose from "mongoose";

// Connection to DB

const connectDB = async () => {

    mongoose.connection.on('connected', () => {
        console.log('Database connected');
    })

    await mongoose.connect(`${process.env.MONGODB_URI}/ecommerce`)
}

export default connectDB