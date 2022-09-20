require('../models/database')
const User = require('../models/User')
const PublicLinks = require('../models/publicLinks')
const ObjectId = require('mongodb').ObjectId;
const fileSystem = require("fs");
const rimraf = require("rimraf");
const redirectUrl = "https://the-filesharer-app.herokuapp.com";
const bcrypt = require("bcrypt");
/**
 * func/
 * recursive function to get folder from uploaded
 */
function recursiveGetFolder(files, _id){
    var singleFile = null
    for (var a = 0; a < files.length; a++) {
        const file = files[a];
        // return if file type is folder and ID is found
        if(file.type == "folder"){
            if(file._id == _id){
                return file
            }

            //if it has files, perform a recursion
            if(file.files.length > 0){
                singleFile = recursiveGetFolder(file.files, _id);
                //return file if found in subfolders
                if(singleFile != null){
                    return singleFile
                }
            }
        }
        
    }
}
/**
 * func/
 * recursive function to get file from uploaded
 */
function recursiveGetFile(files, _id){
    var singleFile = null
    for (var a = 0; a < files.length; a++) {
        const file = files[a];
        // return if file type is not folder and ID is found
        if(file.type != "folder"){
            if(file._id == _id){
                return file
            }
        }
        // return if file type is folder and ID is found
        if(file.type == "folder" && file.files.length > 0){
            singleFile = recursiveGetFile(file.files, _id)
            //if file is found
            if(singleFile != null){
                return singleFile
            }
        }
        
    }
}
/**
 * func/
 * recursive function to get file from public links
 */
function recursiveGetPublicLinkFile(files, _id){
    var singleFile = null
    for (var a = 0; a < files.length; a++) {
        const file = files[a];
        // return if file type is not folder and ID is found
        if(file.type != "folder"){
            return file
        }
        // return if file type is folder and ID is found
        if(file.type == "folder" && file.files.length > 0){
            singleFile = recursiveGetFile(file.files, _id)
            //if file is found
            if(singleFile != null){
                return singleFile
            }
        }
        
    }
}
/**
 * func/
 * function to add new uploaded object and return the updated Array from uploaded
 */
function getUpdatedArray(arr, _id, uploadedObj){
    for (var a = 0; a < arr.length; a++) {
        // push in files if type is folder and ID is found
        if(arr[a].type == "folder"){
            if(arr[a]._id == _id){
                arr[a].files.push(uploadedObj);
                arr[a]._id = ObjectId(arr[a]._id)
            }

            //if it has files, perform a recursion
            if(arr[a].files.length > 0){
                arr[a]._id = ObjectId(arr[a]._id)
                getUpdatedArray(arr[a].files, _id, uploadedObj);
            }
        }
        
    }
    return arr
}
/**
 * func/
 * function to remove object and return the updated Array from uploaded
 */
function removeFileReturnUpdated(arr, _id){
    for (var a = 0; a < arr.length; a++) {
        if(arr[a].type != "folder" && arr[a]._id == _id){
            //remove from uploads folder
            try {
                fileSystem.unlinkSync(arr[a].filePath)
            } catch (error) {
                console.log(error)
            }
            // remove file from array
            arr.splice(a, 1);
            break;
        }
        //recurse if it has subfolders
        if(arr[a].type == "folder" && arr[a].files.length > 0){
            arr[a]._id = ObjectId(arr[a]._id);
            removeFileReturnUpdated(arr[a].files, _id)
        }       
    }
    return arr
}
/**
 * func/
 * function to remove folder and return the updated Array from uploaded
 */
 function removeFolderReturnUpdated(arr, _id){
    for (var a = 0; a < arr.length; a++) {
        if(arr[a].type == "folder"){
            if(arr[a]._id == _id){
                //remove folder and subdirectories
                rimraf(arr[a].folderPath, function(){
                    console.log("done")
                })
                //remove file from array
                arr.splice(a, 1);
                break;
            } 
            //recurse if it has subfolders
            if(arr[a].files.length > 0){
                arr[a]._id = ObjectId(arr[a]._id);
                removeFolderReturnUpdated(arr[a].files, _id)
            }            
        }      
    }
    return arr
}
/**
 * func/
 * function to remove shared folder and return the updated Array from sharedWithMe
 */
