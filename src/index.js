require('dotenv').config();
const express = require('express');


const configServer = require('./config/config_pipeline');
const websocket = require('./config/config_websocket');
let app = express();
let server = app.listen(3000,()=> console.log('escuchando en el puerto 3000 🏠'));

configServer(app);
websocket(server);

const mongoose = require('mongoose');


async function connectAndExecuteJobs(){
    try {
        await mongoose.connect(process.env.CONNECTION_MONGODB);

        console.log('______________MONGO CONNECTION STABLISHED');
        const db = mongoose.connection;
        const currentDate = new Date();

        // if(currentDate.getHours() === 3){
        //     await deleteUserDataFromDeletedAccounts(db);
        // }

    } catch (error) {
        console.log('MONGO CONNECTION FAILED_ _ _ _', error)
    }
}

async function deleteUserDataFromDeletedAccounts (db){
    try {
        const JobsCol = db.collection('jobs');
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
        const deleteAccounts = await JobsCol.find({ $and : [{createdAt: { $lt: tenDaysAgo }} , { task: "delete_account"}] }).toArray();
        let deleteUserids = new Set();
        deleteAccounts.forEach(acc => {
            deleteUserids.add(acc.userid)
        })
        
        const ChainReqs = db.collection('ChainRequests');
        const HalMatches = db.collection('HalfMatches');
        const Matches = db.collection('Matches');
        const Users = db.collection('Users');
        const Articles = db.collection('Articles');
        const Accounts = db.collection('Accounts');
        const Chats = db.collection('Chats'); 

    } catch (error) {
        
    }
}

connectAndExecuteJobs()