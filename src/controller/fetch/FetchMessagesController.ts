import asyncHandler from "../../utils/asyncHanlder.js";
import db from "../../utils/db/db.js";

const FetchMessagesController = asyncHandler(async (req, res) => {
  try {
    const { taskId } = req.body;


    console.log("Task Id in messages :: ", req.body);
    

    const messages = await db.message.findMany({
      where: {
        taskId,
      },
      include : {
        member : {
          include : {
            user : true
          }
        }
      },
      orderBy : {
        createdAt : 'desc'
      }
    });



    if (!messages) {
      res.status(200).json({
        status: "success",
        statusCode: 200,
        message: "No messages found",
        chatMessages : [],
      });
    }

    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "message fetched",
      chatMessages : messages
    });

  } catch (error) {
    console.log("Error in Fetching messages ::", error);
    res.status(500).json({
      status: "failed",
      statusCode: 500,
      message: "Internal server error in fetching messages.",
      error: error.message,
    });
  }
});


export default FetchMessagesController;