function removeSharedFolderReturnUpdated(arr, _id){
    for (var a = 0; a < arr.length; a++) {
        var file = (typeof arr[a].file === "undefined") ? arr[a] : arr[a].file
        if(file.type == "folder"){
            if(file._id == _id){
                arr.splice(a, 1);
                break;
            }
            //recurse if it has subfolders
            if(file.files.length > 0){
                file._id = ObjectId(file._id);
                removeSharedFolderReturnUpdated(file.files, _id)
            }            
        }      
    }
    return arr
}
/**
 * func/
 * function to remove shared file and return the updated Array from sharedWithMe
 */
 function removeSharedFileReturnUpdated(arr, _id){
    for (var a = 0; a < arr.length; a++) {
        var file = (typeof arr[a].file === "undefined") ? arr[a] : arr[a].file
        if(file.type != "folder" && file._id == _id){
            arr.splice(a, 1);
            break;           
        } 
        //recurse if it has subfolders
        if(file.type == "folder" && file.files.length > 0){
            arr[a]._id = ObjectId(arr[a]._id);
            removeSharedFileReturnUpdated(file.files, _id)
        }      
    }
    return arr
}
/**
 * func/
 * recursive function to get shared folders
 */
function recursiveGetSharedFolder(files, _id){
    var singleFile = null
    for (var a = 0; a < files.length; a++) {
        var file = (typeof files[a].file === "undefined") ? files[a] : files[a].file
        // return if file type is folder and ID is found
        if(file.type == "folder"){
            if(file._id == _id){
                return file
            }

            //if it has files, perform a recursion
            if(file.files.length > 0){
                singleFile = recursiveGetSharedFolder(file.files, _id);
                //return file if found in subfolders
                if(singleFile != null){
                    return singleFile
                }
            }
        }
        
    }
}
/**
 * func/
 * recursive function to get shared files
 */
function recursiveGetSharedFile(files, _id){
    var singleFile = null
    for (var a = 0; a < files.length; a++) {
        var file = (typeof files[a].file === "undefined") ? files[a] : files[a].file
        // return if file type is not folder and ID is found
        if(file.type != "folder"){
            if(file._id == _id){
                return file
            }
        }

        //if it has files, perform a recursion
        if(file.type == "folder" && file.files.length > 0){
            singleFile = recursiveGetSharedFile(file.files, _id);
            //return file if found in subfolders
            if(singleFile != null){
                return singleFile
            }
        }
        
    }
}
/**
 * func/
 * function to rename subfolders
 */
function renameSubFolders(arr, oldName, newName){
    for (var a = 0; a < arr.length; a++) {
        //set folder paths by splitting in parts by /
        var pathParts = (arr[a].type == "folder") ? arr[a].folderPath.split("/") : arr[a].filePath.split("/")
        var newPath = ""
        for (var b = 0; b < pathParts.length; b++) {
            if(pathParts[b] == oldName){
                pathParts[b] == newName
            }
            newPath += pathParts[b]
            //append / at the end except for the last index
            if(b < pathParts.length - 1){
                newPath += "/"
            }
        }
        if(arr[a].type == "folder"){
            arr[a].folderPath = newPath
            if(arr[a].files.length > 0){
                renameSubFolders(arr[a].files, _id, newName)
            }
        }else{
            arr[a].filePath = newPath
        }
    }
}
/**
 * func/
 * function to rename folder and return updated
 */
function renameFolderReturnUpdated(arr, _id, newName){
    for (var a = 0; a < arr.length; a++) {
        if(arr[a].type == "folder"){
            if(arr[a]._id == _id){
                const oldFolderName = arr[a].folderName
                var folderPathParts = arr[a].folderPath.split("/")
                var newFolderPath = ""
                for (var b = 0; b < folderPathParts.length; b++) {
                    if(folderPathParts[b] == oldFolderName){
                        folderPathParts[b] = newName
                    }
                    newFolderPath += folderPathParts[b]
                    //append / at the end except for the last index
                    if(b < folderPathParts.length - 1){
                        newFolderPath += "/"
                    }
                }
                //rename the folder
                fileSystem.rename(arr[a].folderPath, newFolderPath, function(error){
                    //
                })
                //update array values
                arr[a].folderName = newName
                arr[a].folderPath = newFolderPath
                //update subfolders path
                renameSubFolders(arr[a].files, oldFolderName, newName);
                break;
            }
            if(arr[a].files.length > 0){
                renameFolderReturnUpdated(arr[a].files, _id, newName)
            }
        }
    }
    return arr;
}
/**
 * func/
 * function to rename folder and return updated
 */
