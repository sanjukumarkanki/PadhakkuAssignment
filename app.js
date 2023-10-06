const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "userData.db");
const bcrypt = require("bcrypt");

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Db Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

/*API 1 CREATE A NEW 
REGISTER IN THE DATABASE
 */
app.post("/api/signup/", async (request, response) => {
  const { name, email, id } = request.body;

  const selectUserQuery = `SELECT * FROM user WHERE email = '${email}';`;
  const dbuser = await db.get(selectUserQuery);
  if (dbuser === undefined) {
    if (email.endsWith("@gmail.com") === false) {
      response.status(400);
      response.send("Invalid email format");
    } else {
      const insertNewUser = `INSERT INTO user
      (id, name, email)
      VALUES (${id},'${name}','${email}');`;
      const newUser = await db.run(insertNewUser);
      response.status(200);
      response.send("Successful user sign-up");
    }
  } else {
    response.status(400);
    response.send("Email already registered");
  }
});

// API 2 CREATE USER POSTS
app.post("/api/posts/", async (req, res) => {
  const { userid, content } = req.body;
  const getUserDetails = `SELECT * FROM user WHERE id = ${userid};`;
  const response = await db.get(getUserDetails);
  if (response === undefined) {
    res.status(404);
    res.send("User ID not found");
  } else if (content === "") {
    res.status(400);
    res.send("Content cannot be empty");
  } else {
    const createPost = `
  INSERT INTO POSTS(content,userid)
  VALUES ('${content}', ${userid});
  `;
    const getResponse = await db.run(createPost);
    const lastid = getResponse.lastID;
    res.status(200);
    res.send("Successfully created");
  }
});

// API 3 DELETE USER POSTS BASED ON POST ID
app.delete("/api/deletepost/:postId/", async (req, res) => {
  const { postId } = req.params;
  const getPostId = `SELECT id FROM POSTS WHERE id = ${postId};`;
  const getResponse = await db.get(getPostId);
  console.log(getResponse);
  if (getResponse === undefined) {
    res.status(404);
    res.send("Post ID not found");
  } else {
    const deletePost = `DELETE FROM POSTS WHERE id = ${postId};`;
    const getDeleteResponse = await db.run(deletePost);
    res.status(200);
    res.send("Successful post deletion");
  }

  /* To CREATE THE THIRD CONDITION I NEDD 
  A JWT TOKEN BUT YOU DIDN'T SAID THAT TO RAISE A JWT TOKEN 
  THAT'S WHY I'M UNABLE TO DO THE THIRD CONDITION......
  IF I HAVE JWT HERE'S HOW THE CODE LOOKS LIKE
  */

  /* Authentication 
    const authenticateUser = (request, response, next) => {
    let jwtToken;
    const authHeader = request.headers["authorization"];
    if (!authHeader) {
    response.status(404);
    response.send("Unauthorized to delete this post");
    } else {
    jwtToken = authHeader.split(" ")[1];
    jwt.verify(jwtToken, "MY_SECRET_KEY", (error, payload) => {
    if (error) {
        response.status(401);
        response.send("Unauthorized to delete this post");
    } else {
        request.username = payload.username;
        next();
      }
    });

 */
});

// API 4 FETCH USER ALL POST BASED ON USER ID
app.get("/API/posts/:userId/", async (req, res) => {
  const { userId } = req.params;
  const getUserId = `SELECT * FROM USER WHERE id = ${userId};`;
  const getUserResponse = await db.get(getUserId);
  const getPosts = `SELECT * FROM POSTS WHERE userid = ${userId};`;
  const getPostsResponse = await db.all(getPosts);
  if (getUserResponse === undefined) {
    res.status(404);
    res.send("User ID not found");
  } else if (getUserId !== undefined && getPostsResponse.length === 0) {
    res.status(404);
    res.send("No posts found for this user");
  } else {
    res.status(200);
    res.send({ posts: getPostsResponse });
  }
});

module.exports = app;
