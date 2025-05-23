import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import asyncHandler from "../../utils/asyncHanlder.js";
import db from "../../utils/db/db.js";
const updateProfilePicture = asyncHandler(async (req, res, next) => {
    if (!req.file || !req.user) {
        console.log("req from file", req.file);
        throw new ApiError(400, "No file or user not authenticated");
    }
    const file = req.file;
    const location = file.location;
    const updatedUser = await db.user.update({
        where: { id: req.user.id },
        data: { imgUrl: location },
    });
    res.status(200).json(new ApiResponse(200, updatedUser, "Profile picture updated"));
});
export default updateProfilePicture;
//# sourceMappingURL=updateProfilePicture.controller.js.map