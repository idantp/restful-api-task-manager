const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const sendWelcomeMail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'idantp@gmail.com',
        subject: 'Welcome message',
        text: `Hello ${name}, thank you for joining us.`
    })
}

const sendCancelationMail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'idantp@gmail.com',
        subject: 'Cancelation message',
        text: `Hello ${name}, we're sorry you leave us. please let us know why.`
    })
}

module.exports = {
    sendWelcomeMail,
    sendCancelationMail
}
