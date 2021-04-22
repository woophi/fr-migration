import { connect } from "mongoose";
import { QuizFriendType, QuizModel, QuizType } from "./schema/quiz";
import { QuizAnswerModel } from "./schema/quizAnswer";
import { QuizFriendModel } from "./schema/quizFriend";
import { QuizQuestionModel } from "./schema/quizQuestion";
import * as moment from "moment";
import { Pool } from "pg";
import { createWriteStream } from "fs";
import { blue, green, red } from "chalk";
import { EmojiReplace } from "./schema/names";

const pool = new Pool({
  connectionString:
    "postgresql://postgres:a@localhost:5432/testfriendship?schema=public",
});

connect("mongodb://localhost:27017/vk-friends", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const limit = 1000;

const insertIntoPGDb = async (quiz: QuizType) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    console.log(red("BEGIN"));
    const newPgQuizQuery =
      "insert into quiz(created, vk_user_id, first_name, last_name) values (now(), $1, $2, $3) RETURNING id";

    const quizId = (
      await client.query(newPgQuizQuery, [
        quiz.vkUserId,
        quiz.firstName,
        quiz.lastName,
      ])
    ).rows[0].id;

    console.log(blue("Saved quiz"), quizId);

    const answerPairs: { answer: string; answerDbId: string }[] = [];

    for (const questionData of quiz.questions) {
      const newPgQuizQuestionQuery = `
        insert into quiz_question(question, step, background_card, quiz_id) 
          values ($1, $2, $3, $4) RETURNING id
      `;

      const quizQuestionId = (
        await client.query(newPgQuizQuestionQuery, [
          questionData.question,
          questionData.step,
          questionData.backgroundCard,
          quizId,
        ])
      ).rows[0].id;

      console.log(blue("Saved quiz question"), quizQuestionId);

      for (const answerData of questionData.answers) {
        const newPgQuestionAnswerQuery = `
          insert into question_answer(emoji, answer_text, quiz_question_id) 
            values ($1, $2, $3) RETURNING id
        `;

        const questionAnswerId = (
          await client.query(newPgQuestionAnswerQuery, [
            EmojiReplace[answerData.emoji] ?? answerData.emoji,
            answerData.text,
            quizQuestionId,
          ])
        ).rows[0].id;

        console.log(blue("Saved question answer"), questionAnswerId);

        answerPairs.push({
          answer: answerData.text,
          answerDbId: questionAnswerId,
        });

        if (questionData.slectedAnswer._id.equals(answerData._id)) {
          const newPgQuestionSelectedAnswerQuery = `
            insert into question_selected_answer(answer_id, question_id) 
              values ($1, $2)
          `;

          const questionSelectedAnswer = await client.query(
            newPgQuestionSelectedAnswerQuery,
            [questionAnswerId, quizQuestionId]
          );

          console.log(
            blue("Saved question selected answer"),
            questionSelectedAnswer.rowCount,
            questionAnswerId,
            quizQuestionId
          );
        }
      }
    }

    for (const quizFriend of quiz.friends) {
      const newPgQuizFriend = `
          insert into quiz_friend(
            started, vk_user_id, first_name, last_name, 
            quiz_id, last_step, friend_type, finished) 
          values ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
        `;

      const quizFriendId = (
        await client.query(newPgQuizFriend, [
          moment(quizFriend.finished).subtract(1, "hour").toDate(),
          quizFriend.vkUserId,
          quizFriend.firstName,
          quizFriend.lastName,
          quizId,
          quizFriend.lastStep,
          quizFriend.friendType === QuizFriendType.Anon ? 1 : 2,
          quizFriend.finished,
        ])
      ).rows[0].id;

      console.log(blue("Saved quiz friend"), quizFriendId);

      const friendInfos = Object.values(quizFriend.answers);
      for (const friendInfo of friendInfos) {
        const newPgFriendInfoQuery = `
            insert into friend_participant_info(quiz_friend_id, step, answer_id) 
              values ($1, $2, $3)
          `;

        const answerId = answerPairs.find(
          (ap) => ap.answer.toLowerCase() === friendInfo.answer.toLowerCase()
        ).answerDbId;
        const questionSelectedAnswer = await client.query(
          newPgFriendInfoQuery,
          [quizFriendId, friendInfo.step, answerId]
        );

        console.log(
          blue("Saved friend_participant_info"),
          questionSelectedAnswer.rowCount
        );
      }
    }

    await client.query("COMMIT");
    console.log(red("COMMIT"));
    const resultStream = createWriteStream("success", { flags: "a" });
    resultStream.once("open", function (fd) {
      resultStream.write(`${quiz._id}` + "\r\n");
    });
  } catch (e) {
    console.log(red("ROLLBACK"));
    await client.query("ROLLBACK");
    const resultStream = createWriteStream("failed", { flags: "a" });
    resultStream.once("open", function (fd) {
      resultStream.write(`${quiz._id}` + "\r\n");
    });
    console.error(red("ERROR"), e);
  } finally {
    client.release();
  }
};

const batchQuiz = async (offset: number) => {
  const quizzes = await QuizModel.find({ deleted: null })
    .sort("vkUserId")
    .populate({
      path: "questions",
      populate: {
        path: "answers",
        options: { lean: true },
      },
    })
    .populate({
      path: "questions",
      populate: {
        path: "slectedAnswer",
        options: { lean: true },
      },
    })
    .populate({
      path: "friends",
      match: { finished: { $ne: null }, lastStep: 10 },
    })
    .distinct("vkUserId")
    .skip(offset)
    .limit(limit)
    .exec();

  for await (const quiz of quizzes) {
    console.debug(green("Engage to save quiz"));
    await insertIntoPGDb({
      _id: quiz._id,
      deleted: quiz.deleted,
      firstName: quiz.firstName,
      lastName: quiz.lastName,
      questions: quiz.questions,
      vkUserId: quiz.vkUserId,
      friends: quiz.friends.filter(
        (f) => Object.values(f.answers ?? {}).length === 10
      ),
    });
    console.debug(green("Completly saved quiz and friends"));
  }
};

const main = async () => {
  const ad = QuizAnswerModel;
  const adf = QuizFriendModel;
  const adq = QuizQuestionModel;
  console.log(red("Big data query"));
  const amountOfQuizzes = await QuizModel.find({
    deleted: null,
  }).countDocuments();
  console.log(red("amountOfQuizzes"), amountOfQuizzes);

  let offset = 0;
  let notProcessed = amountOfQuizzes;

  while (offset !== amountOfQuizzes) {
    console.log(red("batch"), offset);
    await batchQuiz(offset);
    offset += notProcessed < limit ? notProcessed : limit;
    notProcessed -= notProcessed < limit ? notProcessed : limit;
    console.log(red("batch to next "), offset, notProcessed);
  }

  console.log("FINISHED");
};

main();
