import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
// import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import fs from "fs"
import mongoose from "mongoose";


const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email,mobile
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    try {
        const { fullName, email, mobile, username, password } = req.body

        if (
            [fullName, email, mobile, username, password].some((field) => field?.trim() === "")
        ) {
            throw new ApiError(400, "All fields are required")
        }

        const existedUser = await User.findOne({
            $or: [{ username }, { mobile }, { email }]
        })

        if (existedUser) {
            throw new ApiError(409, "User with same email or username or mobile already exists")
        }

        const user = await User.create({
            fullName,
            mobile,
            email,
            password,
            username: username.toLowerCase()
        })

        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )

        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering the user")
        }

        return res.status(201).json(
            new ApiResponse(200, createdUser, "User registered Successfully")
        )

    } catch (error) {
        return res.status(error.statusCode || 500).json(
            new ApiError(error.statusCode, error.message || "Error Occur in Users")
        )
    }
})

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    // console.log(req);

    try {
        const { email, username, password } = req.body

        if (!username && !email) {
            throw new ApiError(400, "username or email is required")
        }

        // Here is an alternative of above code based on logic discussed in video:
        // if (!(username || email)) {
        //     throw new ApiError(400, "username or email is required")

        // }

        const user = await User.findOne({
            $or: [{ username }, { email }]
        })

        if (!user) {
            throw new ApiError(404, "User does not exist")
        }

        const isPasswordValid = await user.isPasswordCorrect(password)

        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid user credentials")
        }

        const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)

        const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: loggedInUser, accessToken, refreshToken
                    },
                    "User logged In Successfully"
                )
            )
    } catch (error) {
        return res.status(error.statusCode || 500).json(
            new ApiError(error.statusCode, error.message || "Error Occur in Users")
        )
    }

})

const logoutUser = asyncHandler(async (req, res) => {
    try {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset: {
                    refreshToken: 1 // this removes the field from document
                }
            },
            {
                new: true
            }
        )

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, {}, "User logged Out"))
    } catch (error) {
        return res.status(error.statusCode || 500).json(
            new ApiError(error.statusCode, error.message || "Error Occur in Users")
        )
    }
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")

        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: refreshToken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body

        const user = await User.findById(req.user?._id)
        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

        if (!isPasswordCorrect) {
            throw new ApiError(400, "Invalid old password")
        }

        user.password = newPassword
        await user.save({ validateBeforeSave: false })

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Password changed successfully"))
    } catch (error) {
        return res.status(error.statusCode || 500).json(
            new ApiError(error.statusCode, error.message || "Error Occur in Users")
        )
    }
})

const getCurrentUser = asyncHandler(async (req, res) => {
    try {
        return res
            .status(200)
            .json(new ApiResponse(
                200,
                req.user,
                "User fetched successfully"
            ))
    } catch (error) {
        return res.status(error.statusCode || 500).json(
            new ApiError(error.statusCode, error.message || "Error Occur in Users")
        )
    }
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    try {
        const { fullName, mobile, username, email, altMobile, softSkills, language, address, profession, intrests, social, skills, description } = req.body

        if (!fullName) throw new ApiError(400, "Full Name field is required");
        if (!email) throw new ApiError(400, "Email field is required");
        if (!mobile) throw new ApiError(400, "Mobile field is required");
        if (!username) throw new ApiError(400, "UserName field is required");
        if (!profession) throw new ApiError(400, "Profession field is required");

        const existedUser = await User.findOne(
            {
                _id: { $ne: req.user?._id },
                $or: [{ username }, { mobile }, { email }]
            })

        if (existedUser) {
            throw new ApiError(409, "User with same email or username or mobile already exists")
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    fullName,
                    mobile,
                    username,
                    profession,
                    email,
                    altMobile,
                    softSkills,
                    language,
                    intrests,
                    social,
                    skills,
                    address,
                    description
                }
            },
            { new: true }

        ).select("-password")

        return res
            .status(200)
            .json(new ApiResponse(200, user, "Account details updated successfully"))
    } catch (error) {
        return res.status(error.statusCode || 500).json(
            new ApiError(error.statusCode, error.message || "Error Occur in Users")
        )
    }
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    try {
        const avatarLocalPath = req.file?.filename

        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar file is missing")
        }

        const userAvatar = await User.findById(req.user?._id).select("avatar");
        // console.log(userAvatar.avatar);
        if (userAvatar.avatar && userAvatar.avatar != '') {
            if (fs.existsSync(`public/userImage/${userAvatar.avatar}`)) {
                fs.unlinkSync(`public/userImage/${userAvatar.avatar}`);
            }
        }

        //TODO: delete old image - assignment


        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    avatar: avatarLocalPath
                }
            },
            { new: true }
        ).select("-password")

        return res
            .status(200)
            .json(
                new ApiResponse(200, user, "Avatar image updated successfully")
            )
    } catch (error) {
        return res.status(error.statusCode || 500).json(
            new ApiError(error.statusCode, error.message || "Error Occur in Users")
        )
    }
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    try {
        const coverImgName = req.file?.filename

        if (!coverImgName) {
            throw new ApiError(400, "Cover image file is missing")
        }

        const userCoverImage = await User.findById(req.user?._id).select("coverImage");

        if (userCoverImage.coverImage && userCoverImage.coverImage != '') {
            if (fs.existsSync(`public/userImage/${userCoverImage.coverImage}`)) {
                fs.unlinkSync(`public/userImage/${userCoverImage.coverImage}`);
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    coverImage: coverImgName
                }
            },
            { new: true }
        ).select("-password")

        return res
            .status(200)
            .json(
                new ApiResponse(200, user, "Cover image updated successfully")
            )
    } catch (error) {
        return res.status(error.statusCode || 500).json(
            new ApiError(error.statusCode, error.message || "Error Occur in Users")
        )
    }
})


