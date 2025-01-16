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
    const decoded = jwt.verify(token, process.env.SECRET_ACCESS_TOKEN);
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
    const submissionCollection = client
      .db("SubmissionDB")
      .collection("Submissions");

    // find multiple user
    app.get("/allUsers", verifyToken, async (req, res) => {
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
    app.get("/buyerTasks", verifyToken, async (req, res) => {
      const email = req.query.email;
      const query = { buyer_email: email };
      const result = await TasksCollection.find(query).toArray();
      res.send(result);
    });

    // get all task api
    app.get("/tasks", verifyToken, async (req, res) => {
      const result = await TasksCollection.find().toArray();
      res.send(result);
    });

    // get id base task api
    app.get("/tasks/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await TasksCollection.findOne(query);
      res.send(result);
    });

    // find one user api
    app.get("/users", verifyToken, async (req, res) => {
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

    // submission task get api
    app.get("/submissions", verifyToken, async (req, res) => {
      const b_email = req.query.b_email;
      const w_email = req.query.w_email;
      const query = {};

      if (b_email) {
        query.buyer_email = b_email;
      }
      if (w_email) {
        query.worker_email = w_email;
      }
      const result = await submissionCollection.find(query).toArray();
      res.send(result);
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
    app.post("/tasks", verifyToken, async (req, res) => {
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

    // post submission api
    app.post("/submissions", verifyToken, async (req, res) => {
      const {
        task_id,
        task_title,
        payable_amount,
        worker_email,
        worker_name,
        buyer_email,
        buyer_name,
        submission_details,
        current_date,
        status,
      } = req.body;
      const newSubmission = {
        task_id,
        task_title,
        payable_amount,
        worker_email,
        worker_name,
        buyer_email,
        buyer_name,
        submission_details,
        current_date,
        status,
      };
      const result = await submissionCollection.insertOne(newSubmission);
      res.send(result);
    });

    // user coin modify api
    app.patch("/coinModify", verifyToken, async (req, res) => {
      const { email, newCoin } = req.body;
      console.table({ email, newCoin });
      const query = { email: email };
      const updateCoin = { $set: { coins: newCoin } };
      const result = await usersCollection.updateOne(query, updateCoin);
      res.send(result);
    });

    // modify api
    app.patch("/deleteUser/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedRole = req.body.value;
      console.log(id, updatedRole);
      const updatedDocs = { $set: { role: updatedRole } };
      const result = await usersCollection.updateOne(query, updatedDocs);
      res.send(result);
    });

    // task details patch api
    app.patch("/updateTask/:id", verifyToken, async (req, res) => {
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

    // submission approve api
    app.patch("/approveSubmission/:id", async (req, res) => {
      const submissionId = req.params.id;
      const { task_id, amount } = req.body;

      try {
        // Validate Input
        if (!submissionId || !workerId || !amount) {
          return res.status(400).send({ message: "Invalid data provided" });
        }

        // Find the submission
        const submission = await submissionCollection.findOne({
          _id: new ObjectId(submissionId),
        });

        if (!submission) {
          return res.status(404).send({ message: "Submission not found" });
        }

        if (submission.status === "approve") {
          return res
            .status(400)
            .send({ message: "Submission already approved" });
        }

        // Update worker's coin balance
        const workerUpdateResult = await workersCollection.updateOne(
          { _id: new ObjectId(workerId) },
          { $inc: { coins: amount } } // Increment coins by the payable amount
        );

        if (workerUpdateResult.modifiedCount === 0) {
          return res.status(404).send({ message: "Worker not found" });
        }

        // Update submission status to "approve"
        const submissionUpdateResult = await submissionCollection.updateOne(
          { _id: new ObjectId(submissionId) },
          { $set: { status: "approve" } }
        );

        if (submissionUpdateResult.modifiedCount === 0) {
          return res
            .status(500)
            .send({ message: "Failed to update submission status" });
        }

        res.send({
          success: true,
          message: "Submission approved successfully",
        });
      } catch (error) {
        console.error("Error in approving submission:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });
    // required worker update api
    app.patch("/updateRequiredWorkers/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const { remainingWorkers } = req.body;
      const query = { _id: new ObjectId(id) };
      const updateWorkers = { $set: { required_workers: remainingWorkers } };
      const result = await TasksCollection.updateOne(query, updateWorkers);
      res.send(result);
    });

    // delete api

    // user delete api
    app.delete("/users/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    // task delete api
    app.delete("/taskDelete/:id", verifyToken, async (req, res) => {
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
