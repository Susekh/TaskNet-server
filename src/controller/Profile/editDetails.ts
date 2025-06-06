import asyncHandler from "../../utils/asyncHanlder.js";
import db from "../../utils/db/db.js";

const editDetails = asyncHandler(async (req, res) => {
  const { username, name, email } = req.body.body;

  const user = req.user;
  if (!user || !user.id) {
    return res.status(401).json({
      status: "failed",
      statusCode: 401,
      errMsgs: { otherErr: { isErr: true, msg: "Unauthorized: user not found." } },
    });
  }

  const { id } = user;

  let formErr = [
    { field: "username", isErr: false, msg: "" },
    { field: "name", isErr: false, msg: "" },
    { field: "email", isErr: false, msg: "" },
  ];

  try {
    console.log("body at edi det ::", req.body.body.username);

    const userFromDb = await db.user.findFirst({
      where: {
        id: id,
      },
      select: {
        username: true,
        name: true,
        email: true,
      },
    });

    if (!userFromDb) {
      return res.status(404).json({
        status: "failed",
        statusCode: 200,
        errMsgs: {
          formErr: [...formErr, { field: "username", isErr: true, msg: "User doesn't exist" }],
        },
      });
    }

    if (username === userFromDb.username && email === userFromDb.email) {
      await db.user.update({
        where: {
          id: id,
        },
        data: {
          name: name,
        },
      });

      return res.status(201).json({
        status: "success",
        statusCode: 201,
        successMsg: "Profile updated successfully",
      });
    }

    const userNameExists = await db.user.findFirst({
      where: {
        username: username,
        NOT: {
          id: id,
        },
      },
    });

    const emailExists = await db.user.findFirst({
      where: {
        email: email,
      },
    });

    if (username === userFromDb.username && !emailExists) {
      await db.user.update({
        where: {
          username: username,
        },
        data: {
          name: name,
          email: email,
        },
      });

      return res.status(201).json({
        status: "success",
        statusCode: 201,
        successMsg: "Profile updated successfully",
      });
    }

    if (email === userFromDb.email && !userNameExists) {
      await db.user.update({
        where: {
          email: email,
        },
        data: {
          name: name,
          username: username,
        },
      });

      return res.status(201).json({
        status: "success",
        statusCode: 201,
        successMsg: "Profile updated successfully",
      });
    }

    if (userNameExists) {
      return res.status(400).json({
        status: "failed",
        statusCode: 200,
        errMsgs: {
          formErr: [...formErr, { field: "username", isErr: true, msg: "username already exists" }],
        },
      });
    }

    if (emailExists) {
      return res.status(400).json({
        status: "failed",
        statusCode: 200,
        errMsgs: {
          formErr: [...formErr, { field: "email", isErr: true, msg: "Email already exists" }],
        },
      });
    }

    await db.user.update({
      where: {
        id: id,
      },
      data: {
        username: username,
        email: email,
        name: name,
      },
    });

    return res.status(201).json({
      status: "success",
      statusCode: 201,
      successMsg: "Profile updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "failed",
      statusCode: 500,
      errMsgs: { otherErr: { isErr: true, msg: "Couldn't update the profile" } },
    });
  }
});

export default editDetails;
