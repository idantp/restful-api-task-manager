const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const schema = new mongoose.Schema({
    name:{
        type: String,
        trim: true,
        required: true,
    },
    password:{
        type: String,
        required: true,
        trim: true,
        validate(value){
            if(value.length <= 6){
                throw new Error('Password is too short. Must contain at least 6 charachters')
            }else if(value.toLowerCase().includes('password')){
                throw new Error('Password cannot contain the word \'password\'')
            }
        }
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        required: true,
        unique: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email is invalid.')
            }
        }
    },
    age:{
        type: Number,
        default: 0,
        validate(value) {
            if(value < 0){
                throw new Error('Age cannot be negative.')
            }
        }
    },
    tokens:[{
        token:{
            type:String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})

// creating a FK
schema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'userId'
})

// hases plain text password before saving a new user's password
schema.pre('save', async function (next){
    // the user being saved
    const user = this
    // true if user is created, or user's password is updated
    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password,8)
    }
    // calls 'save' method
    next()
})

schema.pre('remove', async function (next) {
    const user = this
    await Task.deleteMany({'userId': user._id})
    next()
})

// called automatically from JSON.stringify(user) which is automatically called from res.send(user)
schema.methods.toJSON = function() {
    const user = this
    const userObject = user.toObject()
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar
    return userObject
}

// instance method which generates a token for a specific user
schema.methods.generateAuthToken = async function (){
    const user = this
    const token = jwt.sign({_id: user._id.toString()}, process.env.JWT_SECERT)
    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
}

// adding a function the schema which verify credentials
schema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })
    if(!user){
        throw new Error('Unable to login')
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if(!isMatch){
        throw new Error('Unable to login')
    }
    return user
}

const User = mongoose.model('User', schema)

// const me = new User({
//     name: '      Idan ',
//     email: '    IDAN@gmail.com   ',
//     password: '      blaaaaaaaaaaaaaaaaaaaaaaaa'
// })

module.exports = User