create table quiz (
  id bigserial,
  created timestamp not null,
  vk_user_id int4 not null,
  first_name varchar(256),
  last_name varchar(256),
  deleted timestamp,
  primary key (id)
);

create table quiz_question (
  id bigserial,
  question varchar(256) not null,
  step int4 not null,
  background_card text not null,
  quiz_id int8 not null,
  primary key (id)
);

create table question_answer (
  id bigserial,
  emoji text not null,
  answer_text varchar(128),
  quiz_question_id int8 not null,
  primary key (id)
);

create table question_selected_answer (
  answer_id int8 not null,
  question_id int8 not null,
  primary key (answer_id, question_id)
);

create table quiz_friend (
  id bigserial,
  started timestamp not null,
  vk_user_id int4 not null,
  first_name varchar(256),
  last_name varchar(256),
  quiz_id int8 not null,
  last_step int4 not null,
  friend_type int4 not null,
  finished timestamp,
  deleted timestamp,
  primary key (id)
);

create table friend_participant_info (
  id bigserial,
  quiz_friend_id int8 not null,
  step int4 not null,
  answer_id int8 not null,
  primary key (id)
);