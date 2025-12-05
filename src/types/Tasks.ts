 import { ObjectId } from "mongodb"

 
 export type Tasks={    
    _id?: ObjectId,
    title: string, 
    projectId: ObjectId,
    assignedTo?: ObjectId,
    status: string, 
    priority: string,
    dueDate: Date
 }