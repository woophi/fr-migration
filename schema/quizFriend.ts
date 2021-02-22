import { model, Schema as MongoSchema, Types } from "mongoose";
import { SchemaName } from "./names";

export const QuizFriendSchema = new MongoSchema(
  {
    vkUserId: {
      type: Number,
      required: true,
      index: true,
    },
    firstName: {
      default: "",
      type: String,
    },
    lastName: {
      default: "",
      type: String,
    },
    quiz: {
      required: true,
      type: Types.ObjectId,
      ref: SchemaName.QUIZZES,
    },
    finished: {
      type: Date,
      default: null,
    },
    lastStep: {
      type: Number,
      default: 0,
    },
    friendType: {
      type: String,
      required: true,
    },
    answers: {},
  },
  { collection: SchemaName.QUIZ_FRIENDS }
);

export const QuizFriendModel = model(SchemaName.QUIZ_FRIENDS, QuizFriendSchema);
