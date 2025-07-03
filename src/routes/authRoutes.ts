import { Router } from "express";
import singUpValidation from "../middleware/signUpValidation.js";
import singInValidation from "../middleware/signInValidation.js";
import { verifyJWT } from "../middleware/verifyJWT.js";
import oAuthRoutes from "./oAuthRoutes.js";
import singInController from "../controller/auth/signIn.controller.js";
import singUpController from "../controller/auth/singUp.controller.js";
import isAuthenticatedController from "../controller/auth/isAuthenticated.controller.js";
import forgotPassword from "../controller/auth/forgotPassword.controller.js";
import resetPassword from "../controller/auth/resetPassword.controller.js";
import logoutController from "../controller/auth/logOut.controller.js";


const router = Router();

router.post("/test",singUpValidation, (req, res) => {
    console.log(req.body);
    res.status(201).json({ msg : "success" });
    
})
router.post("/sign-in-user", singInValidation, singInController);
router.post("/sign-up-user", singUpValidation,  singUpController);
router.get("/log-out-user", verifyJWT, logoutController);
router.get("/is-authenticated", verifyJWT, isAuthenticatedController);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.use("/Oauth", oAuthRoutes);

export default router;