const express = require('express')
require('./db/mongoose.js')
const userRouter = require('./routers/user.js')
const taskRouter = require('./routers/task.js')


const app = express()
const port = process.env.PORT

// configuring express so every incoming JSON will be parsed to an object 
app.use(express.json())
// registering routers to app
app.use(userRouter)
app.use(taskRouter)



app.listen(port, () => {
    console.log("Server is up on port: " + port);
})