function renameFileReturnUpdated(arr, _id, newName){
    for (var a = 0; a < arr.length; a++) {
        if(arr[a].type != "folder"){
            if(arr[a]._id == _id){
                const oldFileName = arr[a].name
                var filePathParts = arr[a].filePath.split("/")
                var newFilePath = ""
                for (var b = 0; b < filePathParts.length; b++) {
                    if(filePathParts[b] == oldFileName){
                        filePathParts[b] = newName
                    }
                    newFilePath += filePathParts[b]
                    //append / at the end except for the last index
                    if(b < filePathParts.length - 1){
                        newFilePath += "/"
                    }
                }
                //rename the file
                fileSystem.rename(arr[a].filePath, newFilePath, function(error){
                    //
                })
                //update array values
                arr[a].name = newName
                arr[a].filePath = newFilePath
                break;
            }
        }
        //if it has sub folder perform a recursion
        if(arr[a].type == "folder" && arr[a].files.length > 0){
            renameFileReturnUpdated(arr[a].files, _id, newName)
        }
    }
    return arr;
}
/**
 * func/
 * function to update move folder and return updated
 */
function updateMovedToFolderReturnUpdated(arr, _id, moveFolder){
    for (var a = 0; a < arr.length; a++) {
        if(arr[a].type == "folder"){
            if(arr[a]._id == _id){
                moveFolder.folderPath = arr[a].folderPath + "/" + moveFolder.folderName
                arr[a].files.push(moveFolder)
                break;
            }

            //if it has files, perform a recursion
            if(arr[a].files.length > 0){
                arr[a]._id = ObjectId(arr[a]._id)
                updateMovedToFolderReturnUpdated(arr[a].files, _id, moveFolder);
            }
        }
        
    }
    return arr
}
/**
 * func/
 * function to move folder and return updated
 */
function moveFolderReturnUpdated(arr, _id, moveFolder, moveToFolder){
    for (var a = 0; a < arr.length; a++) {
        if(arr[a].type == "folder"){
            if(arr[a]._id == _id){
                //rename will move the folder
                const newPath = moveToFolder.folderPath + "/" + arr[a].folderName
                fileSystem.rename(arr[a].folderPath, newPath, function(){
                    //
                })
                arr.splice(a, 1)
                break;
            }

            //if it has files, perform a recursion
            if(arr[a].files.length > 0){
                arr[a]._id = ObjectId(arr[a]._id)
                moveFolderReturnUpdated(arr[a].files, _id, moveFolder, moveToFolder);
            }
        }
        
    }
    return arr
}
/**
 * func/
 * recursive function to get all folders of a user
 */
function recursiveGetAllFolders(files, _id){
    var folders = []
    for (var a = 0; a < files.length; a++) {
        const file = files[a];
        // return if file type is folder and ID is found
        if(file.type == "folder"){
            //get all except the selected
            if(file._id != _id){
                folders.push(file)
                if(file.files.length > 0){
                    var tempFolders = recursiveGetAllFolders(file.files, _id)
                    //push returned folder into array
                    for (var b = 0; b < tempFolders.length; b++) {
                        folders.push(tempFolders[b]) 
                    }
                }
            }
        }       
    }
    return folders
}
/**
 * func/
 * recursive function to search uploaded files
 */
function recursiveSearch(files, query){
    var singleFile = null
    for (var a = 0; a < files.length; a++) {
        const file = files[a];
        if(file.type == "folder"){
            // search folder --case sensitive
            if(file.folderName.toLowerCase().search(query.toLowerCase()) > -1){
                return file
            }
            if(file.files.length > 0){
                singleFile = recursiveSearch(file.files, query);
                //return file if found in subfolders
                if(singleFile != null){
                    if(singleFile.type != "folder"){
                        singleFile.parent = file;
                    }
                    return singleFile
                }
            }
        }else{
            if(file.name.toLowerCase().search(query.toLowerCase()) > -1){
                return file
            }
        }
        
    }
}
/**
 * func/
 * recursive function to search shared files
 */
 function recursiveSearchShared(files, query){
    var singleFile = null
    for (var a = 0; a < files.length; a++) {
        var file = (typeof files[a].file === "undefined") ? files[a] : files[a].file
        // return if file type is not folder and ID is found
        if(file.type == "folder"){
            if(file.folderName.toLowerCase().search(query.toLowerCase()) > -1){
                return file
            }

            if(file.files.length > 0){
                singleFile = recursiveSearchShared(file.files, query);
                if(singleFile != null){
                    if(singleFile.type != "folder"){
                        singleFile.parent = file;
                    }
                    return singleFile
                }
            }
        }else{
            if(file.name.toLowerCase().search(query.toLowerCase()) > -1){
                return file
            }
        }    
    }
}
/**
 * Get/
 * My uploadspage
 */
