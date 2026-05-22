import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

import axios from "axios";
import { useState } from 'react';
import Dashboard from './Dashboard';



type User = {
 
  name: string;
  email: string;
  picture: string;
  email_verified: boolean;
  exp: number;
  iat: number;
};

type Transaction = {
  date: string;
  description: string;
  amount: number;
  category: string;
};
type userdata=
{
  name: string;
  email: string;
  picture: string;
   env: string;
}
type ApiResponse = {
  transactions: Transaction[];
  insights: string;
  data: userdata[];
};

type decoded={
  name: string;
  email: string;
  picture: string;
  email_verified: boolean;
  exp: number;
  iat: number;
    }
 function Login() {

    const [user, setUser] = useState<User | null>(null);

  
 
    if(!user)
    {                                                                                             
       return (
       
    <div>

      <h1>Login with Google</h1>
      <GoogleLogin
        onSuccess={async credentialResponse => {
          //console.log(credentialResponse.clientId);

          const decoded = jwtDecode<decoded>(credentialResponse.credential?.toString() || "");

          //console.log("Decoded JWT:", decoded);
 //const formData = new FormData();
const apiUrl = import.meta.env.VITE_API_URL;
const envUrl = import.meta.env.VITE_ENV_URL;

console.log("API URL:", apiUrl);
console.log("Environment URL:", envUrl);
const response = await axios.get<ApiResponse>(
    
             `${apiUrl}${envUrl}`,
        
        { headers: { 
          "Content-Type": "multipart/form-data" ,
        Authorization: `Bearer ${credentialResponse.credential}` }
         }
      );
console.log("Response from backend:", response.status);
//console.log("Response from backend:", response);
console.log("email:", decoded.email);
console.log("email_verified:", decoded.email_verified);

 setUser({
            name: decoded.name,
            email: decoded.email,
            picture: decoded.picture,
            email_verified: decoded.email_verified,
            exp: decoded.exp,
            iat: decoded.iat
            
          });
        }}
  

        onError={() => {
          console.log('Login Failed');
        }}
      />

      </div>
  );
    }

    return (
      <div>
       <div style={{ textAlign: "center", marginBottom: "20px" , padding: "10px"}}>
  Welcome to the Credit Card Statement Analyzer!  {user?.name} {user.picture?
   <img src={user.picture} alt="Profile" style={{ width: "25px", borderRadius: "50%", marginLeft: "10px" }} /> : null  }
       </div>
       {/*<div><Login /></div>*/}
       <div><Dashboard /></div>
      </div>
    );

}
export default Login;   