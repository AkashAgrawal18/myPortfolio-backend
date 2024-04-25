import { Router } from 'express';
import {
    deleteProject,
    myProjects,
    getProjectById,
    addProject,
    getAllProjects,
    // togglePublishStatus,
    updateProject
} from "../controllers/project.controler.js"

import {projectUpload} from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.route("/all").get(getAllProjects)

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/")
    .get(myProjects)
    .post(projectUpload.single("coverImage"),addProject);

router
    .route("/detail")
    .get(getProjectById)
    .delete(deleteProject)
    .patch(projectUpload.single("coverImage"),updateProject);

// router.route("/toggle/publish/:ProjectId").patch(togglePublishStatus);

export default router