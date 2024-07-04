// import mongoose, { isValidObjectId } from "mongoose"
import { Project } from "../models/project.model.js"
// import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import fs from "fs"

const getAllProjects = asyncHandler(async (req, res) => {
    try {
        // const {username} = req.params

        // if (!username?.trim()) {
        //     throw new ApiError(400, "username is missing")
        // }


        const projects = await Project.find().populate({
            path: "owner",
            select: "_id username profession mobile fullName avatar"
        });

        return res
            .status(200)
            .json(
                new ApiResponse(200, projects, "Projects fetched successfully")
            )
    } catch (error) {
        return res.status(error.statusCode || 500).json(
            new ApiError(error.statusCode, error.message || "Error Occur in Projects")
        )
    }
})

const myProjects = asyncHandler(async (req, res) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            throw new ApiError(400, "User id is missing")
        }

        const userProjects = await Project.find({ owner: userId }).populate({
            path: "owner",
            select: "_id username profession mobile fullName avatar"
        });

        return res
            .status(200)
            .json(new ApiResponse(200, userProjects, "User Projects Fetched successfully"))

    } catch (error) {
        return res.status(error.statusCode || 500).json(
            new ApiError(error.statusCode, error.message || "Error Occur in Projects")
        )
    }
})

const addProject = asyncHandler(async (req, res) => {
    try {
        const { title, status, domain, description, startOn, completedOn, shortDesc } = req.body
        const projectfile = req.file?.filename

        // console.log(description);

        if (!projectfile) {
            throw new ApiError(400, "Cover image is missing")
        }

        const userId = req.user?._id;

        if (!userId) {
            throw new ApiError(400, "User id is missing")
        }

        if (!domain) throw new ApiError(400, "domain field is required");
        if (!title) throw new ApiError(400, "title field is required");
        if (!status) throw new ApiError(400, "status field is required");
        if (!startOn) throw new ApiError(400, "startOn field is required");

        const project = await Project.create({
            title,
            domain,
            coverImage: projectfile,
            status,
            description,
            startOn,
            shortDesc,
            completedOn,
            owner: userId
        })

        const createdProject = await Project.findById(project._id).select()

        if (!createdProject) {
            throw new ApiError(500, "Something went wrong while adding Project detail")
        }

        return res.status(201).json(
            new ApiResponse(200, createdProject, "Project Detail Added Successfully")
        )
    } catch (error) {
        return res.status(error.statusCode || 500).json(
            new ApiError(error.statusCode, error.message || "Error Occur in Projects")
        )
    }


})

const getProjectById = asyncHandler(async (req, res) => {

    try {
        const { projectId } = req.query
        // console.log(projectId)
        if (!projectId?.trim()) {
            throw new ApiError(400, "Project Id is missing")
        }

        // console.log(projectId);
        const createdProject = await Project.findById(projectId).populate({
            path: "owner",
            select: "_id username profession mobile fullName avatar"
        });

        if (!createdProject) {
            throw new ApiError(500, "Something went wrong while geting project detail by id")
        }

        return res.status(201).json(
            new ApiResponse(200, createdProject, "Project Detail Fetched Successfully")
        )
    } catch (error) {
        return res.status(error.statusCode || 500).json(
            new ApiError(error.statusCode, error.message || "Error Occur in Projects")
        )
    }

})

const updateProject = asyncHandler(async (req, res) => {
    try {
        const { Id, title, status, description, startOn, completedOn, domain, shortDesc, } = req.body

        if (!Id?.trim()) { throw new ApiError(400, "Project Id is missing") }
        if (!domain) throw new ApiError(400, "domain field is required");
        if (!title) throw new ApiError(400, "title field is required");
        if (!status) throw new ApiError(400, "status field is required");
        if (!startOn) throw new ApiError(400, "startOn field is required");

        const projectfile = req.file?.filename

        if (!projectfile) {
            throw new ApiError(400, "Project file is missing")
        }

        const projectFile = await Project.findById(Id).select("coverImage");
        if (projectFile.coverImage && projectFile.coverImage != '') {
            fs.unlinkSync(`public/projectImage/${projectFile.coverImage}`);
        }

        const project = await Project.findByIdAndUpdate(
            Id, {
            title,
            domain,
            coverImage: projectfile,
            status,
            description,
            startOn,
            shortDesc,
            completedOn,

        },
            { new: true })

        return res
            .status(200)
            .json(new ApiResponse(200, project, "Project details updated successfully"))
    } catch (error) {
        return res.status(error.statusCode || 500).json(
            new ApiError(error.statusCode, error.message || "Error Occur in Projects")
        )
    }
})

const deleteProject = asyncHandler(async (req, res) => {
    try {
        const { Id } = req.query

        if (!Id?.trim()) {
            throw new ApiError(400, "Id is missing")
        }

        // console.log(projectId);
        const deleteProject = await Project.deleteOne({ _id: Id })

        if (deleteProject) {
            return res.status(201).json(
                new ApiResponse(200, "Project Detail Deleted Successfully")
            )
        } else {
            throw new ApiError(500, "Something went worng while deleting Project details")
        }
    } catch (error) {
        return res.status(error.statusCode || 500).json(
            new ApiError(error.statusCode, error.message || "Error Occur in Projects")
        )
    }


})


export {
    myProjects,
    getAllProjects,
    addProject,
    getProjectById,
    updateProject,
    deleteProject,
}
