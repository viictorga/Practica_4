    import {Db, MongoClient} from "mongodb";
     import { ObjectId } from "mongodb"

import dotenv from "dotenv";
dotenv.config();



let client: MongoClient;
let db: Db;


export const connectToMongoDB = async ()=>{
    try {
        console.log("funcion ejecutandose")
        //const urlMongoProfe = "mongodb+srv://kirk:patataEspacial@mongomake.3ta2r.mongodb.net/?appName=MongoMake"
        const urlMongoMio = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.CLUSTER}.l0zqfnc.mongodb.net/?appName=${process.env.CLUSTER_NAME}`
        client = new MongoClient(urlMongoMio);
        await client.connect();
        // db = client.db("Vicio")
        db = client.db("Practica4")
        //db = client.db("sample_supplies")
        console.log("veeeenga chaval, estas conectado a mongo");
        
    } catch (error) {
        console.error("no te conectas a mongo capitan", error);
        process.exit(1);
    }
};


export const getDB = (): Db => db;

