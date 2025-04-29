import dotenv from "dotenv";
import { server } from "./app.js";
dotenv.config({
    path: "../.env"
});
server.listen(process.env.PORT || 5000, () => {
    console.log(`Server is listening at http://localhost:${process.env.PORT}`);
});
//# sourceMappingURL=index.js.map