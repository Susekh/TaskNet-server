import axios, { AxiosResponse } from "axios";

interface GoogleTokenResponse {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    scope: string;
    token_type: string;
    id_token?: string;
}

interface TokenRequestParams extends Record<string, string> {
    code: string;
    client_id: string;
    client_secret: string;
    redirect_uri: string;
    grant_type: 'authorization_code';
}

export default async function getGoogleOauthTokens(code: string): Promise<GoogleTokenResponse> {
    const url = 'https://oauth2.googleapis.com/token';

    const values: TokenRequestParams = {
        code,
        client_id: process.env.CLIENT_ID_GOOGLE!,
        client_secret: process.env.CLIENT_SECRET_GOOGLE!,
        redirect_uri: `${process.env.FRONTEND_URI}/auth/oauth/google`,
        grant_type: 'authorization_code'
    };

    console.log('values at get Google tokens ::', values);

    try {
        const res: AxiosResponse<GoogleTokenResponse> = await axios.post(
            url,
            new URLSearchParams(values),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            }
        );
        console.log(res);
        
        return res.data;
        
    } catch (error) {
        console.error("Failed to fetch google oauth token", error);
        throw error;
    }
}