const express = require("express")
const router = express.Router()
const authController = require('../controllers/authController')
const fileController = require('../controllers/fileController')

/**
 * Auth routes
 */
router.get('/', authController.homepage);
router.get('/register', authController.registerPage);
router.post('/register', authController.processRegistration);
router.get('/verifyEmail/:email/:verificationToken', authController.verifyEmail);
router.get('/login', authController.loginPage);
router.post('/login', authController.processLogin);
router.get('/forgot-password', authController.forgotPasswordPage);
router.post('/sendRecoveryLink', authController.sendRecoveryLink);
router.get('/resetPassword/:email/:resetToken', authController.resetPasswordPage);
router.post('/resetPassword', authController.resetPassword);
router.get('/logout', authController.logout);
/**
 * Main routes
 */
router.get('/MyUploads/:_id?', fileController.MyUploads);
router.post('/createFolder', fileController.createFolder);
router.post('/uploadFile', fileController.fileUpload);
router.post('/deleteFile', fileController.deleteFile);
router.post('/deleteDirectory', fileController.deleteDirectory);
router.post('/getUser', fileController.getUser);
router.post('/share', fileController.Share);
router.post('/get-file-shared-with', fileController.getFileSharedWith);
router.post('/removeSharedAccess', fileController.removeSharedAccess);
router.get('/sharedWithMe/:_id?', fileController.sharedWithMe);
router.post('/deleteSharedDirectory', fileController.deleteSharedDirectory);
router.post('/deleteSharedFile', fileController.deleteSharedFile);
router.post('/downloadFile', fileController.downloadFile);
router.post('/renameFolder', fileController.renameFolder);
router.post('/renameFile', fileController.renameFile);
router.get('/search', fileController.search);
router.post('/shareViaLink', fileController.shareViaLink);
router.get('/sharedViaLink/:hash', fileController.sharedViaLink);
router.post('/deleteLink', fileController.deleteLink);
router.get('/mySharedLinks', fileController.mySharedLinks);
router.post('/downloadPublicFile', fileController.downloadPublicFile);
// router.post('/moveFile', fileController.moveFile);
// router.post('/getAllFolders', fileController.getAllFolders);
//download file in public links

module.exports = router