import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


//routes import
import userRouter from './routes/user.routes.js'

// import educationRouter from "./routes/education.routes.js"
// import experienceRouter from "./routes/experience.routes.js"
import projectRouter from "./routes/project.routes.js"


//routes declaration
app.use("/api/v1/users", userRouter)
// app.use("/api/v1/edu", educationRouter)
// app.use("/api/v1/exprnc", experienceRouter)
app.use("/api/v1/project", projectRouter)


// http://localhost:8000/api/v1/users/register

export { app }