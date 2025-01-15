require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://homerepairservicesbd.web.app",
      "https://homerepairservicesbd.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nu6ig.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // collection
    const usersCollection = client.db("UsersDB").collection("users");
    // find multiple user
    app.get("/allUsers", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // find one user api
    app.get("/users", async (req, res) => {
      let query = {};
      if (req.query.email) {
        query = { email: req.query.email };
      }
      try {
        const result = await usersCollection.findOne(query);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Internal Server Error" });
      }
    });

    // post user api
    app.post("/user", async (req, res) => {
      const { name, email, photo, role, coins } = req.body;
      console.table({ name, email, photo, role, coins });
      const userDocs = {
        name,
        email,
        photo,
        role: role,
        coins: role === "Worker" ? 10 : role === "Buyer" && 50,
      };
      const query = {
        email: email,
      };
      const exist = await usersCollection.findOne(query);
      if (exist) {
        res.status(403).statusMessage("Forbidden Access. User already exists");
      } else {
        const result = await usersCollection.insertOne(userDocs);
        res.send(result);
      }
    });

    // jwt token
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_ACCESS_TOKEN, {
        expiresIn: "2h",
      });
      res.send({ success: true, token });
    });

    // modify api
    app.patch("/deleteUser/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedRole = req.body.value;
      console.log(id, updatedRole);
      const updatedDocs = { $set: { role: updatedRole } };
      const result = await usersCollection.updateOne(query, updatedDocs);
      res.send(result);
    });

    // delete api

    // user delete api
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Port start ${port}`);
});
