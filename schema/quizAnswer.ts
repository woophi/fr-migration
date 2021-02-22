import { model, Schema as MongoSchema, Types } from "mongoose";
import { SchemaName } from "./names";

export const QuizAnswerSchema = new MongoSchema(
  {
    emoji: {
      required: true,
      type: String,
    },
    text: {
      required: true,
      type: String,
    },
    quizQuestion: {
      required: true,
      type: Types.ObjectId,
      ref: SchemaName.QUIZ_QUESTIONS,
    },
  },
  { collection: SchemaName.QUIZ_ANSWERS }
);

export const QuizAnswerModel = model(SchemaName.QUIZ_ANSWERS, QuizAnswerSchema);
