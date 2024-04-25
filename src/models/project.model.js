import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const projectSchema = new Schema(
    {

        title: {
            type: String,
            required: true,
            index: true
        },
        coverImage: {
            type: String,

        },
        status: {
            type: String,
            enum: ['Completed', 'Is Runing', 'On Hold'],
            default: "Completed",
            required: true,
            index: true,
        },
        domain: {
            type: String,
            required: true,
            index: true,
        },
        shortDesc: {
            type: String,
        },
        startOn: {
            type: Date,
            required: true
        },
        completedOn: {
            type: Date,
        },
        description: [],
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }

    },
    {
        timestamps: true
    }
)

projectSchema.plugin(mongooseAggregatePaginate)

export const Project = mongoose.model("Project", projectSchema)