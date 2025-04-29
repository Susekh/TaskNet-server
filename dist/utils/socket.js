import { Server } from "socket.io";
import db from "./db/db.js";
const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            credentials: true,
        },
    });
    // Track active connections for logging purposes
    const activeConnections = new Map();
    io.on("connection", (socket) => {
        console.log(`🔌 New connection: ${socket.id}`);
        activeConnections.set(socket.id, { rooms: new Set() });
        socket.on("joinChat", async ({ senderId, receiverId }) => {
            try {
                if (!senderId || !receiverId) {
                    throw new Error("Missing sender or receiver ID");
                }
                // Create consistent room name by sorting IDs
                const roomName = [senderId, receiverId].sort().join("");
                // Add to active connections tracking
                const connectionInfo = activeConnections.get(socket.id);
                if (connectionInfo) {
                    connectionInfo.rooms.add(roomName);
                    connectionInfo.senderId = senderId;
                }
                socket.join(roomName);
                console.log(`👥 Socket ${socket.id} joined direct message room ${roomName}`);
                // Check if the conversation exists
                const [memberOneId, memberTwoId] = [senderId, receiverId].sort();
                const existingConversation = await db.conversation.findFirst({
                    where: {
                        OR: [
                            { id: roomName },
                            {
                                AND: [
                                    { memberOneId },
                                    { memberTwoId }
                                ]
                            }
                        ]
                    }
                });
                // If conversation doesn't exist, verify members and create it
                if (!existingConversation) {
                    // Check if both members exist
                    const memberOne = await db.member.findUnique({ where: { id: memberOneId } });
                    const memberTwo = await db.member.findUnique({ where: { id: memberTwoId } });
                    if (memberOne && memberTwo) {
                        console.log(`Creating conversation between ${memberOneId} and ${memberTwoId}`);
                        // Create conversation with consistent ID
                        await db.conversation.create({
                            data: {
                                id: roomName,
                                memberOneId,
                                memberTwoId,
                            }
                        });
                    }
                    else {
                        console.warn(`Cannot create conversation: One or both members don't exist`);
                    }
                }
                socket.to(roomName).emit("userJoined", {
                    socketId: socket.id,
                    memberId: senderId
                });
            }
            catch (err) {
                console.error("❌ Error joining chat:", err);
                socket.emit("error", { message: `Failed to join chat: ${err.message}` });
            }
        });
        socket.on("sendChatMessage", async ({ conversationId, memberId, receiverId, name, message }) => {
            try {
                if (!memberId || !message) {
                    throw new Error("Missing required message data");
                }
                console.log(`Processing message from ${memberId} to ${receiverId}`);
                // Determine the room name consistently
                const roomName = conversationId || [memberId, receiverId].sort().join("");
                // Find existing or create conversation
                let conversation = await db.conversation.findUnique({
                    where: { id: roomName }
                });
                if (!conversation) {
                    // Try to find by member IDs
                    const [memberOneId, memberTwoId] = [memberId, receiverId].sort();
                    conversation = await db.conversation.findFirst({
                        where: {
                            memberOneId,
                            memberTwoId
                        }
                    });
                    // If still not found, verify members and create new conversation
                    if (!conversation) {
                        const memberOne = await db.member.findUnique({ where: { id: memberOneId } });
                        const memberTwo = await db.member.findUnique({ where: { id: memberTwoId } });
                        if (!memberOne || !memberTwo) {
                            throw new Error("Cannot create conversation: One or both members don't exist");
                        }
                        conversation = await db.conversation.create({
                            data: {
                                id: roomName,
                                memberOneId,
                                memberTwoId
                            }
                        });
                        console.log(`Created conversation: ${conversation.id}`);
                    }
                }
                // Create the message
                const newMessage = await db.directMessage.create({
                    data: {
                        content: message,
                        memberId,
                        conversationId: conversation.id
                    },
                    include: {
                        member: {
                            select: {
                                user: {
                                    select: {
                                        name: true,
                                        imgUrl: true
                                    }
                                }
                            }
                        }
                    }
                });
                // Make sure we're in the room before emitting
                socket.join(conversation.id);
                // Broadcast the message to everyone in the room
                io.to(conversation.id).emit("receiveDirectMessage", newMessage);
                console.log(`📨 Message sent to room ${conversation.id}`);
            }
            catch (err) {
                console.error("❌ Error sending direct message:", err);
                socket.emit("error", { message: `Failed to send message: ${err.message}` });
            }
        });
        socket.on("joinGroupChat", (groupId) => {
            if (!groupId) {
                socket.emit("error", { message: "Missing group ID" });
                return;
            }
            const roomName = `group-${groupId}`;
            socket.join(roomName);
            // Add to tracking
            const connectionInfo = activeConnections.get(socket.id);
            if (connectionInfo) {
                connectionInfo.rooms.add(roomName);
                connectionInfo.currentGroup = groupId;
            }
            console.log(`👥 Socket ${socket.id} joined group chat ${roomName}`);
            socket.to(roomName).emit("userJoined", {
                socketId: socket.id,
                groupId
            });
        });
        socket.on("sendGroupMessage", async ({ groupId, senderId, name, message }) => {
            const roomName = `group-${groupId}`;
            try {
                if (!groupId || !senderId || !message) {
                    throw new Error("Missing required message data");
                }
                // Verify member exists
                const member = await db.member.findUnique({
                    where: { id: senderId }
                });
                if (!member) {
                    throw new Error("Member doesn't exist");
                }
                // Verify task/group exists
                const task = await db.task.findUnique({
                    where: { id: groupId }
                });
                if (!task) {
                    throw new Error("Task/Group doesn't exist");
                }
                const msg = await db.message.create({
                    data: {
                        content: message,
                        memberId: senderId,
                        taskId: groupId,
                        name: name
                    },
                    include: {
                        member: {
                            include: {
                                user: true
                            }
                        }
                    }
                });
                console.log(`Group message created for ${groupId}`);
                // Broadcast to room
                io.to(roomName).emit("receiveGroupMessage", {
                    message: msg,
                    sender: socket.id
                });
                console.log(`📨 Group message sent to ${roomName}`);
            }
            catch (err) {
                console.error("❌ Error saving group message:", err);
                socket.emit("error", { message: `Failed to send group message: ${err.message}` });
            }
        });
        socket.on("disconnect", () => {
            const connectionInfo = activeConnections.get(socket.id);
            if (connectionInfo) {
                // Notify rooms of departure
                connectionInfo.rooms.forEach(room => {
                    socket.to(room).emit("userLeft", {
                        socketId: socket.id,
                        memberId: connectionInfo.senderId
                    });
                });
                activeConnections.delete(socket.id);
            }
            console.log(`🔌 Socket ${socket.id} disconnected`);
        });
    });
};
export { initializeSocket };
//# sourceMappingURL=socket.js.map