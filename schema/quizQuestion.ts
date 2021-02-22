import { model, Schema as MongoSchema, Types } from "mongoose";
import { SchemaName } from "./names";

export const QuizQuestionSchema = new MongoSchema(
  {
    question: {
      required: true,
      type: String,
    },
    step: {
      required: true,
      type: Number,
    },
    backgroundCard: {
      required: true,
      type: String,
    },
    quiz: {
      type: Types.ObjectId,
      ref: SchemaName.QUIZZES,
      required: true,
    },
    slectedAnswer: {
      type: Types.ObjectId,
      ref: SchemaName.QUIZ_ANSWERS,
    },
    answers: [
      {
        type: Types.ObjectId,
        ref: SchemaName.QUIZ_ANSWERS,
      },
    ],
  },
  {
    collection: SchemaName.QUIZ_QUESTIONS,
  }
);

export const QuizQuestionModel = model(
  SchemaName.QUIZ_QUESTIONS,
  QuizQuestionSchema
);
