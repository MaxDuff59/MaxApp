import express from "express"
import dotenv from "dotenv"
import cors from 'cors'
import {sql, initDB} from "./config/db.js"
import ratelimiter from "./middleware/rateLimiter.js";
import transactionsRoute from "./routes/transactionsRoute.js"
import dailyFormRoute from "./routes/dailyFormRoute.js"

dotenv.config()

const app = express();

// --- Middleware ---
app.use(ratelimiter)
app.use(express.json())

app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:19006'], // Expo web often uses 19006 too
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true, 
}));


const PORT = process.env.PORT || 5001

app.use("/api/transactions", transactionsRoute)

app.use("/api/dailyform", dailyFormRoute)


initDB().then(() => {
    app.listen(PORT, () => {
        console.log('Server is up and running on port :',PORT)
    })
})




