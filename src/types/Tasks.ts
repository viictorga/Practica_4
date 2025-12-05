 import { ObjectId } from "mongodb"

 
 export type Tasks={    
    _id?: ObjectId,
    title: string, 
    projectId: string,
    assignedTo?: ObjectId,
    status: string, 
    priority: string,
    dueDate: Date
 }