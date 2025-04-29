import axios from "axios";
import qs from "qs";

export default async function getGoogleOauthTokens (code : string) {
    const url = 'https://oauth2.googleapis.com/token';

    const values = {
        code,
        client_id : process.env.CLIENT_ID_GOOGLE,
        client_secret : process.env.CLIENT_SECRET_GOOGLE,
        redirect_uri : 'http://localhost:5173/auth/oauth/google',
        grant_type : 'authorization_code'
    };

    console.log('values at get Goolge tokens ::', values);

    try {
        const res = await axios.post(
            url,
            qs.stringify(values),
            {
                headers : {
                    'Content-Type' : 'application/x-www-form-urlencoded',
                }
            }
        );
        console.log(res);
        
        return res.data;
        
    } catch (error) {
        console.error("Failed to fetch google oauth token", error);
    }
}