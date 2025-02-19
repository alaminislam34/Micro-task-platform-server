require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
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

app.options("*", cors());
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
    const withdrawalsCollection = client
      .db("WithdrawalsDB")
      .collection("withdraw");
    const notificationCollection = client
      .db("NotificationDB")
      .collection("notifications");

    const paymentHistoryCollection = client
      .db("PaymentDB")
      .collection("payments");

    // verify admin
    const verifyAdmin = async (req, res, next) => {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).message({ message: "Access Denied" });
      }

      try {
        const decoded = jwt.verify(token, process.env.SECRET_ACCESS_TOKEN);
        req.user = { email: decoded.email };

        const user = await usersCollection.findOne({ email: req.user.email });

        if (!user || user.role !== "Admin") {
          return res.status(403).message({ message: "Admin Access Required" });
        }

        next();
      } catch (error) {
        res.status(403).message({ message: "Invalid or Expired Token" });
      }
    };

    // verify buyer
    const verifyBuyerOrAdmin = async (req, res, next) => {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).message({ message: "Access Denied" });
      }

      try {
        const decoded = jwt.verify(token, process.env.SECRET_ACCESS_TOKEN);
        req.user = { email: decoded.email };

        const user = await usersCollection.findOne({ email: req.user.email });

        if (!user || (user.role !== "Buyer" && user.role !== "Admin")) {
          return res.status(403).message({ message: "Buyer Access Required" });
        }

        next();
      } catch (error) {
        res.status(403).message({ message: "Invalid or Expired Token" });
      }
    };

    // verify buyer
    // ==========================
    const verifyBuyer = async (req, res, next) => {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).message({ message: "Access Denied" });
      }

      try {
        const decoded = jwt.verify(token, process.env.SECRET_ACCESS_TOKEN);
        req.user = { email: decoded.email };

        const user = await usersCollection.findOne({ email: req.user.email });

        if (!user || user.role !== "Buyer") {
          return res.status(403).message({ message: "Buyer Access Required" });
        }

        next();
      } catch (error) {
        res.status(403).message({ message: "Invalid or Expired Token" });
      }
    };

    // find multiple user
    // ==========================
    app.get("/allUsers", async (req, res) => {
      const { name, role } = req.query;
      try {
        let query = {};
        if (role) {
          query.role = role;
        }
        if (name) {
          query.name = { $regex: name, $options: "i" };
        }
        const users = await usersCollection.find(query).toArray();
        res.send(users);
      } catch (error) {
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

    // get task api
    // ==========================
    app.get("/buyerTasks", verifyBuyer, verifyToken, async (req, res) => {
      const email = req.query.email;
      const query = { buyer_email: email };
      const result = await TasksCollection.find(query).toArray();
      res.send(result);
    });

    // get all task api
    // ==========================
    app.get("/tasks", async (req, res) => {
      const result = await TasksCollection.find().toArray();
      res.send(result);
    });

    // get id base task api
    // ==========================
    app.get("/tasks/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await TasksCollection.findOne(query);
      res.send(result);
    });

    // find one user api
    // ==========================
    app.get("/users", async (req, res) => {
      let query = {};
      if (req.query.email) {
        query = { email: req.query.email };
      }
      try {
        const result = await usersCollection.findOne(query);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Internal Server Error" });
      }
    });

    // submission task get api
    // ==========================
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

    // withdrawals request get api
    // ==========================
    app.get("/withdrawRequests", verifyToken, async (req, res) => {
      const result = await withdrawalsCollection.find().toArray();
      res.send(result);
    });

    // get notification api
    // ==========================
    app.get("/notifications", verifyToken, async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) {
          return res
            .status(400)
            .send({ message: "Email query parameter is required" });
        }

        const query = { toEmail: email };

        const result = await notificationCollection
          .find(query)
          .sort({ time: -1 })
          .toArray();

        if (result.length === 0) {
          return res.status(404).send({ message: "No notifications found." });
        }

        res.status(200).send(result);
      } catch (error) {
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

    // post user api
    // ==========================
    app.post("/user", async (req, res) => {
      const { name, email, photo, role } = req.body;
      if (!name && !email && !photo && !role) {
        return;
      }
      const userDocs = {
        name: name,
        email: email,
        photo: photo,
        role: role,
        coins: role === "Worker" ? 10 : role === "Buyer" && 50,
      };
      const query = {
        email: email,
      };
      const exist = await usersCollection.findOne(query);
      if (exist) {
        return;
      } else {
        const result = await usersCollection.insertOne(userDocs);
        res.send(result);
      }
    });

    // task post api done
    // ==========================
    app.post("/tasks", verifyToken, verifyBuyer, async (req, res) => {
      const task = req.body;
      const result = await TasksCollection.insertOne(task);
      res.send(result);
    });

    // jwt token
    // ==========================
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_ACCESS_TOKEN, {
        expiresIn: "2h",
      });
      res.send({ success: true, token });
    });

    // post submission api
    // ==========================
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

    // withdrawals request api
    // ==========================
    app.post("/withdrawals", verifyToken, async (req, res) => {
      const { withdrawalData } = req.body;
      const {
        worker_email: worker_email,
        worker_name: worker_name,
        withdrawal_coin: withdrawal_coin,
        withdrawal_amount: withdrawal_amount,
        payment_system: payment_system,
        account_number: account_number,
        withdraw_date: withdraw_date,
        status: status,
      } = withdrawalData;
      const postRequest = {
        worker_email,
        worker_name,
        withdrawal_coin,
        withdrawal_amount,
        payment_system,
        account_number,
        withdraw_date,
        status,
      };

      const result = await withdrawalsCollection.insertOne(postRequest);
      res.send(result);
    });

    // user coin modify api
    // ==========================
    app.patch("/coinModify", verifyToken, async (req, res) => {
      const { email, newCoin } = req.body;
      const query = { email: email };
      const updateCoin = { $set: { coins: newCoin } };
      const result = await usersCollection.updateOne(query, updateCoin);
      res.send(result);
    });

    // modify a
    // ==========================
    app.patch(
      "/updateUserRole/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const updatedRole = req.body.value;
        const updatedDocs = { $set: { role: updatedRole } };
        const result = await usersCollection.updateOne(query, updatedDocs);
        res.send(result);
      }
    );

    // task details patch api done
    //  ======================
    app.patch("/updateTask/:id", verifyToken, verifyBuyer, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const { task_title, task_detail, submission_info } = req.body.updatedData;
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

    // task delete api
    // ==========================
    app.delete(
      "/taskDelete/:id",
      verifyToken,
      verifyBuyerOrAdmin,
      async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await TasksCollection.deleteOne(query);

        res.send(result);
      }
    );

    // required worker update api
    // ==========================
    app.patch("/updateRequiredWorkers/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const { remainingWorkers } = req.body;
      const query = { _id: new ObjectId(id) };
      const updateWorkers = { $set: { required_workers: remainingWorkers } };
      const result = await TasksCollection.updateOne(query, updateWorkers);
      res.send(result);
    });

    // approve submission api done
    // ==========================
    app.patch(
      "/approveSubmission/:id",
      verifyToken,
      verifyBuyer,
      async (req, res) => {
        const id = req.params.id;
        const { amount, workerEmail, task_title, buyer_name } = req.body;

        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: "Invalid ID format." });
        }

        const query = { _id: new ObjectId(id) };
        const updateStatus = { $set: { status: "approved" } };

        try {
          const result = await submissionCollection.updateOne(
            query,
            updateStatus
          );
          if (result && result.modifiedCount > 0) {
            const message = `You have earned ${amount} coins from ${buyer_name} for completing ${task_title}`;
            const notification = {
              message: message,
              toEmail: workerEmail,
              actionRoute: "/dashboard/worker",
              time: new Date(),
            };

            const workerQuery = { email: workerEmail };
            const worker = await usersCollection.findOne(workerQuery);

            if (worker) {
              const updatedCoins =
                (parseInt(worker.coins) || 0) + (parseInt(amount) || 0);
              const updateCoin = { $set: { coins: updatedCoins } };

              await usersCollection.updateOne(workerQuery, updateCoin);
              await notificationCollection.insertOne(notification);

              res.status(200).send({
                message:
                  "Submission approved, coins updated, and notification sent.",
              });
            } else {
              res.status(404).send({ message: "Worker not found." });
            }
          } else {
            res.status(400).send({ message: "Failed to approve submission." });
          }
        } catch (error) {
          res.status(500).send({ message: "Server error." });
        }
      }
    );

    // withdrawal request approve api
    // ==========================
    app.patch(
      "/approveWithdrawal/:id",
      verifyAdmin,
      verifyToken,
      async (req, res) => {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: "Invalid ID provided" });
        }
        const query = { _id: new ObjectId(id) };
        const { adminName, workerEmail, email, amount } = req.body;

        if (!email || !amount || typeof amount !== "number" || amount <= 0) {
          return res.status(400).json({ error: "Invalid email or amount" });
        }

        try {
          const updateStatus = { $set: { status: "approved" } };
          const result = await withdrawalsCollection.updateOne(
            query,
            updateStatus
          );

          if (result.modifiedCount === 0) {
            return res
              .status(404)
              .json({ error: "Withdrawal request not found" });
          }

          const emailQuery = { email: email };
          const worker = await usersCollection.findOne(emailQuery);
          const message = `Your withdrawal request of ${amount} coins has been approved by ${adminName}`;

          const notification = {
            message: message,
            toEmail: workerEmail,
            actionRoute: "/dashboard/worker",
            time: new Date(),
          };

          if (!worker) {
            return res.status(404).json({ error: "User not found" });
          }

          if (worker.coins < amount) {
            return res.status(400).json({ error: "Insufficient coins" });
          }

          const updateCoin = { $set: { coins: worker.coins - amount } };
          await usersCollection.updateOne(emailQuery, updateCoin);
          await notificationCollection.insertOne(notification);

          return res.status(200).json({
            message: "Withdrawal approved and coins deducted successfully",
          });
        } catch (error) {
          return res.status(500).json({ error: "Internal server error" });
        }
      }
    );

    // reject submissions api
    // ==========================
    app.patch(
      "/rejectSubmission/:id",
      verifyBuyer,
      verifyToken,
      async (req, res) => {
        try {
          const id = req.params.id;
          const { taskId, taskTitle, buyerName, workerEmail } = req.body;
          console.table({ taskId, taskTitle, buyerName, workerEmail });

          if (!taskId) {
            return res.status(400).send({ message: "Task ID is required." });
          }

          const query = { _id: new ObjectId(id) };
          const updateStatus = { $set: { status: "rejected" } };
          const result = await submissionCollection.updateOne(
            query,
            updateStatus
          );

          if (result.modifiedCount > 0) {
            const taskQuery = { _id: new ObjectId(taskId) };
            const task = await TasksCollection.findOne(taskQuery);
            const message = `Your submission for the task "${taskTitle}" was rejected by ${buyerName}. Please check the task details or contact the buyer for clarification.`;
            const notification = {
              message: message,
              toEmail: workerEmail,
              actionRoute: "/dashboard/Worker",
              time: new Date(),
            };
            await notificationCollection.insertOne(notification);

            if (task) {
              const newWorkerCount = parseInt(task.required_workers) + 1;
              const updateWorker = {
                $set: { required_workers: newWorkerCount },
              };

              const taskUpdateResult = await TasksCollection.updateOne(
                taskQuery,
                updateWorker
              );

              if (taskUpdateResult.modifiedCount > 0) {
                return res.status(200).send({
                  message: "Submission rejected and worker count updated.",
                });
              } else {
                return res
                  .status(500)
                  .send({ message: "Failed to update worker count." });
              }
            } else {
              return res.status(404).send({ message: "Task not found." });
            }
          } else {
            return res
              .status(400)
              .send({ message: "Failed to update submission status." });
          }
        } catch (error) {
          return res.status(500).send({ message: "Internal server error." });
        }
      }
    );

    // update user name or image
    // ==========================
    app.patch("/updateUserProfile", verifyToken, async (req, res) => {
      const { email } = req.query;
      const { photo, name } = req.body;

      // Check for required fields
      if (!email || (!photo && !name)) {
        return res
          .status(400)
          .send("Access denied: Missing email or update data");
      }

      try {
        const query = { email: email };
        const user = await usersCollection.findOne(query);

        // Check if user exists
        if (!user) {
          return res.status(404).send("User not found");
        }

        // Prepare update data
        const update = {};
        if (photo) update.photo = photo;
        if (name) update.name = name;

        // Update user data
        const result = await usersCollection.updateOne(query, { $set: update });

        // Check if update was successful
        if (result.modifiedCount === 0) {
          return res
            .status(400)
            .send("No changes were made to the user profile");
        }

        // Successful response
        res.status(200).send("Profile updated successfully");
      } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).send("Internal server error");
      }
    });

    // user delete api
    // ==========================
    app.delete("/users/:id", verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    // get payment history
    // ==========================
    app.get("/paymentHistory", verifyBuyer, verifyToken, async (req, res) => {
      const email = req.query.email;
      const query = { buyer_email: email };
      const result = await paymentHistoryCollection.find(query).toArray();
      res.send(result);
    });

    // post payment history
    // ==========================
    app.post("/paymentHistory", verifyBuyer, verifyToken, async (req, res) => {
      const notification = req.body;
      const result = await paymentHistoryCollection.insertOne(notification);
      res.send(result);
    });

    // payment api
    // ==========================
    app.post(
      "/create-payment-intent",
      verifyBuyer,
      verifyToken,
      async (req, res) => {
        try {
          const { coins, price, email } = req.body;

          if (!coins || !price || !email) {
            return res.status(400).send({ message: "Missing required fields" });
          }

          const amount = parseInt(price * 100);

          // Create Payment Intent
          const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: "usd",
            payment_method_types: ["card"],
          });

          res.send({
            clientSecret: paymentIntent.client_secret,
          });
        } catch (error) {
          res.status(500).send({ message: "Internal server error" });
        }
      }
    );

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