const updateUserEducation = asyncHandler(async (req, res) => {
    try {
        const items = req.body
        // console.log(items)
        const userId = req.user?._id;

        if (!userId) {
            throw new ApiError(400, "User id is missing")
        }

        // if (!degree) throw new ApiError(400, "Degree field is required");
        // if (!universityName) throw new ApiError(400, "universityName field is required");
        // if (!universityLocation) throw new ApiError(400, "universityLocation field is required");
        // if (!startOn) throw new ApiError(400, "startOn field is required");

        const user = await User.findByIdAndUpdate(req.user?._id,
            {
                $set: {
                    education: items
                }
            }, { new: true }).select('_id username mobile fullName education')

        if (!user) {
            throw new ApiError(500, "Something went wrong while adding Education detail")
        }

        return res.status(201).json(
            new ApiResponse(200, user, "Education Detail Added Successfully")
        )
    } catch (error) {
        return res.status(error.statusCode || 500).json(
            new ApiError(error.statusCode, error.message || "Error Occur in Users")
        )
    }

})

const getUserExperience = asyncHandler(async (req, res) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res
                .status(400)
                .json(new ApiError(400, "User Id is required"))
        }
        if (!req.query.Id) {
            return res
                .status(400)
                .json(new ApiError(400, "Experience Id is required"))
        }


        const experience = await User.aggregate([
            {
                $unwind: "$experience"
            },
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(userId),
                    "experience._id": new mongoose.Types.ObjectId(req.query.Id),
                }
            },
            {
                $group: {
                    _id: "$experience",
                }
            }
        ])

        const slotdata = []
        experience.forEach((element) => {
            slotdata.push(element._id);
        })

        return res.status(201).json(
            new ApiResponse(200, slotdata, `Experience List Fetch Successfully`)
        )

    } catch (error) {
        return res.status(error.statusCode || 500).json(
            new ApiError(error.statusCode, error.message || "Error Occur in Users")
        )
    }
})

const addUserExperience = asyncHandler(async (req, res) => {
    try {
        const { title, designation, companyName, companyLocation, description, startOn, exitOn, isCurrent } = req.body

        if (!title || !designation || !companyName || !companyLocation || !startOn) {
            return res
                .status(400)
                .json(new ApiError(400, "All fields are required"))
        }

        if (!req.user?._id) {
            return res
                .status(400)
                .json(new ApiError(400, "User Id is required"))
        }

        // const nowdate = new Date;

        const addexperience = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $push: {
                    experience: {
                        title,
                        designation,
                        companyName,
                        companyLocation,
                        description,
                        startOn,
                        exitOn,
                        isCurrent,
                    }
                }

            }, { new: true })

        return res.status(201).json(
            new ApiResponse(200, addexperience, `Experience Added Successfully`)
        )
    } catch (error) {
        return res.status(error.statusCode || 500).json(
            new ApiError(error.statusCode, error.message || "Error Occur in Users")
        )
    }

})

