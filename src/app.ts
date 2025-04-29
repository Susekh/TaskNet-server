import Express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";
import rootRouter from "./routes/root.route.js";
import { createServer } from "node:http";
import { initializeSocket } from "./utils/socket.js";

const app = Express();
const server = createServer(app);
initializeSocket(server);

app.use(Express.json());

app.use(Express.urlencoded({ extended : false }));

app.use(cors({
    credentials : true,
    origin : process.env.FRONTEND_URI
}));


app.use(cookieParser());


app.use("/", rootRouter);



export {app, server};