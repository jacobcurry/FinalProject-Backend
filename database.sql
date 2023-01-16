CREATE DATABASE spacechat;

CREATE TABLE users(
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(30),
  email VARCHAR(30),
  password VARCHAR(255),
  isAvatarImageSet BOOLEAN DEFAULT FALSE,
  avatarImage TEXT DEFAULT ''
);

CREATE TABLE messages(
  message_id SERIAL PRIMARY KEY,
  message TEXT,
  users VARCHAR[],
  sender INTEGER REFERENCES users
);

ALTER TABLE users ADD COLUMN yourMessagedUsers INTEGER[];