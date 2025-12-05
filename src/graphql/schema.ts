import { gql } from "apollo-server";


export const typeDefs = gql`
  type User {
    _id: ID!
    username: String!
    email: String!
    password: String!
    createdAt: String
  }
 
  type Task{
    _id: ID!
    title: String!
    projectId: ID!
    assignedTo: ID
    status: String
    priority: String
    dueDate: String

  }
   type Project{
    _id: ID!
    name: String!
    description: String
    startDate: String!
    endDate: String!
    owner: ID
    members: [User]
    tasks: [Task]

  }
  type AuthPayload {
    token: String!
  }

  

  type Query {
    me: User
    myProjects: [Project!]
    projectDetails(projectId: ID!): Project
    users: [User]!
  }

  type Mutation {
    createProject(name: String!, description: String, startDate: String!, endDate: String!, members: [ID]): Project!
    register(email: String!, password: String!, username: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    updateProject(id: ID!,name:String, startDate:String, endDate:String, description: String, members: [ID]): Project
    addMember(projectId:ID!, userId: ID!): Project
    createTask(projectId: ID!, assignedTo:ID, title:String!, status:String, priority: String!, dueDate:String!): Task!
    updateTaskStatus(taskId: ID!, taskStatus: String!): Task
    deleteProject(id: ID!): Project
  }




`;