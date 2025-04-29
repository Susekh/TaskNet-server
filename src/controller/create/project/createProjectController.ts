import { MemberRole } from "@prisma/client";
import asyncHandler from "../../../utils/asyncHanlder.js";
import db from "../../../utils/db/db.js";
import { v4 as uuidv4 } from "uuid";

const createProjectController = (asyncHandler(async (req, res) => {
    const {userId, name, imgUrl} = req.body;
    console.log("body at project creation ::", req.body);
    

    if (!userId || !name) {
        return res.status(400).json({ err: "User ID and project name are required." });
    }

    try {
        // Check if user exists
        const user = await db.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }


        // Create the project
        const project = await db.project.create({
            data: {
                id: uuidv4(),
                name,
                imageUrl : imgUrl,
                inviteCode: uuidv4(),
                userId,
            },
        });

        
        const member = await db.member.create({
            data: {
              id : uuidv4(),
              userId : userId,  
              projectId : project.id, 
              role: MemberRole.ADMIN, 
            },
          });
          
        console.log("Member created successfully:", member);

        // Fetch the updated user with all related data
        const updatedUser = await db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                createdAt: true,
                name: true,
                dob: true,
                imgUrl: true,
                gender: true,
                projects: {
                    include: {
                        sprints: true,
                        members: true,
                    },
                },
                members: {
                    include: {
                        tasks : true,
                        project: true,
                        assingedIssues: true,
                    },
                },
            },
        });
        

        res.status(201).json({
            message: "Project created successfully.",
            user: updatedUser,
            projectId : project.id,
            project
        });
    } catch (error) {
        console.error("Error creating project:", error);
        res.status(500).json({ message: "Internal server error." });
    }
}))

export default createProjectController;