import asyncHandler from "../../utils/asyncHanlder.js";
import db from "../../utils/db/db.js";

const FetchConversationsController = asyncHandler(async (req, res) => {
  const { conversationId } = req.body;

  console.log("Fetching messages for conversation ::", conversationId);

  // ✅ Validate input
  if (!conversationId || typeof conversationId !== "string" || conversationId.trim() === "") {
    return res.status(400).json({
      status: "failed",
      statusCode: 400,
      message: "Missing or invalid 'conversationId' in request body.",
    });
  }

  // ✅ Check if the conversation exists
  const conversation = await db.conversation.findUnique({
    where: {
      id: conversationId,
    },
  });

  if (!conversation) {
    return res.status(204).json({
      status: "failed",
      statusCode: 204,
      message: "Initiate a conversation",
    });
  }

  // ✅ Fetch messages in this conversation
  const messages = await db.directMessage.findMany({
    where: {
      conversationId,
    },
    include: {
      member: {
        include: {
          user: {
            select: {
              name: true,
              imgUrl: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return res.status(200).json({
    status: "success",
    statusCode: 200,
    message: "Direct messages fetched successfully.",
    directMessages: messages ? messages : [],
  });
});

export default FetchConversationsController;
