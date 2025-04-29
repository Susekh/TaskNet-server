import { Router } from "express";
import singUpValidation from "../middleware/signUpValidation.js";
import singUpController from "../controller/auth/singUpController.js";
import singInValidation from "../middleware/signInValidation.js";
import singInController from "../controller/auth/signInController.js";
import { verifyJWT } from "../middleware/verifyJWT.js";
import logoutController from "../controller/auth/logOutController.js";
import isAuthenticatedController from "../controller/auth/isAuthenticatedController.js";
import oAuthRoutes from "./oAuthRoutes.js";
import forgotPassword from "../controller/auth/forgotPassword.js";
import resetPassword from "../controller/auth/resetPassword.js";
const router = Router();
router.post("/test", singUpValidation, (req, res) => {
    console.log(req.body);
    res.status(201).json({ msg: "success" });
});
router.post("/sign-in-user", singInValidation, singInController);
router.post("/sign-up-user", singUpValidation, singUpController);
router.get("/log-out-user", verifyJWT, logoutController);
router.get("/is-authenticated", verifyJWT, isAuthenticatedController);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.use("/Oauth", oAuthRoutes);
export default router;
//# sourceMappingURL=authRoutes.js.map