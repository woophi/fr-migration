import { model, Schema as MongoSchema, Types, Document } from "mongoose";
import { SchemaName } from "./names";

export const QuizSchema = new MongoSchema(
  {
    vkUserId: {
      required: true,
      index: true,
      type: Number,
    },
    firstName: {
      default: "",
      type: String,
    },
    lastName: {
      default: "",
      type: String,
    },
    deleted: {
      default: null,
      type: Date,
    },
    quizType: {
      required: true,
      type: String,
    },
    friends: [
      {
        type: Types.ObjectId,
        ref: SchemaName.QUIZ_FRIENDS,
      },
    ],
    questions: [
      {
        type: Types.ObjectId,
        ref: SchemaName.QUIZ_QUESTIONS,
      },
    ],
  },
  {
    collection: SchemaName.QUIZZES,
  }
);

type Model<T> = T & Document;

export enum QuizFriendType {
  Anon = "anon",
  Public = "public",
}

export type QuizType = {
  _id: string;
  vkUserId: number;
  firstName: string;
  lastName: string;
  deleted: Date;
  friends: {
    vkUserId: number;
    firstName: string;
    lastName: string;
    finished: Date;
    lastStep: number;
    friendType: QuizFriendType;
    answers: Record<number, { step: number; answer: string; wrong: boolean }>;
  }[];
  questions: {
    question: string;
    step: number;
    backgroundCard: string;
    slectedAnswer: {
      _id: {
        equals: (c: any) => boolean;
      };
      emoji: string;
      text: string;
    };
    answers: {
      _id: {
        equals: (c: any) => boolean;
      };
      emoji: string;
      text: string;
    }[];
  }[];
};
export type QuizTypeModel = Model<QuizType>;
export const QuizModel = model<QuizTypeModel>(SchemaName.QUIZZES, QuizSchema);