const updateExperience = asyncHandler(async (req, res) => {
    try {
        const { Id, title, designation, companyName, companyLocation, description, startOn, exitOn, isCurrent } = req.body

        if (!title || !designation || !companyName || !companyLocation || !startOn) {
            return res
                .status(400)
                .json(new ApiError(400, "All fields are required"))
        }

        if (!req.user?._id) {
            return res
                .status(400)
                .json(new ApiError(400, "User Id is required"))
        }

        const updateExperience = await User.updateOne(
            { _id: req.user?._id, 'experience._id': { $eq: new mongoose.Types.ObjectId(Id) } },
            {
                $set: {
                    "experience.$": {
                        title,
                        designation,
                        companyName,
                        companyLocation,
                        description,
                        startOn,
                        exitOn,
                        isCurrent
                    }
                }

            }, { new: true })

        return res.status(201).json(
            new ApiResponse(200, updateExperience, `Experience Updated Successfully`)
        )
    } catch (error) {
        return res.status(error.statusCode || 500).json(
            new ApiError(error.statusCode, error.message || "Error Occur in Users")
        )
    }

})

const deleteExperience = asyncHandler(async (req, res) => {
    try {
        const { Id } = req.query
        if (!Id) {
            return res
                .status(400)
                .json(new ApiError(400, "Experience Id is required"))
        }

        const deleteExperience = await User.updateOne(
            { _id: req.user?._id },
            {
                $pull: {
                    experience: { _id: Id }
                }

            }, { new: true })

        return res.status(201).json(
            new ApiResponse(200, deleteExperience, `Experience Deleted Successfully`)
        )
    } catch (error) {
        return res.status(error.statusCode || 500).json(
            new ApiError(error.statusCode, error.message || "Error Occur in Users")
        )
    }

})

// const getUserProfile = asyncHandler(async(req, res) => {
//     const {username} = req.params

//     if (!username?.trim()) {
//         throw new ApiError(400, "username is missing")
//     }

//     const userProfile = await User.aggregate([
//         {
//             $match: {
//                 username: username?.toLowerCase()
//             }
//         },
//         {
//             $lookup: {
//                 from: "educations",
//                 localField: "_id",
//                 foreignField: "education",
//                 as: "educations"
//             }
//         },
//         {
//             $lookup: {
//                 from: "experiences",
//                 localField: "_id",
//                 foreignField: "experience",
//                 as: "experiences"
//             }
//         },
//         // {
//         //     $addFields: {
//         //         subscribersCount: {
//         //             $size: "$subscribers"
//         //         },
//         //         channelsSubscribedToCount: {
//         //             $size: "$subscribedTo"
//         //         },
//         //         isSubscribed: {
//         //             $cond: {
//         //                 if: {$in: [req.user?._id, "$subscribers.subscriber"]},
//         //                 then: true,
//         //                 else: false
//         //             }
//         //         }
//         //     }
//         // },
//         {
//             $project: {
//                 fullName: 1,
//                 username: 1,
//                 experiences:1,
//                 // subscribersCount: 1,
//                 // channelsSubscribedToCount: 1,
//                 // isSubscribed: 1,
//                 avatar: 1,
//                 coverImage: 1,
//                 email: 1

//             }
//         }
//     ])

//     if (!userProfile?.length) {
//         throw new ApiError(404, "profile does not exists")
//     }

//     return res
//     .status(200)
//     .json(
//         new ApiResponse(200, userProfile[0], "User profile fetched successfully")
//     )
// })

// const getUserProfile = asyncHandler(async (req, res) => {
//     const user = await User.aggregate([
//         {
//             $match: {
//                 _id: new mongoose.Types.ObjectId(req.user._id)
//             }
//         },
//         {
//             $lookup: {
//                 from: "educations",
//                 localField: "_id",
//                 foreignField: "user",
//                 as: "education_detail",

//             }
//         },{
//         $lookup: {
//             from: "experiences",
//             localField: "_id",
//             foreignField: "user",
//             as: "experience_detail",

//         }}
//     ])

//     return res
//         .status(200)
//         .json(
//             new ApiResponse(
//                 200,
//                 user,
//                 "User profile fetched successfully"
//             )
//         )
// })

const getUserProfile = asyncHandler(async (req, res) => {

    try {
        const { username } = req.query
        if (!username) throw new ApiError(400, "UserName is required");

        const existedUser = await User.findOne({ username: username }).select("-password -refreshToken")
        if (!existedUser) throw new ApiError(400, "No User Found! Invaild username");

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    existedUser,
                    "User profile fetched successfully"
                )
            )
    } catch (error) {
        return res.status(error.statusCode || 500).json(
            new ApiError(error.statusCode, error.message || "Error Occur in Users")
        )
    }
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    // getUserChannelProfile,
    getUserProfile,
    updateUserEducation,
    getUserExperience,
    addUserExperience,
    updateExperience,
    deleteExperience,
}