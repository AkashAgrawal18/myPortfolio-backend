import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        profession: {
            type: String,
            // required: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowecase: true,
            trim: true,
        },
        mobile: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        altMobile: {
            type: String,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String, // localpath url

        },
        coverImage: {
            type: String, // localpath url
        },
        education: [
            {
                degree: {
                    type: String,
                    index: true,
                    required: true
                },
                universityName: {
                    type: String,
                    index: true,
                    required: true
                },
                universityLocation: {
                    type: String,
                    required: true
                },
                description: {
                    type: String,
                },
                startOn: {
                    type: Date,
                    required: true
                },
                completedOn: {
                    type: Date,
                },
                isCurrent: {

                    type: Boolean,
                },

            }
        ],
        experience: [
            {
                title: {
                    type: String,
                    required: true,
                    index: true
                },
                designation: {
                    type: String,
                    required: true,

                },
                companyName: {
                    type: String,
                    required: true,
                    index: true
                },
                companyLocation: {
                    type: String,
                    required: true
                },
                description: [],
                startOn: {
                    type: Date,
                    required: true
                },
                exitOn: {
                    type: Date,
                },
                isCurrent: {
                    type: Boolean,

                }
            }
        ],

        softSkills: {
            type: Array(),
        },
        language: [],
        intrests: [],
        social: [
            {
                title: {
                    type: String
                },
                link: {
                    type: String
                },
                icon: {
                    type: String
                }
            }
        ],
        skills: [
            {
                title: {
                    type: String
                },
                rating: {
                    type: Number
                },
                experience: {
                    type: String
                }
            }
        ],
        address: {
            type: String,

        },
        description: {
            type: String,

        },
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        refreshToken: {
            type: String
        }

    },
    {
        timestamps: true
    }
)

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,

        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)