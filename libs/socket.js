import { Server } from "socket.io";

   let io = null;

   export function initializeSocket(server) {
       if (!io) {
           io = new Server(server, {
               cors: {
                   origin: "*",
                   methods: ["GET", "POST"],
                   credentials: true
               },
               path: "/socket.io/",
               transports: ["polling", "websocket"],
               pingTimeout: 60000,
               pingInterval: 25000,
               connectTimeout: 20000
           });

           io.on("connection", (socket) => {
               console.log(`User connected: ${socket.id}`);

               socket.on("authenticate", (userId) => {
                   socket.userId = userId;
                   console.log(`User ${userId} authenticated with socket ${socket.id}`);
               });

               socket.on("joinAuction", (auctionId) => {
                   socket.join(auctionId);
                   console.log(`🔹 Participant ${socket.id} joined auction ${auctionId}`);
               });

               socket.on("newBidIncrement", async (data) => {
                   const { auctionId, bidAmount, bidderName, bidderEmail, bidderId } = data;

                   if (!socket.rooms.has(auctionId)) {
                       socket.join(auctionId);
                       console.log(`🔹 Automatically joined auction ${auctionId} for ${socket.id}`);
                   }

                   console.log(`📢 Broadcasting bid in room: ${auctionId}`);

                   io.to(auctionId).emit("newBid", {
                       auctionId,
                       bidAmount,
                       bidderName,
                       bidderEmail,
                       bidderId
                   });

                   // Find the previous highest bidder and notify them specifically
                   const bid = await require('@/models/Bid').findOne({ auctionId });
                   if (bid && bid.bids.length > 1) {
                       const sortedBids = bid.bids.sort((a, b) => b.bidAmount - a.bidAmount);
                       const previousHighestBidder = sortedBids[1]?.bidderId;
                       if (previousHighestBidder && previousHighestBidder.toString() !== bidderId) {
                           const previousBidderSocket = Array.from(io.sockets.sockets.values()).find(
                               s => s.userId === previousHighestBidder.toString()
                           );
                           if (previousBidderSocket) {
                               previousBidderSocket.emit("outbid", {
                                   auctionId,
                                   bidAmount,
                                   bidderName,
                                   bidderEmail,
                                   bidderId,
                                   recipientId: previousHighestBidder
                               });
                           }
                       }
                   }
               });

               socket.on("disconnect", () => {
                   console.log(`User disconnected: ${socket.id}`);
               });

               socket.on("error", (error) => {
                   console.error(`Socket error for ${socket.id}:`, error);
               });
           });
       }
       return io;
   }

   export function getIO() {
       if (!io) {
           console.warn("Socket.IO has not been initialized! Initializing with default settings...");
           const http = require('http');
           const tempServer = http.createServer();
           io = initializeSocket(tempServer);
       }
       return io;
   }

   export { io };