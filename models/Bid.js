
import mongoose from 'mongoose'

const bidSchema = new mongoose.Schema({
    auctionId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Auction',
        required: true 
    },
    bids: [{
        bidderId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User',
            required: true 
        },
        bidderEmail: {
            type: String,
            required: true
        },
        bidderName: {
            type: String,
            required: true
        },
        // quantity: { 
        //     type: Number, 
        //     required: true,
        //     min: 1
        // },
        bidAmount: { 
            type: Number, 
            required: true,
            min: 0
        },
        bidTime: { 
            type: Date, 
            default: Date.now 
        },
        status: {
            type: String,
            enum: ['active', 'outbid', 'won'],
            default: 'active'
        }
    }],
    highestBid: { 
        type: Number, 
        default: 0 
    },
    highestBidder: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    totalBids: {
        type: Number,
        default: 0
    }
}, { timestamps: true })

// Auto-update highest bid and bidder
bidSchema.pre('save', function(next) {
    if (this.bids.length > 0) {
        const highestBid = this.bids.reduce((max, bid) => 
            bid.bidAmount > max.bidAmount ? bid : max, 
            this.bids[0]
        )
        
        this.highestBid = highestBid.bidAmount
        this.highestBidder = highestBid.bidderId
        this.totalBids = this.bids.length
        
        // Update bid statuses
        this.bids.forEach(bid => {
            bid.status = bid.bidAmount === this.highestBid ? 'active' : 'outbid'
        })
    }
    next()
})

// Indexes for performance
bidSchema.index({ auctionId: 1, highestBid: -1 })
bidSchema.index({ 'bids.bidderId': 1, 'bids.status': 1, 'bids.bidAmount': 1 })

const Bid = mongoose.models.Bid || mongoose.model('Bid', bidSchema)
export default Bid