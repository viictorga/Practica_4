import { ObjectId } from "mongodb";
import { getDB } from "../db/mongo"

import { IResolvers } from "@graphql-tools/utils";
import { Users } from "../types/Users";
import { AuthPayload } from "../types/AuthPayload";
import { createUser, validateUser } from "../collections/users";
import { signToken } from "../auth";
import { Projects } from "../types/Projects";
import { Tasks } from "../types/Tasks";
import { ProxyEnv } from "http";


const COLLECTION_TASKS = "Tasks";
const COLLECTION_PROJECTS = "Projects";
const COLLECTION_USERS = "users";

export const resolvers: IResolvers = {
    Query: {
        me: async (_, __, { user }) => {
            if (!user) throw new Error("no son las credenciales correctas " + user);
            return {
            _id: user._id.toString(),
            ...user
            };
        },
        myProjects: async(_,__,{user}) =>{
            if(!user) return null;
            const db = getDB();
            return await db.collection(COLLECTION_PROJECTS).find().toArray();
        },
        projectDetails: async(_,{projectId} : {projectId : string},{user}) =>{
            if(!user) return null;
            const db = getDB();
            return await db.collection(COLLECTION_PROJECTS).findOne({_id: new ObjectId(projectId)});
        },
        users: async(_,__, {user}) =>{
             if(!user) return null;
            const db = getDB();
            return await db.collection(COLLECTION_USERS).find().toArray();
        }

    },
    Project:{
        tasks: async(parent: Projects) => {
            // Buscar en la coleccion de Task que tareas tienen como projectId el valor de parent._id
            const db  = getDB();
            console.log(parent._id)
            const a =  await db.collection<Tasks>(COLLECTION_TASKS).find({projectId: parent._id?.toString()}).toArray();
            console.log(a)
            return a;
        },
        members: async(parent: Projects) =>{
            const db = getDB();
            const ids = parent.members.map(id => new ObjectId(id));
            return await db.collection<Users>(COLLECTION_USERS).find({_id : {$in: ids}}).toArray();
        }
        
    },
    Mutation:{
        register: async ( _,{ email, password, username}) => {
            const userId = await createUser(email, password, username);
            const token = signToken(userId);
            const payload : AuthPayload= {
                token
            }
            return payload;
        },
        login: async (_,{ email, password }: { email: string; password: string }) => {
            const user = await validateUser(email, password);
            if (!user) throw new Error("Invalid credentials");
            const token = signToken(user._id.toString());

            const payload : AuthPayload= {
                token
            }
            return payload;
        },
        createProject: async(_, {name, startDate, endDate, members, description} : {name : string, startDate: Date, endDate : Date, members : Array<ObjectId>, description : string },{user})=>{
           if(!user) throw new Error("No tienes credenciales correctas");
            const db = getDB();
            if(endDate < startDate)throw new Error("No puede finalizar antes de empezar")
            const nuevoProyecto : Projects = {
                name,
                startDate,
                description,
                endDate,
                members,
                owner:  user._id
            }
            const a = await db.collection<Projects>(COLLECTION_PROJECTS).insertOne(nuevoProyecto);
            return await db.collection(COLLECTION_PROJECTS).findOne({_id: a.insertedId})
        },
        updateProject: async(_,{id, name, startDate, endDate, description, members},{user} )=>{
            if(!user) throw new Error("No tienes credenciales correctas");
            const db = getDB();
            let proyecto = await db.collection<Projects>(COLLECTION_PROJECTS).findOne({_id: new ObjectId(id)});
            if(!proyecto) throw new Error("No existe el proyecto")
            if(proyecto.owner.toString() !== user._id.toString()) throw new Error("No eres el owner del proyecto")
            id = proyecto._id;
            if(!description) description = proyecto.description;
            if(!members) members = proyecto.members;
            if(!name) name = proyecto.name;
            if(!startDate) startDate = proyecto.startDate;
            if(!endDate) endDate = proyecto.endDate;
            

            await db.collection<Projects>(COLLECTION_PROJECTS).updateOne({_id: id}, {$set: {
                 name, startDate, endDate, description, members
            }});
            
            return await db.collection(COLLECTION_PROJECTS).findOne({_id: id})


        },
        addMember: async(_, {projectId, userId}, {user}) =>{
            if(!user) throw new Error("No tienes credenciales correctas");
            
            const db = getDB();
            let proyecto = await db.collection<Projects>(COLLECTION_PROJECTS).findOne({_id: new ObjectId(projectId)});
            if(!proyecto) throw new Error("No existe el proyecto")
            if(proyecto.owner.toString() !== user._id.toString()) throw new Error("No eres el owner del proyecto")
            proyecto?.members?.push(new ObjectId(userId));
           
            await db.collection(COLLECTION_PROJECTS).updateOne({_id: new ObjectId(projectId)}, {$set: {members : proyecto.members}})

            return await db.collection(COLLECTION_PROJECTS).findOne({_id: proyecto._id})
            
        },
        createTask: async(_, {projectId, title, status, priority, dueDate, assignedTo},{user}) =>{
            if(!user) throw new Error("No tienes credenciales correctas");
            
            const db = getDB();
            let proyecto = await db.collection<Projects>(COLLECTION_PROJECTS).findOne({_id: new ObjectId(projectId)});
            if(!proyecto) throw new Error("No existe el proyecto")
            if(!proyecto.members){
                if(proyecto.owner.toString() !== user._id.toString()){
                     throw new Error("No eres owner ni miembro")
                }
                if(status !== "PENDING" || status !== "IN_PROGRESS" || status !== "COMPLETED"){
                status = "PENDING"
                }
                if(priority != "LOW" && priority != "MEDIUM" && priority != "HIGH"){
                    throw new Error("La prioridad es incorrecta")
                }

                const newTask: Tasks = {
                    title,
                    status,
                    priority, 
                    dueDate,
                    projectId,
                    assignedTo
                }
                const a = await db.collection(COLLECTION_TASKS).insertOne(newTask);
                return await db.collection(COLLECTION_TASKS).findOne({_id: a.insertedId})
            }
            const esMiembro = proyecto.members!.some((n) => user._id === n)
            if((proyecto.owner !== user._id) && (!esMiembro)) throw new Error("No eres owner ni miembro")
            

            if(status !== "PENDING" || status !== "IN_PROGRESS" || status !== "COMPLETED"){
                status = "PENDING"
            }
            if(priority != "LOW" && priority != "MEDIUM" && priority != "HIGH"){
                throw new Error("La prioridad es incorrecta")
            }

            const newTask: Tasks = {
                title,
                status,
                priority, 
                dueDate,
                projectId,
                assignedTo
            }
            const a = await db.collection(COLLECTION_TASKS).insertOne(newTask);
            return await db.collection(COLLECTION_TASKS).findOne({_id: a.insertedId})
        }, 
        updateTaskStatus: async(_, {taskId, taskStatus}, {user}) =>{
            if(!user) throw new Error("No tienes credenciales correctas");
            const db = getDB();
            let task = await db.collection<Tasks>(COLLECTION_TASKS).findOne({_id: new ObjectId(taskId)})
            if(!task) throw new Error("no existe ese task");
            if(taskStatus !== "PENDING" && taskStatus !== "IN_PROGRESS" && taskStatus!== "COMPLETED"){
                taskStatus = "PENDING"
            }
            await db.collection(COLLECTION_TASKS).updateOne({_id: new ObjectId(taskId)},{$set: {status: taskStatus}})
            return await db.collection(COLLECTION_TASKS).findOne({_id: new ObjectId(taskId)})
        }, 
        deleteProject: async(_, {id}, {user}) =>{
            if(!user) throw new Error("No tienes credenciales correctas");
            const db = getDB();
            let proyecto = await db.collection<Projects>(COLLECTION_PROJECTS).findOne({_id: new ObjectId(id)});
            if(!proyecto) throw new Error("No existe el proyecto")
            if(proyecto.owner.toString() !== user._id.toString()) throw new Error("No eres el owner del proyecto")

            await db.collection(COLLECTION_PROJECTS).deleteOne({_id: new ObjectId(id)});
            await db.collection(COLLECTION_TASKS).deleteMany({projectId: new ObjectId(id)});
            return proyecto;
        }

    }
}