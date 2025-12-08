import { ObjectId } from "mongodb";
import { getDB } from "../db/mongo";
import bcrypt from "bcryptjs";



const COLLECTION_TASKS = "Tasks";
const COLLECTION_PROJECTS = "Projects";
const COLLECTION_USERS = "users";


export const createUser = async (email: string, password: string, username: string) => {
    const db = getDB();
    const toEncriptao = await bcrypt.hash(password, 10);

    const result = await db.collection(COLLECTION_USERS).insertOne({
        email,
        password: toEncriptao,
        username,
        createdAt: Date.now()
    });

    return result.insertedId.toString();
}

export const validateUser = async (email: string, password: string) => {
    const db = getDB();
    const user = await db.collection(COLLECTION_USERS).findOne({email});
    if( !user ) return null;

    const laPassEsLaMismaMismita = await bcrypt.compare(password, user.password);
    if(!laPassEsLaMismaMismita) return null;

    return user;
};


export const findUserById = async (id: string) => {
    const db = getDB();
    return await db.collection(COLLECTION_USERS).findOne({_id: new ObjectId(id)})
}