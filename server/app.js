import express from "express";
import cors from "cors";

const app = express();


app.use(express.json());

app.use(cors({
    origin: "http://localhost:5173", // Replace with your frontend's URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
}));


app.get("/", (req, res) => {
     res.send("Hello World");
    })

  

app.get("/api/parts", (req, res, next) => {
    const parts = [
        { id: 1, name: "Part A", area: "Area 1", partsPerHanger: 5, status: "Active" },
        { id: 2, name: "Part B", area: "Area 2", partsPerHanger: 10, status: "Inactive" },
    ];

    res.json(parts);
});


app.listen(4000, function(){
    console.log("Server is running on port 4000");
})

