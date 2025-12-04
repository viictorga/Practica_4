import { ObjectId } from "mongodb";
import { getDB } from "../db/mongo"
import { IResolvers } from "@graphql-tools/utils";
import { Users } from "../types/Users";
import { AuthPayload } from "../types/AuthPayload";
import { createUser, validateUser } from "../collections/users";
import { signToken } from "../auth";
import { Projects } from "../types/Projects";
import { Tasks } from "../types/Tasks";


const COLLECTION_TASKS = "Tasks";
const COLLECTION_PROJECTS = "Projects";
const COLLECTION_USERS = "users";

export const resolvers: IResolvers = {
    Query: {
        me: async (_, __, { user }) => {
            if (!user) return null;
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
        tasks: (parent: Projects) => {
            // Buscar en la coleccion de Task que tareas tienen como projectId el valor de parent._id
        }
        
    },
    Mutation:{
        register: async ( _,{ email, password }: { email: string; password: string }) => {
            const userId = await createUser(email, password);
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
        createProject: async(_, {name, startDate, endDate, members, description},{user})=>{
           if(!user) throw new Error("No tienes credenciales correctas");
            const db = getDB();
            
            const nuevoProyecto : Projects = {
                name,
                startDate,
                description,
                endDate,
                members,
                owner:  user._id
            }
            return await db.collection<Projects>(COLLECTION_PROJECTS).insertOne(nuevoProyecto);
        },
        // hay que mirarlo
        updateProject: async(_,{id, name, startDate, endDate, description, members},{user} )=>{
            if(!user) throw new Error("No tienes credenciales correctas");
            const db = getDB();
            let proyecto = await db.collection<Projects>(COLLECTION_PROJECTS).findOne({_id: id});
            if(!proyecto) throw new Error("No existe el proyecto")
            if(proyecto.owner !== user._id) throw new Error("No eres el owner del proyecto")
            const updates: any = {}
            if (description) updates.description = description;
            if (members) updates.members = members;
            updates.name = name;
            updates.startDate = startDate;
            updates.endDate = endDate

            return await db.collection(COLLECTION_PROJECTS).updateOne({_id: id}, {$set: {updates}});

        },
        addMember: async(_, {projectId, userId}, {user}) =>{
            if(!user) throw new Error("No tienes credenciales correctas");
            
            const db = getDB();
            let proyecto = await db.collection<Projects>(COLLECTION_PROJECTS).findOne({_id: projectId});
            if(!proyecto) throw new Error("No existe el proyecto")
            if(proyecto.owner !== user._id) throw new Error("No eres el owner del proyecto")
            proyecto?.members?.push(new ObjectId(userId));
            await db.collection(COLLECTION_PROJECTS).updateOne({_id: projectId}, {$set: {proyecto}})

            return {
                ...proyecto
            }
        },
        createTask: async(_, {projectId, title, status, priority, dueDate, assignedTo},{user}) =>{
            if(!user) throw new Error("No tienes credenciales correctas");
            
            const db = getDB();
            let proyecto = await db.collection<Projects>(COLLECTION_PROJECTS).findOne({_id: projectId});
            if(!proyecto) throw new Error("No existe el proyecto")
            const esMiembro = proyecto.members!.some((n) => user._id === n)
            if((proyecto.owner !== user._id) && (!esMiembro)) throw new Error("No eres owner ni miembro")
            

            if(status !== "PENDING" || status !== "IN_PROGRESS" || status !== "COMPLETED"){
                status = "PENDING"
            }
            if(priority !== "LOW" || priority !== "MEDIUM" || priority !== "HIGH"){
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
            await db.collection(COLLECTION_TASKS).insertOne(newTask);

        }, 
        updateTaskStatus: async(_, {taskId, taskStatus}, {user}) =>{
            if(!user) throw new Error("No tienes credenciales correctas");
            const db = getDB();
            let task = await db.collection<Tasks>(COLLECTION_TASKS).findOne({_id: taskId})
            if(!task) throw new Error("no existe ese task");
            if(taskStatus !== "PENDING" || taskStatus !== "IN_PROGRESS" || taskStatus!== "COMPLETED"){
                taskStatus = "PENDING"
            }
            return await db.collection(COLLECTION_TASKS).updateOne({_id: taskId},{$set: {status: taskStatus}})

        }  

    }
}