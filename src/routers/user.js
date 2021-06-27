const express = require('express')
const User = require('../models/user.js')
const router = new express.Router()
const auth = require('../middleware/authentication')
const multer = require('multer')
const sharp = require('sharp')
const {sendWelcomeMail, sendCancelationMail} = require('../emails/account')

router.post('/users/login', async (req, res) => {
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({user, token})
    } catch(e){
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async(req, res) => {
    try{
        req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token)
        await req.user.save()
        res.send()
    } catch(e) {
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth, async(req, res) => {
    try{
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch(e) {
        res.status(500).send()
    }
})

// Create user 
router.post('/users', async (req, res) => {
    const user = User(req.body)
    try{
        await user.save()
        const token = await user.generateAuthToken()
        // though it is an async function we wouldn't want the response to wait for sending the email 
        sendWelcomeMail(user.email, user.name)
        res.status(201).send({user, token})
    }catch(e){
        res.status(400).send(e)
    }
})

// Read users
router.get('/users', auth, async (req, res) => {
    try{
        const users = await User.find()
        res.send(users)
    }catch(e){
        res.status(500).send(e)
    }
})

// Read users
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

// Read a specific user using express' route paramaters
// router.get('/users/:id', async (req, res) => {
//     const _id = req.params.id
//     try{
//         const user = await User.findById(_id)
//         if(!user){
//             return res.status(404).send()
//         }
//         res.send(user)
//     }catch(e){
//         res.status(500).send(e)
//     }
// })

// Update user
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowdUpdates = ['name', 'email', 'password', 'age']
    const isValidUpdate = updates.every((update) => {
        return allowdUpdates.includes(update)
    })
    if (!isValidUpdate){
        return res.status(400).send({error: 'Invalid updates !'})
    }
    try{
        // must use 'save' method, because mongoose 'update' methods bypass 'save' method,
        // and therefore the use of pre-function for 'save' is not reachable
        const user = req.user
        updates.forEach((update) => {
            user[update] = req.body[update]
        })
        await user.save()
        res.send(user)
    }catch(e){
        // validation or server errors
        res.status(400).send(e)
    }
})

// Delete user
router.delete('/users/me', auth, async (req, res) => {
    try{
        await req.user.remove()
        sendCancelationMail(req.user.email, req.user.name)
        res.send(req.user)
    }catch(e){
        res.status(500).send(e)
    }
})

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb){
        // file must end with .jpg or .jpeg or .png 
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error('File types are restircted to .jpg .jpeg or .png'))
        }
        cb(null, true)
    }
})
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    try{
        const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()
        req.user.avatar = buffer
        await req.user.save()
        res.send()    
    } catch(e){
        res.status(500).send()
    }
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    try{
        req.user.avatar = undefined
        req.user.save()
        res.send()
    } catch(e) {
        res.status(500).send()
    }
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if(!user || !user.avatar){
            throw new Error()
        }
        // setting up content type header
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch(e) {
        res.status(404).send()
    }
})


module.exports = router