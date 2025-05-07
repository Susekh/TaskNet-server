import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath)
            return null;
        //upload file path to cloudinary
        const res = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        //after uploading
        console.log("File uploaded on cloudinary", res.url);
        return res;
    }
    catch (error) {
        fs.unlinkSync(localFilePath); //remove the locally saved temp file after upload opreation fails
        return null;
    }
};
export default uploadOnCloudinary;
//# sourceMappingURL=cloudinary.js.map