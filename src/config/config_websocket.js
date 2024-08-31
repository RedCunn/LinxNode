const socketio = require('socket.io');
const Chat = require('../schemas/Chat');

const ioFn = (httpServer) => {

    const io = new socketio.Server(httpServer, {
        cors: {
            origin : 'http://localhost:4200',
            methods: ['GET', 'POST'],
        }
    })

    io.on('connection', (socket) => {

        socket.on('userConnected',(data) => {
            socket.broadcast.emit('linx_connected', data.linxname);
        })
        socket.on('init_user_room',(data) => {
            console.log('INIT USER ROOM ...', data.roomkey)
            socket.join(data.roomkey);
        })
        socket.on('init_chat',(data) => {
            console.log('CHAT INITIALIZED ........',data)
            socket.join(data.roomkey);
        })

        socket.on('req_init_chat',(data) => {
            console.log('REQUESTING CHAT ........',data)
            socket.join(data.roomkey);
            io.to(data.touserid).emit('chat_req', {userid : data.fromuserid ,roomkey : data.roomkey});
        })

        socket.on('chat_message', (data) => {
            console.log('config websocket chat_message : ', data)
            io.to(data.roomkey).emit('get_message',data.message)
        })

        socket.on('readMessages', (data) => {
            const reader = {roomkey : data.roomkey, userid : data.userid, read : true };
            io.to(data.roomkey).emit('readingMessages', reader)
        })

        socket.on('messageRead' , async(data) => {
            try {
                console.log('MESSAGE ON SOCKET TO READ : ', data)
                await Chat.updateOne({'messages._id' : data.message._id},{$set : {'messages.$.isRead' : true}})
                console.log(`Message ${data.message._id} marked as read by user ${data.userid}`);
                io.to(data.senderid).emit('get_your_message_read',{message : data.message})
            } catch (error) {
                console.error('Error updating message read status:', err);
            }
        })

        socket.on('full_connection', (data)=> {
            console.log('SOCKET ON FULL CONNECTION................. ', data)
            io.to(data.from_user.userid).emit('get_interaction',{type : 'connection', from: data.to_user})
            io.to(data.to_user.userid).emit('get_interaction',{type : 'connection', from: data.from_user})
        })

        socket.on('on_req_chain', (data)=> {
            console.log('on REQ CHAIN :',data)
            const chainsMap = new Map(Object.entries(data.chains));
            
            for (const [key , value] of chainsMap) {
                io.to(data.to_userid).emit('get_interaction',{type : 'reqchain', from: data.from_user , chain : {chainid : key , chainname : value}})       
            }
        })
        socket.on('on_reject_req_chain', (data)=> {
            console.log('on REJECT REQ CHAIN :',data)
            io.to(data.to_userid).emit('get_interaction',{type : 'rejectchain', from: data.from_user , chain : data.chain})
        })
        socket.on('on_chain', (data)=> {
            console.log('on CHAIN :',data)
            io.to(data.to_userid).emit('get_interaction',{type : 'chain',from: data.from_user , chain : data.chain})
        })
        socket.on("broken_chain", (data) => {
            io.to(data.to_userid).emit('get_interaction',{type : 'broken', from: data.from_user , chain : data.chain})
        })
        socket.on('new_event', (data)=> {
            //tengo que tener una roomkey para todos los de la misma cadena
            io.to(data.to_userid).emit('get_interaction',{type : 'event', interaction: data.event})
        })
        
        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    })   
}

module.exports = ioFn;