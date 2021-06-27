const express = require('express')
const Task = require('../models/task.js')
const router = new express.Router()
const auth = require('../middleware/authentication')

// Create task
router.post('/tasks', auth, async (req, res) => {
    const task = Task({
        ...req.body,
        userId: req.user._id
    })
    try{
        await task.save()
        res.status(201).send(task)
    }catch(e){
        res.status(400).send(e)
    }
})


// GET /tasks?completed=true
// GET /tasks?limit=2&skip=3
// GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const query = req.query
    const sort = {}
    if(query.completed){
        match.completed = query.completed === 'true'
    }
    if(query.sortBy){
        const parts = query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }
    try{
        // const tasks = await Task.find({ 'userId': req.user._id})
        // res.send(tasks)
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(query.limit),
                skip: parseInt(query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)
    }catch(e){
        res.status(500).send(e)
    }
})

// Read a certain task
router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    try{
        const task = await Task.findOne({'userId': req.user._id, _id})
        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    }catch(e){
        res.status(500).send(e)        
    }
})

// Update task
router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowdUpdates = ['description','completed']
    const isValidUpdate = updates.every((update) => {
        return allowdUpdates.includes(update)
    })
    if (!isValidUpdate){
        return res.status(400).send({error: 'Invalid updates !'})
    }
    const _id = req.params.id

    try{
        const task = await Task.findOne({'userId': req.user._id, _id})
        if(!task){
            return res.status(404).send()
        }
        updates.forEach((update) => {
            task[update] = req.body[update]
        })
        await task.save()
        res.send(task)
    } catch(e){
        res.status(400).send(e)
    }})

// Delete task
router.delete('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    try{
        // const task = await Task.findByIdAndDelete(_id)
        const task = await Task.findOneAndDelete({'userId': req.user._id, _id})
        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    }catch(e){
        res.status(500).send(e)
    }
})

module.exports = router