require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const allowedOrigins = [
  "http://localhost:5173",
  "https://workflow-bd.web.app",
  "https://workflow-bd.firebaseapp.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.options("*", cors()); // Preflight Request Handler
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// token verify
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access Denied" });
  }

  try {
    const decoded = jwt.verify(token, "your-secret-key");
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid or Expired Token" });
  }
};

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
    const TasksCollection = client.db("TasksDB").collection("Tasks");

    // find multiple user
    app.get("/allUsers", async (req, res) => {
      try {
        const role = req.query.role;

        let query = {};
        if (role) {
          query = { role: role };
        }

        const result = await usersCollection.find(query).toArray();
        res.status(200).json(result);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

    // get task api
    // app.get("/buyerTasks", async (req, res) => {
    //   const email = req.query.email;

    //   // Log the inputs for debugging
    //   console.log("Query Email:", email);
    //   console.log("Decoded User Email:", req.user?.email);

    //   if (req.user?.email === email) {
    //     try {
    //       const query = { buyer_email: email };
    //       const result = await TasksCollection.find(query).toArray();
    //       res.send(result);
    //     } catch (error) {
    //       console.error("Database Error:", error);
    //       res.status(500).send({ message: "Server Error" });
    //     }
    //   } else {
    //     return res
    //       .status(403)
    //       .send({ message: "Unauthorized or Email Mismatch" });
    //   }
    // });
    app.get("/buyerTasks", async (req, res) => {
      const email = req.query.email;
      const query = { buyer_email: email };
      const result = await TasksCollection.find(query).toArray();
      res.send(result);
    });

    // get all task api
    app.get("/tasks", async (req, res) => {
      const result = await TasksCollection.find().toArray();
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
        return res
          .status(403)
          .statusMessage("Forbidden Access. User already exists");
      } else {
        const result = await usersCollection.insertOne(userDocs);
        res.send(result);
      }
    });

    // task post api
    app.post("/tasks", async (req, res) => {
      const task = req.body;
      const result = await TasksCollection.insertOne(task);
      res.send(result);
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

    // task details patch api
    app.patch("/updateTask/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const { task_title, task_detail, submission_info } = req.body.updatedData;
      console.table({ task_title, task_detail, submission_info });
      const updated = {
        $set: {
          task_title: task_title,
          task_detail: task_detail,
          submission_info: submission_info,
        },
      };
      const result = await TasksCollection.updateOne(query, updated);
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

    // task delete api
    app.delete("/taskDelete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await TasksCollection.deleteOne(query);
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
