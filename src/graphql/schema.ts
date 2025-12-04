import { gql } from "apollo-server";


export const typeDefs = gql`
  type User {
    _id: ID!
    username: String!
    email: String!
    password: String!
    createdAt: String
  }
  type Project{
    _id: ID!
    name: String!
    description: String
    startDate: String!
    endDate: String!
    owner: ID
    members: [User!]
    tasks: [Task]

  }
  type Task{
    _id: ObjectId
    title: String!
    projectId: ID!
    assignedTo: ID
    status: String
    priority: String
    dueDate: String

  }
  type AuthPayload {
    token: String!
  }

  

  type Query {
    me: User
    myProjects: [Project!]
    projectDetails(projectId: ID!): Project
    users: [User!]!
  }

  type Mutation {
    createProject(name: String!, startDate: String!, endDate: String!, members: [User]): Project!
    register(email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    updateProject(id: ID!,name:String, startDate:String, endDate:String, description: String, members: [User]): Project
    addMember(projectId:ID!, userId: ID!): Proyect
    createTask(projectId: ID!, title:String!, status:String, priority: String!, dueDate:String!): Task!
    updateTaskStatus(taskId: ID!, taskStatus: String!): Task
    deleteProject(id: ID!): Project
  }




`;