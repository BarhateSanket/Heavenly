const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    conversation: {
        type: Schema.Types.ObjectId,
        ref: "Conversation",
        required: true
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient queries
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });

// Update conversation's lastMessage and lastMessageAt when a new message is saved
messageSchema.post('save', async function(doc) {
    try {
        await mongoose.model('Conversation').findByIdAndUpdate(
            doc.conversation,
            {
                lastMessage: doc._id,
                lastMessageAt: doc.createdAt,
                updatedAt: doc.createdAt
            }
        );
    } catch (error) {
        console.error('Error updating conversation after message save:', error);
    }
});

// Activity and notification generation hook
messageSchema.post('save', async function(doc) {
    if (doc.isNew) {  // Only for new documents
        const Activity = require('./activity');
        const Notification = require('./notification');

        // Get recipient from conversation
        let recipient = null;
        let recipientName = 'someone';
        try {
            const Conversation = mongoose.model('Conversation');
            const conversation = await Conversation.findById(doc.conversation)
                .populate('participants', 'username email');

            if (conversation && conversation.participants) {
                recipient = conversation.participants.find(p => !p._id.equals(doc.sender));
                if (recipient) {
                    recipientName = recipient.username || recipient.email || 'someone';
                }
            }
        } catch (error) {
            console.error('Error getting recipient for message activity:', error);
        }

        await Activity.create({
            actor: doc.sender,
            type: 'message_sent',
            target: doc._id,
            targetModel: 'Message',
            metadata: {
                recipientName: recipientName
            }
        });

        // Notify recipient of new message
        if (recipient) {
            await Notification.createNotification(
                recipient._id,
                'new_message',
                'New Message',
                `You have a new message from ${doc.sender.username || doc.sender.email || 'someone'}`,
                { messageId: doc._id, conversationId: doc.conversation, senderId: doc.sender }
            );
        }
    }
});

module.exports = mongoose.model("Message", messageSchema);