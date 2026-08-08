import { Client, Account } from 'appwrite';

export const APPWRITE_ENDPOINT = "https://cloud.appwrite.io/v1"; 
export const APPWRITE_PROJECT_ID = "677178c3000b13839d0c"; 

const client = new Client();
client.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);
