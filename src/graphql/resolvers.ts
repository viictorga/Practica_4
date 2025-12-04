import { ObjectId } from "mongodb";
import { getDB } from "../db/mongo"
import { IResolvers } from "@graphql-tools/utils";
import { Users } from "../types/Users";
import { createUser, validateUser } from "../collections/users";
import { signToken } from "../auth";


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

    },
    Mutation:{

    }

}