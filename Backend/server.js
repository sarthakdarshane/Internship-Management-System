const express= require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");

require("dotenv").config();

const pool = require("./config/database");


const app=express();

app.use(cors());

app.use(express.json());

app.use("/api/auth", authRoutes);


app.get("/" , (req, res)=>{
    res.json({
        message : "Internship Management System API is running"
    });
});

app.get("/db-test", async(req, res)=>{
    try{
        const result = await pool.query("SELECT NOW()");    

        res.json({
            message:"Database Conncected successfully",
            time:result.rows[0].now
        });


    }catch(error){
        console.error(error);

        res.status(500).json({
            message: "Database Conncection failed"
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT , ()=>{
    console.log(`Server running on port ${PORT}`);

});