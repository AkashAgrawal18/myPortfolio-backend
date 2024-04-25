import multer from "multer";

const adminStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/images")
    },
    filename: function (req, file, cb) {
      const d = new Date();
      const time = d.getTime();
      cb(null, `${time}${file.originalname}`)
    }
  })

const userStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/userImage")
    },
    filename: function (req, file, cb) {
      const d = new Date();
      const time = d.getTime();
      cb(null, `${time}${file.originalname}`)
    }
  })

const projectStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/projectImage")
    },
    filename: function (req, file, cb) {
      const d = new Date();
      const time = d.getTime();
      cb(null, `${time}${file.originalname}`)
    }
  })
  
const adminUpload = multer({storage:adminStorage})
const userUpload = multer({storage:userStorage})
const projectUpload = multer({storage:projectStorage})

export {adminUpload ,userUpload, projectUpload}