exports.MyUploads = async(req, res) =>{
    try {
        const _id = req.params._id;
        if(req.user){
            const user = await User.findOne({
                "_id": ObjectId(req.user._id)
            });
            var uploaded = null
            var folderName = ""
            var createdAt = ""
            if(typeof _id == "undefined"){
                uploaded = user.uploaded;
            }else{
                var folderObj = await recursiveGetFolder(user.uploaded, _id)
                if(folderObj == null){
                    req.status = "error"
                    req.message = "Folder not found"
                    res.render('my-uploads',{ title: 'My Uploads | File Share', req: req, "uploaded": uploaded, "_id": _id, "folderName": folderName, "createdAt": createdAt });
                    return false
                }
                uploaded = folderObj.files
                folderName = folderObj.folderName
                createdAt = folderObj.createdAt
            }
            if(uploaded == null){
                req.status = "error"
                req.message = "Directory not found"
                res.render('my-uploads',{ title: 'My Uploads | File Share', req: req, "uploaded": uploaded, "_id": _id, "folderName": folderName, "createdAt": createdAt });
                return false
            }
            res.render('my-uploads',{ title: 'My Uploads | File Share', req: req, "uploaded": uploaded, "_id": _id, "folderName": folderName, "createdAt": createdAt });
        }else{
            res.redirect("/login");
        }
        // return;
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}

/**
 * post/
 * createFolder
 */
 exports.createFolder = async(req, res) =>{
    try {
        const name = req.body.name
        const _id = req.body._id
        if(req.user){
            const user = await User.findOne({
                "_id": ObjectId(req.user._id)
            });
            var uploadedObj = {
                "_id": ObjectId(),
                "type": "folder",
                "folderName": name,
                "files": [],
                "folderPath": "",
                "createdAt": new Date().getTime()
            }
            var folderPath = ""
            var updatedArray = []
            if(_id == ""){
                folderPath = "public/uploads/"+ user.username + "/" +name;
                uploadedObj.folderPath = folderPath;
                if(!fileSystem.existsSync("public/uploads/"+ user.username )){
                    fileSystem.mkdirSync("public/uploads/"+ user.username );
                }
            }else{
                var folderObj = await recursiveGetFolder(user.uploaded, _id);
                uploadedObj.folderPath = folderObj.folderPath + "/" + name;
                updatedArray = await getUpdatedArray(user.uploaded, _id, uploadedObj);
            }
            if(uploadedObj.folderPath == ""){
                req.status = "error"
                req.message = "Folder name must not be empty"
                res.redirect('/MyUploads');
                return false
            }
            if(fileSystem.existsSync(uploadedObj.folderPath)){
                req.status = "error"
                req.message = "Folder already exists"
                res.redirect('/MyUploads');
                return false
            }
            fileSystem.mkdirSync(uploadedObj.folderPath);
            if(_id == ""){
                await User.updateOne({
                    "_id": ObjectId(req.user._id)
                },{
                    $push: {
                        "uploaded" : uploadedObj
                    }
                });
            }else{
                for (var a = 0; a < updatedArray.length; a++) {
                    updatedArray[a]._id = ObjectId(updatedArray[a]._id)                    
                }
                await User.updateOne({
                    "_id": ObjectId(req.user._id)
                },{
                    $push: {
                        "uploaded" : updatedArray
                    }
                });
            }
            res.redirect('/MyUploads/'+_id);
        }else{
            res.redirect("/login");
        }
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}
/**
 * post/
 * uploadFile
 */
exports.fileUpload = async(req, res) =>{
    try {
        if(req.user){
            if(!req.files) {
                req.status = "error"
                req.message = "Unexpected Error"
                res.render('my-uploads',{ req: req });
            } else {
                const user = await User.findOne({
                    "_id": ObjectId(req.user._id)
                });
                let avatar = req.files.file;
                if(avatar.size > 0){
                    const _id = req.body._id
                    var uploadedObj = {
                        "_id" : ObjectId(),
                        "size" : avatar.size,
                        "name" : avatar.name,
                        "type" : avatar.type,
                        "filePath" : "",
                        "createdAt" : new Date().getTime()
                    }
                    var filePath = ""
                    if(_id == ""){
                        filePath = "public/uploads/" + user.username + "/" + new Date().getTime() + "-" + avatar.name;
                        uploadedObj.filePath = filePath;
                        
                        if(!fileSystem.existsSync("public/uploads/" + user.username)){
                            fileSystem.mkdirSync("public/uploads/"+ user.username );
                        }
                        await User.updateOne({
                            "_id": ObjectId(req.user._id)
                        }, {
                            $push : {
                                "uploaded" : uploadedObj
                            }
                        })
                        avatar.mv(filePath);
                        res.redirect("/MyUploads/" +_id)
                    }else{
                        var folderObj = await recursiveGetFolder(user.uploaded, _id)
                        uploadedObj.filePath = folderObj.folderPath + "/" + avatar.name;
                        var updatedArray = await getUpdatedArray(user.uploaded, _id, uploadedObj);
                        for(var a = 0; a < updatedArray.length; a++){
                            updatedArray[a]._id = ObjectId(updatedArray[a]._id)
                        }
                        await User.updateOne({
                            "_id": ObjectId(req.user._id)
                        }, {
                            $set : {
                                "uploaded" : updatedArray
                            }
                        })
                        avatar.mv(uploadedObj.filePath);
                        res.redirect("/MyUploads/" +_id)
                    }
                }else{
                    req.status = "error"
                    req.message = "Please upload a valid file format"
                    res.render('my-uploads',{ req: req });
                }
            }
        }else{
            res.redirect("/login")
        } 
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}
/**
 * post/
 * deleteFile
 */
exports.deleteFile = async(req, res) =>{
    try {
        const _id = req.body._id
        if(req.user){
            const user = await User.findOne({
                "_id": ObjectId(req.user._id)
            });
            var updatedArray = await removeFileReturnUpdated(user.uploaded, _id)
            for (var a = 0; a < updatedArray.length; a++) {
                updatedArray[a]._id = ObjectId(updatedArray[a]._id)                
            }
            await User.updateOne({
                "_id": ObjectId(req.user._id)
            }, {
                $set : {
                    "uploaded" : updatedArray
                }
            })
            res.redirect("/MyUploads")
        }else{
            res.redirect("/login")
        } 
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}
/**
 * post/
 * deleteDirectory
 */
exports.deleteDirectory = async(req,res) =>{
    try {
        const _id = req.body._id
        if(req.user){
            const user = await User.findOne({
                "_id": ObjectId(req.user._id)
            });
            var updatedArray = await removeFolderReturnUpdated(user.uploaded, _id)
            for (var a = 0; a < updatedArray.length; a++) {
                updatedArray[a]._id = ObjectId(updatedArray[a]._id)                
            }
            await User.updateOne({
                "_id": ObjectId(req.user._id)
            }, {
                $set : {
                    "uploaded" : updatedArray
                }
            })
            res.redirect("/MyUploads")
        }else{
            res.redirect("/login")
        }
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}
/**
 * post/
 * getUser
 */
exports.getUser = async(req, res) =>{
    try {
        const email = req.body.email
        if(req.user){
            const user = await User.findOne({
                "email": email
            });
            if(user == null){
                res.json({
                    "status": "error",
                    "message":  "User " + email + " not found"
                })
                return false
            }
            if(!user.isVerified){
                res.json({
                    "status": "error",
                    "message":  "User " + user.username + " account is not verified"
                })
                return false
            }
            res.json({
                "status": "success",
                "message":  "Fetched data",
                "user": {
                    "_id" : user._id,
                    "name" : user.username,
                    "email" :  user.email
                }
            })
            return false
        }else{
            res.json({
                "status": "error",
                "message":  "Please login to perform this action"
            })
            return false
        }
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}
/**
 * post/
 * share
 */
exports.Share = async(req, res) => {
    try {
        const _id = req.body._id
        const type = req.body.type
        const email = req.body.email
        if(req.user){
            const user = await User.findOne({
                "email": email
            });
            if(user == null){
                req.session.status = "error"
                req.session.message = "User " +email + " does not exist"
                res.redirect("/MyUploads")
                return false
            }
            if(!user.isVerified){
                req.session.status = "error"
                req.session.message = "User " +user.username + " is not verified"
                res.redirect("/MyUploads")
                return false
            }
            var me = await User.findOne({
                "_id": ObjectId(req.user._id)
            });
            var file = null;
            if(type == "folder"){
                file = await recursiveGetFolder(me.uploaded, _id);
            }else{
                file = await recursiveGetFile(me.uploaded, _id);
            }
            if(file == null){
                req.session.status = "error"
                req.session.message = "File does not exist"
                res.redirect("/MyUploads")
                return false
            }
            file._id = ObjectId(file._id);
            const sharedBy = me
            await User.findOneAndUpdate({
                "_id": user._id
            }, {
                $push : {
                    "sharedWithMe" : {
                        "_id" : ObjectId(),
                        "file" : file,
                        "sharedBy" : {
                            "_id" : ObjectId(sharedBy._id),
                            "name" : sharedBy.username,
                            "email" : sharedBy.email
                        },
                        "createdAt" : new Date().getTime()
                    }
                }
            });
            req.session.status = "success"
            req.session.message = "File has been shared with " + user.username + "."
            const backUrl = req.header("Referer") || '/';
            res.redirect(backUrl)
        }else{
            res.redirect("/login")
        }
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}
/**
 * post/
 * users a file is shared with
 */
exports.getFileSharedWith = async(req, res) => {
    try {
        const _id = req.body._id
        if(req.user){
            const tempUsers = await User.find({
                $and:[{
                    "sharedWithMe.file._id" : ObjectId(_id)
                }, {
                    "sharedWithMe.sharedBy._id" : ObjectId(req.user._id)
                }]
            })
            var users = []
            for (var a = 0; a < tempUsers.length; a++) {
                var sharedObj = null
                for (var b = 0; b < tempUsers[a].sharedWithMe.length; b++) {
                    if(tempUsers[a].sharedWithMe[b].file._id == _id){
                        sharedObj = {
                            "_id" : tempUsers[a].sharedWithMe[b]._id,
                            "sharedAt" : tempUsers[a].sharedWithMe[b].createdAt
                        }
                    }                   
                }
                users.push({
                    "_id" : tempUsers[a]._id,
                    "username" : tempUsers[a].username,
                    "email" : tempUsers[a].email,
                    "sharedObj" : sharedObj
                })
            }
            res.json({
                "status" : "success",
                "message" : "Record has been fetched",
                "users" : users
            })
            return false
        }else{
            res.json({
                "status": "error",
                "message":  "Please login to perform this action"
            })
            return false
        }
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}
/**
 * post/
 * remove shared access
 */
exports.removeSharedAccess = async(req, res)=> {
    try {
        if(req.user){
            const _id = req.body._id
            const user = await User.findOne({
                $and : [{
                    "sharedWithMe._id" : ObjectId(_id)
                }, {
                    "sharedWithMe.sharedBy._id" : ObjectId(req.user._id)
                }]
            })
            for (var a = 0; a < user.sharedWithMe.length; a++) {
                if(user.sharedWithMe[a]._id == _id){
                    user.sharedWithMe.splice(a, 1)
                }
            }
            await User.findOneAndUpdate({
                $and : [{
                    "sharedWithMe._id" : ObjectId(_id)
                }, {
                    "sharedWithMe.sharedBy._id" : ObjectId(req.user._id)
                }]
                }, {
                $set : {
                    "sharedWithMe" : user.sharedWithMe
                }
            })
            req.session.status = "success"
            req.session.message = "Shared access has been removed"
            const backUrl = req.header("Referer") || '/';
            res.redirect(backUrl)
        }else{
            res.redirect("/login")
        }
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}
/**
 * get/
 * shared With Me
 */
exports.sharedWithMe = async(req, res) => {
    try {
        const _id = req.params._id
        if(req.user){
            const user = await User.findOne({
                "_id": ObjectId(req.user._id)
            });
            var files = null
            var folderName = ""
            if(typeof _id == "undefined"){
                files = user.sharedWithMe
            }else{
                var folderObj = await recursiveGetSharedFolder(user.sharedWithMe, _id)
                if(folderObj == null){
                    req.status = "error"
                    req.message = "Folder not found"
                    res.render("error", { req: req })
                    return false
                }
                files = folderObj.files
                folderName = folderObj.folderName
            }
            if(files == null){
                req.status = "error"
                req.message = "Directory not found"
                res.render("error", { req: req })
                return false
            }
            res.render('sharedWithMe',{ title: 'Shared With Me | File Share', req: req, "files": files, "_id": _id, "folderName": folderName });
            return false
        }else{
            res.redirect("/login")
        }
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}
/**
 * post/
 * delete shared folder access
 */
exports.deleteSharedDirectory = async(req, res) =>{
    try {
        const _id = req.body._id
        if(req.user){
            const user = await User.findOne({
                "_id": ObjectId(req.user._id)
            });
            var updatedArray = await removeSharedFolderReturnUpdated(user.sharedWithMe, _id)
            for (var a = 0; a < updatedArray.length; a++) {
                updatedArray[a]._id = ObjectId(updatedArray[a]._id)                
            }
            await User.updateOne({
                "_id": ObjectId(req.user._id)
            }, {
                $set : {
                    "sharedWithMe" : updatedArray
                }
            })
            res.redirect("/sharedWithMe")
        }else{
            res.redirect("/login")
        }
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}
/**
 * post/
 * delete shared file access
 */
exports.deleteSharedFile = async(req, res) =>{
    try {
        const _id = req.body._id
        if(req.user){
            const user = await User.findOne({
                "_id": ObjectId(req.user._id)
            });
            var updatedArray = await removeSharedFileReturnUpdated(user.sharedWithMe, _id)
            for (var a = 0; a < updatedArray.length; a++) {
                updatedArray[a]._id = ObjectId(updatedArray[a]._id)                
            }
            await User.updateOne({
                "_id": ObjectId(req.user._id)
            }, {
                $set : {
                    "sharedWithMe" : updatedArray
                }
            })
            res.redirect("/sharedWithMe")
        }else{
            res.redirect("/login")
        } 
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}
/**
 * post/
 * download shared file
 */
exports.downloadFile = async(req, res) =>{
    try {
        const _id = req.body._id
        if(req.user){
            const user = await User.findOne({
                "_id": ObjectId(req.user._id)
            });
            var fileUploaded = await recursiveGetFile(user.uploaded, _id)
            var fileShared = await recursiveGetSharedFile(user.sharedWithMe, _id)
            if(fileUploaded == null && fileShared == null){
                res.json({
                    "status": "error",
                    "message": "file is neither uploaded nor shared with you"
                })
                return false
            }
            var file = (fileUploaded == null) ? fileShared : fileUploaded
            fileSystem.readFile(file.filePath, function(error, data){
                res.json({
                    "status": "success",
                    "message": "Data fetched!",
                    "arrayBuffer": data,
                    "fileType": file.type,
                    "fileName": file.name
                })
            })
            return false
        }else{
            res.json({
                "status": "error",
                "message":  "Please login to perform this action"
            })
            return false
        }
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}
/**
 * post/
 * rename file
 */
exports.renameFile = async(req, res) =>{
    try {
        const _id = req.body._id
        const name = req.body.name
        if(req.user){
            const user = await User.findOne({
                "_id": ObjectId(req.user._id)
            });
            var updatedArray = await renameFileReturnUpdated(user.uploaded, _id, name)
            for (var a = 0; a < updatedArray.length; a++) {
                updatedArray[a]._id = ObjectId(updatedArray[a]._id)                
            }
            await User.updateOne({
                "_id": ObjectId(req.user._id)
            }, {
                $set : {
                    "uploaded" : updatedArray
                }
            })
            res.redirect("/MyUploads")
        }else{
            res.redirect("/login")
        }
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}
/**
 * post/
 * rename folder
 */
exports.renameFolder = async(req, res) =>{
    try {
        const _id = req.body._id
        const name = req.body.name
        if(req.user){
            const user = await User.findOne({
                "_id": ObjectId(req.user._id)
            });
            var updatedArray = await renameFolderReturnUpdated(user.uploaded, _id, name)
            for (var a = 0; a < updatedArray.length; a++) {
                updatedArray[a]._id = ObjectId(updatedArray[a]._id)                
            }
            await User.updateOne({
                "_id": ObjectId(req.user._id)
            }, {
                $set : {
                    "uploaded" : updatedArray
                }
            })
            res.redirect("/MyUploads")
        }else{
            res.redirect("/login")
        }
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}
/**
 * post/
 * move file
 */
exports.moveFile = async(req, res) => {
    try {
        const _id = req.body._id
        const type = req.body.type
        const folder = req.body.folder
        if(req.user){
            const user = await User.findOne({
                "_id": ObjectId(req.user._id)
            });
            var updatedArray = user.uploaded
            if(type == "folder"){
                //get folders
                var moveFolder = await recursiveGetFolder(user.uploaded, _id)
                var moveToFolder = await recursiveGetFolder(user.uploaded, _id)
                //move folder
                updatedArray = await moveFolderReturnUpdated(user.uploaded, _id, moveFolder, moveToFolder)
                //update folder array where file is
                updatedArray = await updateMovedToFolderReturnUpdated(updatedArray, folder, moveFolder)
            }
            await User.updateOne({
                "_id": ObjectId(req.user._id)
            }, {
                $set : {
                    "uploaded" : updatedArray
                }
            })
            res.redirect("/MyUploads")
        }else{
            res.redirect("/login") 
        }
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}
/**
 * post/
 * get all folders
 */
exports.getAllFolders = async(req, res) => {
    try {
        const _id = req.body._id
        const type = req.body.type
        if(req.user){
            const user = await User.findOne({
                "_id": ObjectId(req.user._id)
            });
            var tempFolders = recursiveGetAllFolders(user.uploaded, _id)
            var folders = []
            for (var a = 0; a < tempFolders.length; a++) {
                folders.push({
                    "_id" : tempFolders[a]._id,
                    "folderName": tempFolders[a].folderName
                })
                res.json({
                    "status" : "success",
                    "message" : "record fetched",
                    "folders" :  folders
                })
                return false
            }
        }else{
            res.json({
                "status" : "error",
                "message" : "login to perform this action"
            })
        }
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"})
    }
}
/**
 * post/
 * share via link
 */
exports.shareViaLink = async(req, res) =>{
    try {
        const _id = req.body._id
        if(req.user){
            const user = await User.findOne({
                "_id": ObjectId(req.user._id)
            });
            var file = await recursiveGetFile(user.uploaded, _id)
            if(file == null && folder == null){
                req.session.status = "error"
                req.session.message = "File does not exist"
                res.redirect("/MyUploads")
                return false
            }
            bcrypt.hash(file.name, 10, async function(error, hash){
                hash = hash.substring(10, 20)
                const link  = redirectUrl + "/sharedViaLink/" + hash
                await PublicLinks.create({
                    "hash" : hash,
                    "file" : file,
                    "uploadedBy" : {
                        "_id" : user._id,
                        "name" : user.username,
                        "email" : user.email
                    },
                    "createdAt" : new Date().getTime()
                });
                req.session.status = "success"
                req.session.message = "share link " + link
                res.redirect("/MyUploads")
            })
            return false
        }else{
            res.redirect("/login") 
        }
    } catch(error){
        res.status(500).send({message: error.message || "Error occured"})
    }
}
/**
 * get/
 * share via link
 */
exports.sharedViaLink = async(req, res)=>{
    try {
        const hash = req.params.hash
        const link = await PublicLinks.findOne({
            "hash": hash
        });
        if(link == null){
            req.session.status = "error"
            req.session.message = "Link expired"
            res.render('sharedViaLink',{ title: 'Shared | File Share', req: req });
            return false
        }
        res.render('sharedViaLink',{ title: 'Shared | File Share', req: req, "link" : link });
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"})
    }
}
/**
 * get/
 * my shared links
 */
exports.mySharedLinks = async(req, res) => {
    try {
        if(req.user){
            const links = await PublicLinks.find({
                "uploadedBy._id": ObjectId(req.user._id)
            });
            res.render('mySharedLinks',{ title: 'My shared links | File Share', req: req, "links" : links });
        }else{
            res.redirect("/login")
        }
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"})
    }
}
/**
 * post/
 *  delete a shared link
 */
exports.deleteLink = async(req, res) => {
    try {
        const _id = req.body._id
        if(req.user){
            const link = await PublicLinks.findOne({
                $and: [{
                    "uploadedBy._id": ObjectId(req.user._id)
                }, {
                    "_id" : ObjectId(_id)
                }]
            });
            if(link == null){
                req.session.status = "error"
                req.session.message = "Link expired"
                res.redirect("/mySharedLinks");
                return false
            }
            await PublicLinks.deleteOne({
                $and: [{
                    "uploadedBy._id": ObjectId(req.user._id)
                }, {
                    "_id" : ObjectId(_id)
                }]
            });
            req.session.status = "success"
            req.session.message = "Link has been deleted"
            res.redirect("/mySharedLinks");
            return false
        }else{
            res.redirect("/login")
        }
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"})
    }
}
/**
 * get/
 *  query db
 */
exports.search = async(req, res) => {
    try {
        const search = req.query.search
        if(req.user){
            const user = await User.findOne({
                "_id": ObjectId(req.user._id)
            });
            var fileUploaded = await recursiveSearch(user.uploaded, search)
            var fileShared = await recursiveSearchShared(user.sharedWithMe, search)
            //check if file is uploaded or shared with user
            if(fileUploaded == null && fileShared == null){
                req.session.status = "error"
                req.session.message = "File/Folder '" + search + "' is neither uploaded nor shared with you"
                res.render("search", {title: 'Search results | File Share', req: req});
                return false
            }
            var file = (fileUploaded == null) ? fileShared : fileUploaded
            file.isShared = (fileUploaded == null)
            res.render("search", {title: 'Search results | File Share', req: req, "file" : file});
            return false
        }else{
            res.redirect("/login")
        }
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"})
    }
}
/**
 * post/
 * download shared public file
 */
 exports.downloadPublicFile = async(req, res) =>{
    try {
        const _id = req.body._id
        const hash = req.body.hash
        const link = await PublicLinks.findOne({
            "hash": hash
        });
        var fileShared = await recursiveGetPublicLinkFile(link.file, _id)
        if(fileShared == null){
            res.json({
                "status": "error",
                "message": "file is neither uploaded nor shared with you"
            })
            return false
        }
        var file = fileShared
        fileSystem.readFile(file.filePath, function(error, data){
            res.json({
                "status": "success",
                "message": "Data fetched!",
                "arrayBuffer": data,
                "fileType": file.type,
                "fileName": file.name
            })
        })
        return false
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}
